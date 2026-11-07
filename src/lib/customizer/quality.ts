export interface DpiCalculationOptions {
  imageWidthPx: number;
  imageHeightPx: number;
  targetPrintWidthMm: number;
  scale?: number;
  printMethod?: string;
}

export interface DpiCalculationResult {
  dpi: number;
  isLowQuality: boolean;
  rating: "Excellent" | "Good" | "Fair" | "Low";
  minRecommendedDpi: number;
  message: string;
  offerCleanup: boolean;
}

/**
 * Calculates estimated print DPI based on physical product dimensions and image pixels.
 */
export function calculatePrintDpi({
  imageWidthPx,
  targetPrintWidthMm,
  scale = 1.0,
  printMethod = "Screen Print",
}: DpiCalculationOptions): DpiCalculationResult {
  if (imageWidthPx <= 0 || targetPrintWidthMm <= 0) {
    return {
      dpi: 0,
      isLowQuality: true,
      rating: "Low",
      minRecommendedDpi: 200,
      message: "No logo detected or invalid dimensions.",
      offerCleanup: true,
    };
  }

  // Convert physical target width in mm to inches
  // Effective physical print size in inches accounting for on-canvas scale
  const physicalWidthInches = (targetPrintWidthMm * Math.max(0.05, scale)) / 25.4;
  const dpi = Math.round(imageWidthPx / physicalWidthInches);

  // Print method requirements
  const isEmbroidery = printMethod.toLowerCase().includes("embroidery");
  const minRecommendedDpi = isEmbroidery ? 150 : 200;

  let rating: "Excellent" | "Good" | "Fair" | "Low";
  let isLowQuality = false;
  let message = "";

  if (dpi >= 300) {
    rating = "Excellent";
    message = "Vector-grade sharpness. Ready for press.";
  } else if (dpi >= 200) {
    rating = "Good";
    message = "Crisp print quality for commercial merchandise.";
  } else if (dpi >= minRecommendedDpi) {
    rating = "Fair";
    message = "Acceptable clarity. Fine micro-text under 8pt may soften slightly.";
  } else {
    rating = "Low";
    isLowQuality = true;
    message = `Resolution is low (${dpi} DPI, minimum recommended is ${minRecommendedDpi} DPI). Artwork may appear pixelated in print.`;
  }

  return {
    dpi,
    isLowQuality,
    rating,
    minRecommendedDpi,
    message,
    offerCleanup: isLowQuality,
  };
}

