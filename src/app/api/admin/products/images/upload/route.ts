import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import sharp from "sharp";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function isValidImageBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedUrls: Array<{
      originalUrl: string;
      large: string;
      medium: string;
      thumb: string;
    }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 25MB maximum limit.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!isValidImageBytes(buffer)) {
        return NextResponse.json(
          { error: `File "${file.name}" has invalid image format (PNG, JPEG, WebP only).` },
          { status: 400 }
        );
      }

      const fileUuid = crypto.randomUUID();

      if (isCloudinaryConfigured()) {
        const uploadedUrl = await uploadBufferToCloudinary(buffer, {
          folder: "purple-friday/products",
          publicId: fileUuid,
          resourceType: "image",
          format: "webp",
        });
        uploadedUrls.push({
          originalUrl: uploadedUrl,
          large: uploadedUrl,
          medium: uploadedUrl,
          thumb: uploadedUrl,
        });
        continue;
      }

      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Local disk storage is disabled in production. Cloudinary must be configured." },
          { status: 500 }
        );
      }

      // Sharp re-encoding to WebP with metadata stripped (local dev fallback)
      try {
        const largeFilename = `${fileUuid}-1600.webp`;
        const mediumFilename = `${fileUuid}-800.webp`;
        const thumbFilename = `${fileUuid}-320.webp`;

        await Promise.all([
          sharp(buffer)
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(path.join(uploadDir, largeFilename)),
          sharp(buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(path.join(uploadDir, mediumFilename)),
          sharp(buffer)
            .resize({ width: 320, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(path.join(uploadDir, thumbFilename)),
        ]);

        uploadedUrls.push({
          originalUrl: `/uploads/products/${largeFilename}`,
          large: `/uploads/products/${largeFilename}`,
          medium: `/uploads/products/${mediumFilename}`,
          thumb: `/uploads/products/${thumbFilename}`,
        });
      } catch {
        // Fallback: write file directly
        const filename = `${fileUuid}.webp`;
        await fs.writeFile(path.join(uploadDir, filename), buffer);
        uploadedUrls.push({
          originalUrl: `/uploads/products/${filename}`,
          large: `/uploads/products/${filename}`,
          medium: `/uploads/products/${filename}`,
          thumb: `/uploads/products/${filename}`,
        });
      }
    }

    return NextResponse.json({ success: true, uploads: uploadedUrls });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload images";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
