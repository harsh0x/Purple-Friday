import {
  toPaise,
  toRupees,
  validateMoqAndStep,
  resolveSlabUnitPrice,
  DEFAULT_GST_RATE,
  FREE_SHIPPING_THRESHOLD_PAISE,
  STANDARD_SHIPPING_FEE_PAISE,
  calculateGstBreakdown,
} from "@/server/pricing/engine";

export { calculateGstBreakdown };

export interface CartItemInput {
  productId: string;
  optionKey: string;
  qty: number;
  options?: Record<string, string>;
  designId?: string;
  customPricePaise?: number;
}

export interface CalculatedItem {
  productId: string;
  optionKey: string;
  productName: string;
  productSlug: string;
  qty: number;
  unitPrice: number;
  basePrice: number;
  mrp: number;
  optionDelta: number;
  lineTotal: number;
  options?: Record<string, string>;
  designId?: string;
  template: string;
  isAvailable?: boolean;
  unavailabilityReason?: string;
}

export interface PricingCalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  discount: number;
  discountBreakdown?: {
    code: string;
    amount: number;
    description: string;
  };
  gst: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  hasUnavailableItems?: boolean;
}

// Fallback product catalog for when the database is offline or not yet connected
export const CATALOG_FALLBACK: Record<
  string,
  {
    name: string;
    slug: string;
    mrp: number;
    basePrice: number;
    minQty: number;
    qtyStep: number;
    template: string;
    tiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
  }
> = {
  "round-gloss-badge-58mm": {
    name: "58mm Round Gloss Magnetic Badge",
    slug: "round-gloss-badge-58mm",
    mrp: 140,
    basePrice: 85,
    minQty: 10,
    qtyStep: 5,
    template: "badge",
    tiers: [
      { minQty: 10, maxQty: 49, unitPrice: 85 },
      { minQty: 50, maxQty: 99, unitPrice: 65 },
      { minQty: 100, maxQty: 249, unitPrice: 52 },
      { minQty: 250, maxQty: null, unitPrice: 42 },
    ],
  },
  "classic-crewneck-tshirt": {
    name: "Classic Crewneck Cotton T-Shirt (180 GSM)",
    slug: "classic-crewneck-tshirt",
    mrp: 499,
    basePrice: 285,
    minQty: 5,
    qtyStep: 1,
    template: "tee",
    tiers: [
      { minQty: 5, maxQty: 14, unitPrice: 285 },
      { minQty: 15, maxQty: 49, unitPrice: 240 },
      { minQty: 50, maxQty: 99, unitPrice: 195 },
      { minQty: 100, maxQty: null, unitPrice: 165 },
    ],
  },
  "executive-pique-polo": {
    name: "Executive Cotton Piqué Polo Shirt (230 GSM)",
    slug: "executive-pique-polo",
    mrp: 749,
    basePrice: 420,
    minQty: 5,
    qtyStep: 1,
    template: "polo",
    tiers: [
      { minQty: 5, maxQty: 14, unitPrice: 420 },
      { minQty: 15, maxQty: 49, unitPrice: 360 },
      { minQty: 50, maxQty: 99, unitPrice: 310 },
      { minQty: 100, maxQty: null, unitPrice: 265 },
    ],
  },
  "classic-pullover-hoodie": {
    name: "Classic Kangaroo Pocket Pullover Hoodie (320 GSM)",
    slug: "classic-pullover-hoodie",
    mrp: 1499,
    basePrice: 790,
    minQty: 5,
    qtyStep: 1,
    template: "hoodie",
    tiers: [
      { minQty: 5, maxQty: 14, unitPrice: 790 },
      { minQty: 15, maxQty: 49, unitPrice: 680 },
      { minQty: 50, maxQty: 99, unitPrice: 580 },
      { minQty: 100, maxQty: null, unitPrice: 495 },
    ],
  },
  "structured-cotton-twill-cap": {
    name: "Structured 6-Panel Cotton Twill Baseball Cap",
    slug: "structured-cotton-twill-cap",
    mrp: 499,
    basePrice: 278,
    minQty: 5,
    qtyStep: 1,
    template: "cap",
    tiers: [
      { minQty: 5, maxQty: 14, unitPrice: 278 },
      { minQty: 15, maxQty: 49, unitPrice: 225 },
      { minQty: 50, maxQty: 99, unitPrice: 185 },
      { minQty: 100, maxQty: 149, unitPrice: 165 },
      { minQty: 150, maxQty: null, unitPrice: 150 },
    ],
  },
  "matte-insulated-steel-flask": {
    name: "Double-Wall Insulated Matte Steel Flask (750ml)",
    slug: "matte-insulated-steel-flask",
    mrp: 899,
    basePrice: 480,
    minQty: 10,
    qtyStep: 1,
    template: "bottle",
    tiers: [
      { minQty: 10, maxQty: 24, unitPrice: 480 },
      { minQty: 25, maxQty: 49, unitPrice: 410 },
      { minQty: 50, maxQty: 99, unitPrice: 350 },
      { minQty: 100, maxQty: null, unitPrice: 295 },
    ],
  },
};

export const FREE_SHIPPING_THRESHOLD = toRupees(FREE_SHIPPING_THRESHOLD_PAISE); // 2500
export const STANDARD_SHIPPING_FEE = toRupees(STANDARD_SHIPPING_FEE_PAISE); // 150
export const STANDARD_GST_RATE = DEFAULT_GST_RATE; // 0.18

/**
 * Normalizes quantity against product minQty and qtyStep using unified engine.
 */
export function normalizeQuantity(qty: number, minQty: number, qtyStep: number): number {
  return validateMoqAndStep(qty, minQty, qtyStep).normalizedQty;
}

/**
 * Pure tier pricing calculation for client-side customizer and tier tables.
 */
export function resolveTierPrice(
  qty: number,
  basePrice: number,
  tiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>
): number {
  const slabs = (tiers || []).map((t) => ({
    minQty: t.minQty,
    maxQty: t.maxQty,
    unitPricePaise: toPaise(t.unitPrice),
  }));

  const pricePaise = resolveSlabUnitPrice(qty, slabs, toPaise(basePrice));
  return toRupees(pricePaise);
}
