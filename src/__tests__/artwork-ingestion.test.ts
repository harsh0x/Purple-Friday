import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  ingestArtworkFile,
  evaluateDpi,
  rgbToCmyk,
  rgbToHex,
  extractDominantColors,
} from "@/server/artwork/artwork-ingestion";

describe("Artwork Ingestion - Color & DPI Math", () => {
  it("converts RGB to approximate CMYK accurately", () => {
    // Pure Red: (255, 0, 0) -> C: 0, M: 100, Y: 100, K: 0
    const redCmyk = rgbToCmyk(255, 0, 0);
    expect(redCmyk.c).toBe(0);
    expect(redCmyk.m).toBe(100);
    expect(redCmyk.y).toBe(100);
    expect(redCmyk.k).toBe(0);

    // Pure Black: (0, 0, 0) -> K: 100
    const blackCmyk = rgbToCmyk(0, 0, 0);
    expect(blackCmyk.k).toBe(100);

    // Brand Violet (#6A2CFF = 106, 44, 255)
    const violetCmyk = rgbToCmyk(106, 44, 255);
    expect(violetCmyk.k).toBe(0);
    expect(violetCmyk.m).toBeGreaterThan(70);
  });

  it("converts RGB to HEX string", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
    expect(rgbToHex(21, 16, 31)).toBe("#15101F");
    expect(rgbToHex(106, 44, 255)).toBe("#6A2CFF");
  });

  it("evaluates DPI tiers accurately without blocking", () => {
    // 3000px over 10 inches = 300 DPI -> optimal
    const optimal = evaluateDpi(3000, 10);
    expect(optimal.effectiveDpi).toBe(300);
    expect(optimal.dpiRating).toBe("optimal");
    expect(optimal.dpiExplanation).toContain("Optimal resolution");

    // 2000px over 10 inches = 200 DPI -> warning (< 300)
    const warning = evaluateDpi(2000, 10);
    expect(warning.effectiveDpi).toBe(200);
    expect(warning.dpiRating).toBe("warning");
    expect(warning.dpiExplanation).toContain("under 300 DPI");

    // 1000px over 10 inches = 100 DPI -> very_low (< 150)
    const veryLow = evaluateDpi(1000, 10);
    expect(veryLow.effectiveDpi).toBe(100);
    expect(veryLow.dpiRating).toBe("very_low");
    expect(veryLow.dpiExplanation).toContain("below 150 DPI");
  });
});

describe("Artwork Ingestion - Formats, Security & Dominant Colors", () => {
  it("ingests raster PNG, computes DPI, and extracts 3 to 5 dominant colors", async () => {
    // Create a 600x600 PNG with solid violet background
    const pngBuffer = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 106, g: 44, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await ingestArtworkFile({
      buffer: pngBuffer,
      originalFilename: "client_brand_logo.png",
      printWidthInches: 5, // 600px / 5in = 120 DPI (very_low)
    });

    expect(result.id).toBeDefined();
    expect(result.isSourceOnly).toBe(false);
    expect(result.effectiveDpi).toBe(120);
    expect(result.dpiRating).toBe("very_low");
    expect(result.dominantColors.length).toBeGreaterThanOrEqual(1);
    expect(result.dominantColors[0].hex).toBe("#6A2CFF");
    expect(result.dominantColors[0].cmyk).toBeDefined();
  });

  it("sanitizes SVG with malicious script and rasterizes it for safe preview", async () => {
    const maliciousSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
        <rect width="400" height="400" fill="#D8FF3F"/>
        <script>alert('xss')</script>
      </svg>
    `;

    const result = await ingestArtworkFile({
      buffer: Buffer.from(maliciousSvg),
      originalFilename: "vector_badge.svg",
      printWidthInches: 2,
    });

    expect(result.id).toBeDefined();
    expect(result.isSourceOnly).toBe(false);
    expect(result.previewUrl).toContain("preview=true");
  });

  it("handles AI (Adobe Illustrator) and CDR source files without attempting browser preview", async () => {
    // Mock Illustrator file header
    const aiMock = Buffer.concat([
      Buffer.from("%!PS-Adobe-3.0 EPSF-3.0\n%%Creator: Adobe Illustrator\n"),
      Buffer.alloc(100),
    ]);

    const result = await ingestArtworkFile({
      buffer: aiMock,
      originalFilename: "corporate_identity_master.ai",
    });

    expect(result.id).toBeDefined();
    expect(result.isSourceOnly).toBe(true);
    expect(result.previewUrl).toBe("");
    expect(result.downloadUrl).toContain("/api/admin/artwork/");
    expect(result.detectedFormat).toContain("AI");
  });

  it("rejects files exceeding 25 MB", async () => {
    const hugeBuffer = Buffer.alloc(26 * 1024 * 1024);
    await expect(
      ingestArtworkFile({
        buffer: hugeBuffer,
        originalFilename: "massive_artwork.psd",
      })
    ).rejects.toThrow("25 MB");
  });

  it("rejects empty 0-byte file", async () => {
    await expect(
      ingestArtworkFile({
        buffer: Buffer.alloc(0),
        originalFilename: "empty.png",
      })
    ).rejects.toThrow("Empty file");
  });
});
