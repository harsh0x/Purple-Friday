/**
 * WCAG 2.1 Color Contrast & Recommendation Utilities
 */

/**
 * Converts 3 or 6 hex digits to sRGB array [0..255, 0..255, 0..255]
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "").trim();
  let r = 0;
  let g = 0;
  let b = 0;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

/**
 * Computes standard WCAG relative luminance (0..1)
 */
export function getRelativeLuminance(hex: string): number {
  const [r8, g8, b8] = hexToRgb(hex);

  const [r, g, b] = [r8, g8, b8].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colours (1..21)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 10) / 10;
}

export interface ContrastRecommendation {
  name: string;
  hex: string;
  contrastRatio: number;
  reason: string;
}

/**
 * Given a logo colour and product colors, suggests the 3 best contrasting colors
 * with editorial print-shop reasoning.
 */
export function recommendContrastingProductColors(
  logoHex: string,
  productColors: Array<{ name: string; hex: string }>
): ContrastRecommendation[] {
  if (!productColors || productColors.length === 0) {
    return [];
  }

  const logoLum = getRelativeLuminance(logoHex);
  const isLogoDark = logoLum < 0.45;

  const scored = productColors.map((color) => {
    const ratio = getContrastRatio(logoHex, color.hex);
    let reason = "";

    if (isLogoDark) {
      if (ratio >= 7) {
        reason = `Your bold dark mark will pop vibrantly on ${color.name} (high ${ratio}:1 contrast)`;
      } else if (ratio >= 4.5) {
        reason = `Clean and legible offset contrast on ${color.name} (${ratio}:1 ratio)`;
      } else {
        reason = `Subtle tone-on-tone mood on ${color.name} (${ratio}:1 ratio)`;
      }
    } else {
      if (ratio >= 7) {
        reason = `Your bright graphic stands out sharply against ${color.name} (striking ${ratio}:1 contrast)`;
      } else if (ratio >= 4.5) {
        reason = `High legibility with balanced separation on ${color.name} (${ratio}:1 ratio)`;
      } else {
        reason = `Refined low-contrast aesthetic on ${color.name} (${ratio}:1 ratio)`;
      }
    }

    return {
      name: color.name,
      hex: color.hex,
      contrastRatio: ratio,
      reason,
    };
  });

  // Sort by highest contrast ratio descending
  scored.sort((a, b) => b.contrastRatio - a.contrastRatio);

  // Return top 3 recommendations
  return scored.slice(0, 3);
}
