/**
 * Extracts dominant colours from an image URL for AI-assisted palette matching.
 * Uses HTML5 Canvas sampling and falls back gracefully.
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("#15101F");
          return;
        }

        // Downscale to 50x50 for fast sampling
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imgData = ctx.getImageData(0, 0, 50, 50).data;
        const colorCounts: Record<string, number> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-white background pixels
          if (a < 50 || (r > 240 && g > 240 && b > 240)) {
            continue;
          }

          // Quantize to 16-step bins
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        let maxCount = 0;
        let dominant = "#15101F"; // Default to Ink Black

        for (const [hex, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominant = hex;
          }
        }

        resolve(dominant);
      } catch {
        resolve("#15101F");
      }
    };
    img.onerror = () => resolve("#15101F");
    img.src = imageUrl;
  });
}
