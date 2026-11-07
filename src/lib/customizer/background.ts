/**
 * Canvas-based client-side white background removal with tolerance slider.
 * Pure HTML5 Canvas 2D, zero AGPL or paid dependencies.
 */
export async function removeWhiteBackgroundFromImageUrl(
  imageUrl: string,
  tolerancePercent: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Tolerance distance from pure white (255, 255, 255)
        // Max euclidean color distance in RGB is ~441.67
        const threshold = (tolerancePercent / 100) * 441.67;
        const featherRange = 20;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const dist = Math.sqrt(
            Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2)
          );

          if (dist <= threshold) {
            data[i + 3] = 0; // Completely transparent
          } else if (dist <= threshold + featherRange) {
            // Feather edge for antialiasing
            const factor = (dist - threshold) / featherRange;
            data[i + 3] = Math.round(a * factor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for background removal"));
    img.src = imageUrl;
  });
}

