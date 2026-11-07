import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { v2 as cloudinary } from "cloudinary";
import { sanitizeSvg } from "./security/sanitize-svg";

export interface StoredUpload {
  id: string;
  uploaderId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  url: string;
  storagePath?: string;
  isPrivate: boolean;
  purpose: "general" | "logo" | "team-design" | "proof" | "review";
  createdAt: string;
}

// In-memory fallback upload registry (synced with DB if connected)
const UPLOAD_REGISTRY = new Map<string, StoredUpload>();

// Configure Cloudinary if credentials provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes("sample")
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Local storage directory
const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export interface ProcessUploadOptions {
  buffer: Buffer;
  originalFilename: string;
  uploaderId: string;
  purpose?: "general" | "logo" | "team-design" | "proof" | "review";
}

/**
 * Validates, re-encodes, and securely stores an uploaded file.
 */
export async function processAndStoreUpload({
  buffer,
  originalFilename,
  uploaderId,
  purpose = "general",
}: ProcessUploadOptions): Promise<StoredUpload> {
  // 1. Check for empty or oversized payload
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file: Uploaded content contains 0 bytes.");
  }

  // Hard limit: no file of any type may exceed 10 MB
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("File exceeds maximum upload limit of 10 MB.");
  }

  // 2. Detect real file type from magic bytes
  const detectedType = await fileTypeFromBuffer(buffer);
  const lowerExt = path.extname(originalFilename).toLowerCase();

  let finalBuffer: Buffer;
  let finalMimeType: string;
  let finalWidth: number | undefined;
  let finalHeight: number | undefined;
  let isPrivate = false;

  // Handle SVG (file-type returns undefined for XML/SVG text files)
  const isSvgByText =
    buffer.slice(0, 1024).toString("utf-8").toLowerCase().includes("<svg") ||
    lowerExt === ".svg";

  if (isSvgByText) {
    // 5 MB limit for SVG / images
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("File exceeds image size limit of 5 MB.");
    }

    // Sanitize with isomorphic-dompurify
    const { sanitizedSvg, isPolyglot } = sanitizeSvg(buffer);

    if (isPolyglot) {
      throw new Error("Polyglot file rejected: File contains unauthorized markup layers.");
    }

    // Rasterize sanitized SVG to PNG with sharp to completely neutralize vector exploits
    try {
      const rasterized = await sharp(Buffer.from(sanitizedSvg))
        .resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true })
        .png({ quality: 95 })
        .toBuffer({ resolveWithObject: true });

      finalBuffer = rasterized.data;
      finalMimeType = "image/png";
      finalWidth = rasterized.info.width;
      finalHeight = rasterized.info.height;
    } catch {
      throw new Error("Failed to rasterize SVG into safe production format.");
    }
  } else if (detectedType?.mime === "application/pdf" || lowerExt === ".pdf") {
    // PDF validation
    if (detectedType?.mime !== "application/pdf") {
      throw new Error("File type mismatch: Extension is .pdf but content is not a valid PDF.");
    }

    if (purpose !== "team-design") {
      throw new Error("PDF uploads are only permitted for team design briefs.");
    }

    // 10 MB limit for PDF
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error("File exceeds PDF size limit of 10 MB.");
    }

    finalBuffer = buffer;
    finalMimeType = "application/pdf";
    isPrivate = true; // Stored privately, never rendered inline
  } else {
    // Image Validation (PNG, JPEG, WebP)
    if (!detectedType) {
      throw new Error("Unsupported file format: Magic bytes could not be verified.");
    }

    const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedMimes.includes(detectedType.mime)) {
      throw new Error(`Disallowed file type: ${detectedType.mime}. Only PNG, JPEG, and WebP are accepted.`);
    }

    // Check 5 MB limit for images
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("File exceeds image size limit of 5 MB.");
    }

    // Verify extension matches detected magic bytes (prevent wrong extension attacks)
    const mimeExtMap: Record<string, string[]> = {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    };

    const validExtensions = mimeExtMap[detectedType.mime] || [];
    if (lowerExt && !validExtensions.includes(lowerExt)) {
      throw new Error(
        `Extension mismatch: File claims to be ${lowerExt} but content is ${detectedType.mime}.`
      );
    }

    // Re-encode image with sharp (strips EXIF, ICC profiles, and embedded polyglots)
    try {
      const processed = await sharp(buffer)
        .rotate() // auto-orient based on EXIF before stripping
        .resize({ width: 4000, height: 4000, fit: "inside", withoutEnlargement: true })
        .png({ quality: 90 }) // standardize to lossless PNG
        .toBuffer({ resolveWithObject: true });

      finalBuffer = processed.data;
      finalMimeType = "image/png";
      finalWidth = processed.info.width;
      finalHeight = processed.info.height;
    } catch {
      throw new Error("Corrupted or malicious image payload detected.");
    }
  }

  // 3. Generate Opaque Upload ID
  const uploadId = crypto.randomUUID();
  const ext = finalMimeType === "application/pdf" ? "pdf" : "png";
  const storedFilename = `${uploadId}.${ext}`;

  let url: string;
  let storagePath: string | undefined;

  // 4. Save to Cloudinary or Local Storage
  if (isCloudinaryConfigured && !isPrivate) {
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "purple-friday/uploads",
          public_id: uploadId,
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Cloudinary upload failed"));
          else resolve(result);
        }
      );
      uploadStream.end(finalBuffer);
    });

    url = uploadResult.secure_url;
  } else {
    // Local storage fallback (never guessable path, served via opaque route)
    ensureStorageDir();
    storagePath = path.join(STORAGE_DIR, storedFilename);
    fs.writeFileSync(storagePath, finalBuffer);
    url = `/api/uploads/${uploadId}`;
  }

  const record: StoredUpload = {
    id: uploadId,
    uploaderId,
    originalFilename: path.basename(originalFilename),
    mimeType: finalMimeType,
    sizeBytes: finalBuffer.length,
    width: finalWidth,
    height: finalHeight,
    url,
    storagePath,
    isPrivate,
    purpose,
    createdAt: new Date().toISOString(),
  };

  UPLOAD_REGISTRY.set(uploadId, record);
  return record;
}

/**
 * Retrieves an upload by its opaque ID
 */
export function getUploadById(id: string): StoredUpload | undefined {
  return UPLOAD_REGISTRY.get(id);
}

/**
 * Enforces ownership of an upload before attaching to a design or order.
 */
export function verifyUploadOwnership(uploadId: string, currentUploaderId: string): boolean {
  const upload = UPLOAD_REGISTRY.get(uploadId);
  if (!upload) return false;
  return upload.uploaderId === currentUploaderId;
}
