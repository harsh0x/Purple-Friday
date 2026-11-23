import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import { getDraftCms, saveDraftCms } from "@/server/cms/cms-service";
import { MediaItem } from "@/server/cms/schema";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function isImageInUse(url: string, cms: ReturnType<typeof getDraftCms> extends Promise<infer T> ? T : never): boolean {
  if (!url) return false;

  // Check hero
  if (cms.hero?.primaryButtonUrl?.includes(url) || cms.hero?.secondaryButtonUrl?.includes(url)) return true;

  // Check department tiles
  if (cms.departmentTiles?.some((t) => t.image === url)) return true;

  // Check blog posts
  if (cms.blogPosts?.some((p) => p.coverImage === url || p.contentMarkdown?.includes(url))) return true;

  // Check custom pages
  if (cms.customPages?.some((p) => p.contentMarkdown?.includes(url))) return true;

  // Check core pages
  if (cms.corePages?.some((p) => p.contentMarkdown?.includes(url))) return true;

  // Check SEO OG images
  if (cms.seo?.some((s) => s.ogImage === url)) return true;

  return false;
}

export async function GET() {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const cms = await getDraftCms();
  return NextResponse.json({ success: true, media: cms.media || [] });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  // Origin verification
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const actor = { name: session?.name || "Admin", role: session?.role || "ADMIN" };

  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart Form Upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const alt = (formData.get("alt") as string) || "";

      if (!file) {
        return NextResponse.json({ error: "File required" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
      }

      const mimeType = file.type || "application/octet-stream";
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { error: "Invalid file type. Allowed: PNG, JPG, WebP, SVG" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || (mimeType === "image/png" ? ".png" : ".jpg");
      const safeFilename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

      let fileUrl: string;
      if (isCloudinaryConfigured()) {
        fileUrl = await uploadBufferToCloudinary(buffer, {
          folder: "purple-friday/media",
          publicId: `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          resourceType: "auto",
        });
      } else {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Local disk storage is disabled in production. Cloudinary must be configured." },
            { status: 500 }
          );
        }
        // Save to public/uploads/media in dev
        const uploadDir = path.join(process.cwd(), "public", "uploads", "media");
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, safeFilename), buffer);
        fileUrl = `/uploads/media/${safeFilename}`;
      }
      const mediaItem: MediaItem = {
        id: `med-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
        url: fileUrl,
        filename: file.name,
        alt: alt.trim() || file.name,
        size: file.size,
        mimeType,
        createdAt: new Date().toISOString(),
      };

      const cms = await getDraftCms();
      cms.media = [mediaItem, ...(cms.media || [])];
      await saveDraftCms(cms, actor);

      return NextResponse.json({ success: true, item: mediaItem });
    }

    // 2. Direct JSON register (e.g. external URL or preset image)
    const body = await req.json();
    const { url, filename, alt, mimeType, size } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
    }

    const mediaItem: MediaItem = {
      id: `med-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      url: url.trim(),
      filename: filename || path.basename(url) || "media-asset",
      alt: alt || "",
      size: typeof size === "number" ? size : 0,
      mimeType: mimeType || "image/png",
      createdAt: new Date().toISOString(),
    };

    const cms = await getDraftCms();
    cms.media = [mediaItem, ...(cms.media || [])];
    await saveDraftCms(cms, actor);

    return NextResponse.json({ success: true, item: mediaItem });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Media upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const actor = { name: session?.name || "Admin", role: session?.role || "ADMIN" };

  try {
    const body = await req.json();
    const { id, alt, filename } = body;

    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    const cms = await getDraftCms();
    const item = cms.media?.find((m) => m.id === id);
    if (!item) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    if (typeof alt === "string") item.alt = alt.trim();
    if (typeof filename === "string") item.filename = filename.trim();

    await saveDraftCms(cms, actor);
    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const actor = { name: session?.name || "Admin", role: session?.role || "ADMIN" };
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Media ID required" }, { status: 400 });
  }

  try {
    const cms = await getDraftCms();
    const item = cms.media?.find((m) => m.id === id);
    if (!item) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    // Invariant: verify media is not in use anywhere on the site
    if (isImageInUse(item.url, cms)) {
      return NextResponse.json(
        { error: "Cannot delete media: image is currently in use across the site." },
        { status: 400 }
      );
    }

    // Attempt to remove physical file if it's in public/uploads/media
    if (item.url.startsWith("/uploads/media/")) {
      try {
        const filePath = path.join(process.cwd(), "public", item.url);
        await fs.unlink(filePath);
      } catch {
        // Ignore file not found on disk
      }
    }

    cms.media = cms.media.filter((m) => m.id !== id);
    await saveDraftCms(cms, actor);

    return NextResponse.json({ success: true, message: "Media deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
