export interface PrintAreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  physicalWidthMm: number;
  shape: "rect" | "circle";
  supportedViews: Array<"front" | "back">;
}

// 600x600 canvas coordinate mapping for standard apparel and merchandise
export const PRODUCT_PRINT_AREAS: Record<string, PrintAreaBounds> = {
  tee: {
    x: 215,
    y: 170,
    width: 170,
    height: 210,
    physicalWidthMm: 250,
    shape: "rect",
    supportedViews: ["front", "back"],
  },
  polo: {
    x: 230,
    y: 180,
    width: 140,
    height: 180,
    physicalWidthMm: 180,
    shape: "rect",
    supportedViews: ["front", "back"],
  },
  hoodie: {
    x: 215,
    y: 190,
    width: 170,
    height: 200,
    physicalWidthMm: 260,
    shape: "rect",
    supportedViews: ["front", "back"],
  },
  badge: {
    x: 175,
    y: 175,
    width: 250,
    height: 250,
    physicalWidthMm: 58,
    shape: "circle",
    supportedViews: ["front"],
  },
  cap: {
    x: 220,
    y: 220,
    width: 160,
    height: 120,
    physicalWidthMm: 110,
    shape: "rect",
    supportedViews: ["front"],
  },
  pen: {
    x: 180,
    y: 275,
    width: 240,
    height: 50,
    physicalWidthMm: 60,
    shape: "rect",
    supportedViews: ["front"],
  },
  keychain: {
    x: 210,
    y: 210,
    width: 180,
    height: 180,
    physicalWidthMm: 45,
    shape: "rect",
    supportedViews: ["front"],
  },
  notebook: {
    x: 210,
    y: 170,
    width: 180,
    height: 260,
    physicalWidthMm: 140,
    shape: "rect",
    supportedViews: ["front"],
  },
  bottle: {
    x: 230,
    y: 220,
    width: 140,
    height: 220,
    physicalWidthMm: 90,
    shape: "rect",
    supportedViews: ["front"],
  },
};

export function getPrintAreaForTemplate(templateName: string): PrintAreaBounds {
  const norm = (templateName || "").toLowerCase();
  const keys = Object.keys(PRODUCT_PRINT_AREAS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const regex = new RegExp(`(^|[-_\\s])${key}([-_\\s]|$)`, "i");
    if (regex.test(norm) || norm === key) {
      return PRODUCT_PRINT_AREAS[key];
    }
  }
  return PRODUCT_PRINT_AREAS.tee;
}

