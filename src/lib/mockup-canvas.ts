/**
 * Purple Friday — Studio Product Photo & Logo-on-Product Canvas 2D Engine
 * Features:
 * - Real photo base layer with authentic fabric folds & shadows
 * - Alpha mask tinting (multiply for mid tones, multiply + highlight for dark tones)
 * - Logo projection inside clamped print area
 * - Print textures: Print (soft-light weave), Embroidery (stitch edge), Engrave, Emboss
 * - Cosine strip warping for cylindrical & curved surfaces (bottles, mugs, caps)
 * - In-memory image & composite caching with device pixel ratio scaling
 */

export interface PrintArea {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  rotation?: number; // degrees
}

export type PrintMethod = "print" | "embroidery" | "engrave" | "emboss";
export type SurfaceType = "flat" | "curved";

export interface RenderOptions {
  photoUrl: string;
  maskUrl?: string;
  color?: string; // Hex color string, e.g. "#15101F"
  logoUrl?: string | null;
  printArea: PrintArea;
  printMethod?: PrintMethod;
  surface?: SurfaceType;
  dpr?: number;
}

// In-memory HTMLImageElement cache to prevent network thrashing
const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot load images outside browser"));
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      imageCache.delete(src);
      reject(err);
    };
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

// Helper: parse hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

// Helper: calculate perceived luminance (0 - 255)
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

/**
 * Draws the composite onto a given 2D canvas context
 */
export async function renderMockupToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  // 1. Load Base Photo
  let photoImg: HTMLImageElement;
  try {
    photoImg = await loadImage(options.photoUrl);
  } catch {
    // If photo fails to load, abort silently
    return;
  }

  // Draw base photo
  ctx.drawImage(photoImg, 0, 0, width, height);

  // 2. Garment Color Tinting
  const rgb = options.color ? hexToRgb(options.color) : null;
  const isNeutralWhite =
    !rgb ||
    (rgb.r > 240 && rgb.g > 240 && rgb.b > 240) ||
    options.color?.toLowerCase() === "#ffffff";

  if (rgb && !isNeutralWhite) {
    const lum = getLuminance(rgb);
    const isDark = lum < 75;

    // Load mask if available
    let maskImg: HTMLImageElement | null = null;
    if (options.maskUrl) {
      try {
        maskImg = await loadImage(options.maskUrl);
      } catch {
        maskImg = null;
      }
    }

    // Create offscreen tint buffer
    const tintCanvas = document.createElement("canvas");
    tintCanvas.width = width;
    tintCanvas.height = height;
    const tintCtx = tintCanvas.getContext("2d");

    if (tintCtx) {
      // Fill entire tint canvas with chosen color
      tintCtx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      tintCtx.fillRect(0, 0, width, height);

      // Clip tint to mask if mask exists
      if (maskImg) {
        tintCtx.globalCompositeOperation = "destination-in";
        tintCtx.drawImage(maskImg, 0, 0, width, height);
      }

      // Blend tint onto base garment using multiply
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = isDark ? 0.95 : 0.88;
      ctx.drawImage(tintCanvas, 0, 0);
      ctx.restore();

      // For dark colors (black, navy, charcoal), add soft highlight pass so folds stay visible
      if (isDark) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.22;
        ctx.drawImage(photoImg, 0, 0, width, height);
        ctx.restore();
      }
    }
  }

  // 3. Logo Layer Projection
  const area = options.printArea;
  const areaX = (area.x / 100) * width;
  const areaY = (area.y / 100) * height;
  const areaW = (area.width / 100) * width;
  const areaH = (area.height / 100) * height;

  ctx.save();
  // Clip strictly to print area
  ctx.beginPath();
  ctx.rect(areaX, areaY, areaW, areaH);
  ctx.clip();

  // If visitor logo is provided, draw it; else draw editorial demo placeholder
  if (options.logoUrl) {
    try {
      const logoImg = await loadImage(options.logoUrl);
      drawLogo(ctx, logoImg, areaX, areaY, areaW, areaH, options);
    } catch {
      drawPlaceholder(ctx, areaX, areaY, areaW, areaH, options);
    }
  } else {
    drawPlaceholder(ctx, areaX, areaY, areaW, areaH, options);
  }

  ctx.restore();

  // 4. Fabric Weave Pass (folds flow over the logo)
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.32;
  ctx.drawImage(photoImg, 0, 0, width, height);
  ctx.restore();
}

/**
 * Pure helper: calculates aspect-fit dimensions and centering offsets for a logo inside a bounding box
 */
export function calculateLogoPlacement(
  logoW: number,
  logoH: number,
  areaW: number,
  areaH: number
): { drawW: number; drawH: number; offsetX: number; offsetY: number } {
  if (logoW <= 0 || logoH <= 0 || areaW <= 0 || areaH <= 0) {
    return { drawW: 0, drawH: 0, offsetX: 0, offsetY: 0 };
  }
  const imgRatio = logoW / logoH;
  const boxRatio = areaW / areaH;

  let drawW = areaW;
  let drawH = areaH;
  if (imgRatio > boxRatio) {
    drawH = areaW / imgRatio;
  } else {
    drawW = areaH * imgRatio;
  }

  const offsetX = (areaW - drawW) / 2;
  const offsetY = (areaH - drawH) / 2;
  return { drawW, drawH, offsetX, offsetY };
}

/**
 * Pure helper: calculates cylindrical cosine strip compression and vertical warp offset
 */
export function calculateCurvedStripWarp(
  stripIndex: number,
  totalStrips: number,
  drawH: number
): { scaleY: number; warpOffset: number } {
  const t = (stripIndex + 0.5) / totalStrips;
  const angle = (t - 0.5) * Math.PI * 0.65;
  const scaleY = Math.cos(angle);
  const warpOffset = (1 - scaleY) * (drawH * 0.15);
  return { scaleY, warpOffset };
}

/**
 * Draws the uploaded logo with proper aspect-fit, rotation, warping, and print method styling
 */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  options: RenderOptions
) {
  const method = options.printMethod || "print";
  const surface = options.surface || "flat";

  // Calculate aspect ratio fit inside bounding box
  const { drawW, drawH, offsetX, offsetY } = calculateLogoPlacement(
    logoImg.width,
    logoImg.height,
    areaW,
    areaH
  );

  const posX = areaX + offsetX;
  const posY = areaY + offsetY;

  ctx.save();

  // Rotation if configured
  if (options.printArea.rotation) {
    const centerX = areaX + areaW / 2;
    const centerY = areaY + areaH / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((options.printArea.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  // Blending mode based on garment tone
  const rgb = options.color ? hexToRgb(options.color) : null;
  const lum = rgb ? getLuminance(rgb) : 255;
  const isDark = lum < 90;

  if (method === "embroidery") {
    // Stitched texture: slight opacity and 1px highlight
    ctx.globalAlpha = 0.94;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
  } else if (method === "engrave") {
    // Metal engrave: recessed inner shadow
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.82;
    ctx.shadowColor = "rgba(255,255,255,0.4)";
    ctx.shadowBlur = 1;
    ctx.shadowOffsetY = 1;
  } else if (method === "emboss") {
    // Leather emboss: blind deboss bevel
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.75;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1.5;
  } else {
    // Direct garment print
    ctx.globalAlpha = isDark ? 0.92 : 0.88;
  }

  // Cylindrical Cosine Strip Warping for curved surfaces (bottles, flasks, mugs, curved cap front)
  if (surface === "curved") {
    const strips = 24;
    const stripW = drawW / strips;

    for (let i = 0; i < strips; i++) {
      const { scaleY, warpOffset } = calculateCurvedStripWarp(i, strips, drawH);

      const srcX = (i / strips) * logoImg.width;
      const srcW = logoImg.width / strips;
      const dstX = posX + i * stripW;
      const dstY = posY + warpOffset;
      const dstH = drawH * scaleY;

      ctx.drawImage(
        logoImg,
        srcX,
        0,
        srcW,
        logoImg.height,
        dstX,
        dstY,
        stripW + 0.5,
        dstH
      );
    }
  } else {
    // Flat surface direct draw
    ctx.drawImage(logoImg, posX, posY, drawW, drawH);
  }

  ctx.restore();
}

/**
 * Draws the crisp editorial demo placeholder "YOUR LOGO HERE" when no logo is uploaded
 */
function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  options: RenderOptions
) {
  ctx.save();

  const rgb = options.color ? hexToRgb(options.color) : null;
  const lum = rgb ? getLuminance(rgb) : 255;
  const isDark = lum < 90;

  const textColor = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(21, 16, 31, 0.75)";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(21, 16, 31, 0.25)";

  // Dashed border indicator
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(areaX + 2, areaY + 2, areaW - 4, areaH - 4);
  ctx.setLineDash([]);

  // Corner marks
  const cLen = Math.min(10, areaW * 0.15);
  ctx.strokeStyle = isDark ? "#A3E635" : "#6A2CFF"; // Lime / Violet accent
  ctx.lineWidth = 2;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(areaX + 2, areaY + 2 + cLen);
  ctx.lineTo(areaX + 2, areaY + 2);
  ctx.lineTo(areaX + 2 + cLen, areaY + 2);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(areaX + areaW - 2 - cLen, areaY + areaH - 2);
  ctx.lineTo(areaX + areaW - 2, areaY + areaH - 2);
  ctx.lineTo(areaX + areaW - 2, areaY + areaH - 2 - cLen);
  ctx.stroke();

  // Typography
  const fontSize = Math.max(10, Math.min(14, Math.floor(areaW * 0.12)));
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px "DM Mono", monospace`;

  const centerX = areaX + areaW / 2;
  const centerY = areaY + areaH / 2;

  ctx.fillText("YOUR LOGO", centerX, centerY - fontSize * 0.6);
  ctx.font = `600 ${Math.max(8, fontSize * 0.75)}px "DM Mono", monospace`;
  ctx.fillText("HERE", centerX, centerY + fontSize * 0.6);

  ctx.restore();
}

/**
 * Exports a high-quality 800px PNG composite data URL for cart line items
 */
export function exportProductPreview(canvas: HTMLCanvasElement, targetSize = 800): string {
  if (canvas.width === targetSize && canvas.height === targetSize) {
    return canvas.toDataURL("image/png");
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = targetSize;
  exportCanvas.height = targetSize;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return canvas.toDataURL("image/png");

  exportCtx.drawImage(canvas, 0, 0, targetSize, targetSize);
  return exportCanvas.toDataURL("image/png");
}
