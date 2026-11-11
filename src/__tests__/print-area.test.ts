import { describe, it, expect } from "vitest";
import {
  calculateLogoPlacement,
  calculateCurvedStripWarp,
  type PrintArea,
} from "@/lib/mockup-canvas";

describe("Print Area Math & Clamping Engine", () => {
  const standardArea = { width: 400, height: 400 };

  it("strictly clamps a wide landscape logo within print area bounds", () => {
    const wideLogo = { width: 1200, height: 300 }; // 4:1 aspect ratio
    const placement = calculateLogoPlacement(
      wideLogo.width,
      wideLogo.height,
      standardArea.width,
      standardArea.height
    );

    expect(placement.drawW).toBeLessThanOrEqual(standardArea.width);
    expect(placement.drawH).toBeLessThanOrEqual(standardArea.height);
    expect(placement.drawW).toBe(400);
    expect(placement.drawH).toBe(100);
    // Centered vertically
    expect(placement.offsetX).toBe(0);
    expect(placement.offsetY).toBe(150);
  });

  it("strictly clamps a tall portrait logo within print area bounds", () => {
    const tallLogo = { width: 250, height: 1000 }; // 1:4 aspect ratio
    const placement = calculateLogoPlacement(
      tallLogo.width,
      tallLogo.height,
      standardArea.width,
      standardArea.height
    );

    expect(placement.drawW).toBeLessThanOrEqual(standardArea.width);
    expect(placement.drawH).toBeLessThanOrEqual(standardArea.height);
    expect(placement.drawH).toBe(400);
    expect(placement.drawW).toBe(100);
    // Centered horizontally
    expect(placement.offsetX).toBe(150);
    expect(placement.offsetY).toBe(0);
  });

  it("strictly fits a square logo within equal area dimensions", () => {
    const squareLogo = { width: 600, height: 600 };
    const placement = calculateLogoPlacement(
      squareLogo.width,
      squareLogo.height,
      standardArea.width,
      standardArea.height
    );

    expect(placement.drawW).toBe(400);
    expect(placement.drawH).toBe(400);
    expect(placement.offsetX).toBe(0);
    expect(placement.offsetY).toBe(0);
  });

  it("handles non-square bounding boxes correctly", () => {
    const rectArea = { width: 600, height: 300 };
    const squareLogo = { width: 500, height: 500 };
    const placement = calculateLogoPlacement(
      squareLogo.width,
      squareLogo.height,
      rectArea.width,
      rectArea.height
    );

    expect(placement.drawW).toBeLessThanOrEqual(rectArea.width);
    expect(placement.drawH).toBeLessThanOrEqual(rectArea.height);
    expect(placement.drawH).toBe(300);
    expect(placement.drawW).toBe(300);
    expect(placement.offsetX).toBe(150);
    expect(placement.offsetY).toBe(0);
  });

  it("handles invalid or zero-dimension inputs gracefully", () => {
    const placement = calculateLogoPlacement(0, 100, 400, 400);
    expect(placement.drawW).toBe(0);
    expect(placement.drawH).toBe(0);
  });

  it("calculates smooth cosine cylindrical strip warping for curved surfaces", () => {
    const strips = 24;
    const drawH = 200;

    for (let i = 0; i < strips; i++) {
      const { scaleY, warpOffset } = calculateCurvedStripWarp(i, strips, drawH);

      // Cosine factor must stay within (0, 1]
      expect(scaleY).toBeGreaterThan(0.5);
      expect(scaleY).toBeLessThanOrEqual(1.0);

      // Warp offset must stay within bounding range
      expect(warpOffset).toBeGreaterThanOrEqual(0);
      expect(warpOffset).toBeLessThan(drawH * 0.15);
    }

    // Apex in the middle has highest scaleY (~1.0) and lowest warpOffset (~0)
    const midLeft = calculateCurvedStripWarp(11, strips, drawH);
    const midRight = calculateCurvedStripWarp(12, strips, drawH);
    expect(midLeft.scaleY).toBeGreaterThan(0.98);
    expect(midRight.scaleY).toBeGreaterThan(0.98);
    expect(midLeft.warpOffset).toBeLessThan(2);
    expect(midRight.warpOffset).toBeLessThan(2);

    // Edges have more compression and warp
    const edge = calculateCurvedStripWarp(0, strips, drawH);
    expect(edge.scaleY).toBeLessThan(0.9);
    expect(edge.warpOffset).toBeGreaterThan(5);
  });

  it("validates that print area percentages map into canvas bounds", () => {
    const canvasSize = 800;
    const printArea: PrintArea = {
      x: 35,
      y: 28,
      width: 30,
      height: 38,
    };

    const pixelX = (printArea.x / 100) * canvasSize;
    const pixelY = (printArea.y / 100) * canvasSize;
    const pixelW = (printArea.width / 100) * canvasSize;
    const pixelH = (printArea.height / 100) * canvasSize;

    expect(pixelX).toBeGreaterThanOrEqual(0);
    expect(pixelY).toBeGreaterThanOrEqual(0);
    expect(pixelX + pixelW).toBeLessThanOrEqual(canvasSize);
    expect(pixelY + pixelH).toBeLessThanOrEqual(canvasSize);
  });
});
