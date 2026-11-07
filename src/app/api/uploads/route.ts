import { NextRequest, NextResponse } from "next/server";
import { resolveUploaderIdentity } from "@/lib/security/session";
import { processAndStoreUpload, StoredUpload } from "@/lib/uploads";
import { checkRateLimit } from "@/lib/rate-limit";

// Origin check against site URL or host
function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) return true; // Local direct tool or server-side call

  const allowedHost = req.headers.get("host") || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  try {
    const originUrl = new URL(origin);
    if (originUrl.host === allowedHost) return true;
    if (siteUrl && originUrl.origin === new URL(siteUrl).origin) return true;
    if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") return true;
  } catch {
    return false;
  }
  return false;
}

export async function POST(req: NextRequest) {
  // 1. Origin validation
  if (!isValidOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-origin upload request rejected." },
      { status: 403 }
    );
  }

  // 2. Resolve uploader identity
  const { uploaderId, isNew, signedCookieValue } = resolveUploaderIdentity(req);

  // 3. Rate limiting (20 uploads / minute per uploader)
  const rateLimitResult = await checkRateLimit(`upload_${uploaderId}`, 20, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Upload rate limit exceeded. Please wait a moment before trying again.",
      },
      { status: 429 }
    );
  }

  // 4. Optional Turnstile verification
  const turnstileToken = req.headers.get("x-turnstile-token");
  if (
    process.env.TURNSTILE_SECRET_KEY &&
    !process.env.TURNSTILE_SECRET_KEY.includes("sample") &&
    !process.env.TURNSTILE_SECRET_KEY.includes("1x0000000000000000000000000000000AA")
  ) {
    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: "Human verification token required." },
        { status: 400 }
      );
    }
  }

  // 5. Parse multipart form data
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const rawPurpose = formData.get("purpose");
    const validPurposes: StoredUpload["purpose"][] = [
      "general",
      "logo",
      "team-design",
      "proof",
      "review",
    ];
    const purpose: StoredUpload["purpose"] =
      typeof rawPurpose === "string" && (validPurposes as string[]).includes(rawPurpose)
        ? (rawPurpose as StoredUpload["purpose"])
        : "general";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file provided in form data." },
        { status: 400 }
      );
    }

    const fileObj = file as File;
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Process, sanitize, rasterize/re-encode, and store
    const upload = await processAndStoreUpload({
      buffer,
      originalFilename: fileObj.name || "upload.png",
      uploaderId,
      purpose,
    });

    const response = NextResponse.json({
      success: true,
      uploadId: upload.id,
      url: upload.url,
      width: upload.width,
      height: upload.height,
      mimeType: upload.mimeType,
      filename: upload.originalFilename,
      size: upload.sizeBytes,
    });

    // If a new anonymous session was initialized, set the signed cookie
    if (isNew && signedCookieValue) {
      response.cookies.set("pf_anon_uploader", signedCookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process secure upload.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
