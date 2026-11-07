import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveUploaderIdentity } from "@/lib/security/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyUploadOwnership } from "@/lib/uploads";
import { saveDesign } from "@/lib/designs";

const createDesignSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  uploadId: z.string().optional(),
  previewUrl: z.string().min(1),
  layers: z.record(z.string(), z.unknown()),
  selectedColor: z.string().default("#15101F"),
  view: z.enum(["front", "back"]).default("front"),
  quantity: z.number().int().min(1).default(1),
  options: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const { uploaderId } = resolveUploaderIdentity(req);

  // Rate limiting (30 designs / minute)
  const rateLimitResult = await checkRateLimit(`design_${uploaderId}`, 30, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createDesignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid design payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { uploadId, ...rest } = parsed.data;

    // Verify upload ownership if uploadId is supplied
    if (uploadId) {
      const isOwner = verifyUploadOwnership(uploadId, uploaderId);
      // In development fallback, if upload was saved anonymously across restarts, allow graceful fallback
      if (!isOwner && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Upload does not belong to active session." },
          { status: 403 }
        );
      }
    }

    const design = await saveDesign({
      ...rest,
      uploadId,
      userId: uploaderId,
    });

    return NextResponse.json({
      success: true,
      designId: design.id,
      previewUrl: design.previewUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save design";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
