import { describe, it, expect } from "vitest";
import { HistoryManager } from "@/lib/customizer/history";
import { calculatePrintDpi } from "@/lib/customizer/quality";
import {
  getContrastRatio,
  recommendContrastingProductColors,
} from "@/lib/customizer/contrast";

describe("Customizer History Manager (Undo/Redo Limits)", () => {
  it("caps undo history at the specified maximum step limit", () => {
    const maxSteps = 5;
    const history = new HistoryManager<{ text: string }>({ text: "initial" }, maxSteps);

    // Push 10 mutations
    for (let i = 1; i <= 10; i++) {
      history.push({ text: `state_${i}` });
    }

    expect(history.get().text).toBe("state_10");
    // Max undo steps should be capped at 5
    expect(history.getUndoCount()).toBe(5);

    // Undo 5 times
    expect(history.undo().text).toBe("state_9");
    expect(history.undo().text).toBe("state_8");
    expect(history.undo().text).toBe("state_7");
    expect(history.undo().text).toBe("state_6");
    expect(history.undo().text).toBe("state_5");

    // Attempting further undo should remain at oldest preserved state
    expect(history.canUndo()).toBe(false);
    expect(history.undo().text).toBe("state_5");
  });

  it("handles redo correctly and discards future on new push", () => {
    const history = new HistoryManager<number>(100, 30);
    history.push(101);
    history.push(102);

    expect(history.undo()).toBe(101);
    expect(history.canRedo()).toBe(true);

    // Branching: pushing a new state discards previous redo future
    history.push(105);
    expect(history.canRedo()).toBe(false);
    expect(history.get()).toBe(105);
  });
});

describe("Customizer Print DPI Calculation", () => {
  it("reports excellent vector-grade quality for high resolution art", () => {
    // 3000px wide image on 200mm print area at 1x scale
    const result = calculatePrintDpi({
      imageWidthPx: 3000,
      imageHeightPx: 3000,
      targetPrintWidthMm: 200,
      scale: 1.0,
      printMethod: "DTG",
    });

    expect(result.dpi).toBeGreaterThanOrEqual(300);
    expect(result.isLowQuality).toBe(false);
    expect(result.rating).toBe("Excellent");
    expect(result.offerCleanup).toBe(false);
  });

  it("flags low DPI and offers cleanup for low-resolution graphics", () => {
    // 200px wide image on 200mm print area
    const result = calculatePrintDpi({
      imageWidthPx: 200,
      imageHeightPx: 200,
      targetPrintWidthMm: 200,
      scale: 1.0,
      printMethod: "Screen Print",
    });

    expect(result.dpi).toBeLessThan(100);
    expect(result.isLowQuality).toBe(true);
    expect(result.rating).toBe("Low");
    expect(result.offerCleanup).toBe(true);
    expect(result.message).toContain("Resolution is low");
  });
});

describe("Customizer Colour Contrast & Recommendations", () => {
  const sampleProductColors = [
    { name: "White Core", hex: "#FFFFFF" },
    { name: "Ink Black", hex: "#15101F" },
    { name: "Spot Violet", hex: "#6A2CFF" },
    { name: "Muted Heather", hex: "#888888" },
  ];

  it("calculates accurate WCAG contrast ratios", () => {
    // Black (#000000) vs White (#FFFFFF) is ~21:1
    const maxRatio = getContrastRatio("#000000", "#FFFFFF");
    expect(maxRatio).toBeGreaterThan(20);

    // Identical colors have 1:1 contrast
    const sameRatio = getContrastRatio("#6A2CFF", "#6A2CFF");
    expect(sameRatio).toBe(1);
  });

  it("recommends light product colours for a dark logo", () => {
    const darkNavyLogo = "#0A1128";
    const recommendations = recommendContrastingProductColors(darkNavyLogo, sampleProductColors);

    expect(recommendations.length).toBeLessThanOrEqual(3);
    // Highest contrast for navy should be White Core
    expect(recommendations[0].name).toBe("White Core");
    expect(recommendations[0].contrastRatio).toBeGreaterThan(10);
    expect(recommendations[0].reason).toContain("pop");
  });

  it("recommends dark product colours for a light logo", () => {
    const brightYellowLogo = "#FAFF00";
    const recommendations = recommendContrastingProductColors(brightYellowLogo, sampleProductColors);

    // Highest contrast for bright yellow should be Ink Black
    expect(recommendations[0].name).toBe("Ink Black");
    expect(recommendations[0].contrastRatio).toBeGreaterThan(10);
    expect(recommendations[0].reason).toContain("stands out sharply");
  });
});
