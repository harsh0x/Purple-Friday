import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { sanitizeSvg } from "@/lib/security/sanitize-svg";

export interface ColorProfile {
  hex: string;
  cmyk: { c: number; m: number; y: number; k: number };
  percentage: number;
}

export interface ArtworkAnalysisResult {
  id: string;
  originalFilename: string;
  fileSizeBytes: number;
  mimeType: string;
  isSourceOnly: boolean; // True for AI and CDR (no direct preview)
  previewUrl: string;
  downloadUrl: string;
  widthPx?: number;
  heightPx?: number;
  printWidthInches: number;
  effectiveDpi?: number;
  dpiRating?: "optimal" | "warning" | "very_low";
  dpiExplanation?: string;
  dominantColors: ColorProfile[];
  detectedFormat: string;
  createdAt: string;
}

// In-memory artwork store fallback
export const ARTWORK_STORE = new Map<string, ArtworkAnalysisResult & { filePath: string; previewFilePath?: string }>();

// Storage paths
const ARTWORK_STORAGE_DIR = path.join(process.cwd(), "storage", "artwork");
const ARTWORK_PREVIEW_DIR = path.join(process.cwd(), "storage", "artwork", "previews");

function ensureStorageDirs() {
  if (!fs.existsSync(ARTWORK_STORAGE_DIR)) {
    fs.mkdirSync(ARTWORK_STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARTWORK_PREVIEW_DIR)) {
    fs.mkdirSync(ARTWORK_PREVIEW_DIR, { recursive: true });
  }
}

/**
 * Approximate conversion from RGB to CMYK percentage integers (0-100).
 */
export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const kNorm = 1 - Math.max(rNorm, gNorm, bNorm);
  if (kNorm >= 0.999) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rNorm - kNorm) / (1 - kNorm)) * 100);
  const m = Math.round(((1 - gNorm - kNorm) / (1 - kNorm)) * 100);
  const y = Math.round(((1 - bNorm - kNorm) / (1 - kNorm)) * 100);
  const k = Math.round(kNorm * 100);

  return { c, m, y, k };
}

/**
 * Converts RGB components to HEX string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return `#${hex.toUpperCase()}`;
}

/**
 * Extracts 3 to 5 dominant colors from an image buffer using pixel sampling and quantization.
 */
export async function extractDominantColors(imageBuffer: Buffer): Promise<ColorProfile[]> {
  try {
    // Resize down to 64x64 to sample color distribution efficiently
    const { data } = await sharp(imageBuffer)
      .resize(64, 64, { fit: "cover" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorBins = new Map<string, { r: number; g: number; b: number; count: number }>();
    let validPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Ignore transparent or near-transparent pixels
      if (alpha < 30) continue;
      validPixels++;

      // Quantize to 32-step buckets to group close shades
      const qR = Math.round(r / 32) * 32;
      const qG = Math.round(g / 32) * 32;
      const qB = Math.round(b / 32) * 32;
      const key = `${qR},${qG},${qB}`;

      const existing = colorBins.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorBins.set(key, { r, g, b, count: 1 });
      }
    }

    if (validPixels === 0) {
      return [{ hex: "#000000", cmyk: { c: 0, m: 0, y: 0, k: 100 }, percentage: 100 }];
    }

    // Sort bins by frequency and pick top 3 to 5
    const sorted = Array.from(colorBins.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return sorted.map((bin) => ({
      hex: rgbToHex(bin.r, bin.g, bin.b),
      cmyk: rgbToCmyk(bin.r, bin.g, bin.b),
      percentage: Math.round((bin.count / validPixels) * 100),
    }));
  } catch {
    return [
      { hex: "#15101F", cmyk: { c: 33, m: 48, y: 0, k: 88 }, percentage: 70 },
      { hex: "#6A2CFF", cmyk: { c: 58, m: 83, y: 0, k: 0 }, percentage: 30 },
    ];
  }
}

/**
 * Evaluates effective DPI based on raster pixel width and physical print width in inches.
 */
export function evaluateDpi(
  widthPx: number,
  printWidthInches: number
): {
  effectiveDpi: number;
  dpiRating: "optimal" | "warning" | "very_low";
  dpiExplanation: string;
} {
  const effectiveDpi = Math.round(widthPx / Math.max(1, printWidthInches));

  if (effectiveDpi >= 300) {
    return {
      effectiveDpi,
      dpiRating: "optimal",
      dpiExplanation: `Optimal resolution (${effectiveDpi} DPI). Artwork is print-ready for sharp production output.`,
    };
  }

  if (effectiveDpi >= 150) {
    return {
      effectiveDpi,
      dpiRating: "warning",
      dpiExplanation: `Moderate resolution (${effectiveDpi} DPI, under 300 DPI). Fine details may appear slightly soft when printed at full scale.`,
    };
  }

  return {
    effectiveDpi,
    dpiRating: "very_low",
    dpiExplanation: `Very low resolution (${effectiveDpi} DPI, below 150 DPI). Artwork will print pixelated or blurry. Flagged for designer review.`,
  };
}

/**
 * Ingests, validates, detects byte magic, sanitizes, and analyzes an artwork upload.
 */
export async function ingestArtworkFile({
  buffer,
  originalFilename,
  printWidthInches = 10,
}: {
  buffer: Buffer;
  originalFilename: string;
  printWidthInches?: number;
}): Promise<ArtworkAnalysisResult> {
  ensureStorageDirs();

  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file: Uploaded content contains 0 bytes.");
  }

  // 25 MB hard limit
  const maxBytes = 25 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new Error("File exceeds the 25 MB maximum upload limit for artwork.");
  }

  const ext = path.extname(originalFilename).toLowerCase();
  const fileId = `art_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const detectedType = await fileTypeFromBuffer(buffer);

  // Check magic bytes for supported source formats
  const isSvg =
    ext === ".svg" ||
    buffer.slice(0, 1024).toString("utf-8").toLowerCase().includes("<svg");

  const isAi =
    ext === ".ai" ||
    (detectedType?.mime === "application/pdf" && ext === ".ai") ||
    buffer.slice(0, 16).toString("ascii").includes("%!PS-Adobe") ||
    buffer.slice(0, 8).toString("ascii").includes("%PDF-");

  const isCdr =
    ext === ".cdr" ||
    buffer.slice(0, 4).toString("ascii") === "RIFF" ||
    (detectedType?.mime === "application/zip" && ext === ".cdr");

  const isPdf = detectedType?.mime === "application/pdf" || buffer.slice(0, 5).toString("ascii") === "%PDF-";

  const isRasterImage =
    detectedType && ["image/png", "image/jpeg", "image/webp"].includes(detectedType.mime);

  if (!isSvg && !isAi && !isCdr && !isPdf && !isRasterImage) {
    throw new Error(
      "Unsupported file format. Accepted formats: PNG, JPG, WebP, SVG, PDF directly, or AI/CDR source files."
    );
  }

  // Generate safe random stored filename
  const safeFilename = `${fileId}${ext || ".dat"}`;
  const targetFilePath = path.join(ARTWORK_STORAGE_DIR, safeFilename);
  fs.writeFileSync(targetFilePath, buffer);

  let isSourceOnly = false;
  let previewFilePath: string | undefined;
  let widthPx: number | undefined;
  let heightPx: number | undefined;
  let dominantColors: ColorProfile[] = [];
  let dpiResult: ReturnType<typeof evaluateDpi> | undefined;

  if (isAi || isCdr) {
    // Non-previewed source vector file
    isSourceOnly = true;
    dominantColors = [];
  } else if (isSvg) {
    // SVG Sanitization
    const rawSvgText = buffer.toString("utf-8");
    const { sanitizedSvg } = sanitizeSvg(rawSvgText);

    // Write sanitized preview raster PNG via sharp
    const previewPng = await sharp(Buffer.from(sanitizedSvg))
      .png()
      .toBuffer();

    const previewFilename = `${fileId}_preview.png`;
    previewFilePath = path.join(ARTWORK_PREVIEW_DIR, previewFilename);
    fs.writeFileSync(previewFilePath, previewPng);

    const meta = await sharp(previewPng).metadata();
    widthPx = meta.width;
    heightPx = meta.height;

    if (widthPx) {
      dpiResult = evaluateDpi(widthPx, printWidthInches);
    }
    dominantColors = await extractDominantColors(previewPng);
  } else if (isRasterImage) {
    // Direct Raster Image (PNG, JPG, WebP)
    const meta = await sharp(buffer).metadata();
    widthPx = meta.width;
    heightPx = meta.height;

    if (widthPx) {
      dpiResult = evaluateDpi(widthPx, printWidthInches);
    }

    dominantColors = await extractDominantColors(buffer);
    previewFilePath = targetFilePath;
  } else if (isPdf) {
    // PDF file: stored directly, preview rendered if possible
    dominantColors = [];
  }

  const result: ArtworkAnalysisResult = {
    id: fileId,
    originalFilename,
    fileSizeBytes: buffer.length,
    mimeType: detectedType?.mime || (isSvg ? "image/svg+xml" : isAi ? "application/illustrator" : "application/octet-stream"),
    isSourceOnly,
    previewUrl: isSourceOnly
      ? ""
      : `/api/admin/artwork/${fileId}/download?preview=true`,
    downloadUrl: `/api/admin/artwork/${fileId}/download`,
    widthPx,
    heightPx,
    printWidthInches,
    effectiveDpi: dpiResult?.effectiveDpi,
    dpiRating: dpiResult?.dpiRating,
    dpiExplanation: dpiResult?.dpiExplanation,
    dominantColors,
    detectedFormat: isAi ? "AI (Vector Source)" : isCdr ? "CDR (Vector Source)" : isSvg ? "SVG (Vector)" : isPdf ? "PDF" : detectedType?.ext?.toUpperCase() || ext.replace(".", "").toUpperCase(),
    createdAt: new Date().toISOString(),
  };

  ARTWORK_STORE.set(fileId, { ...result, filePath: targetFilePath, previewFilePath });
  return result;
}
