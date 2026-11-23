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

/**
 * Standard coupon definitions supported across both client and server.
 */
export const SUPPORTED_COUPONS: Record<
  string,
  { type: "PERCENTAGE" | "FLAT"; value: number; minSubtotal: number; description: string }
> = {
  FIRSTORDER: {
    type: "PERCENTAGE",
    value: 12,
    minSubtotal: 1000,
    description: "12% Welcome Discount applied",
  },
  WELCOME10: {
    type: "PERCENTAGE",
    value: 10,
    minSubtotal: 500,
    description: "10% Welcome Discount applied",
  },
  PURPLE10: {
    type: "PERCENTAGE",
    value: 10,
    minSubtotal: 500,
    description: "10% Special Discount applied",
  },
  PURPLEFRIDAY: {
    type: "PERCENTAGE",
    value: 10,
    minSubtotal: 500,
    description: "10% Festival Discount applied",
  },
  FLAT100: {
    type: "FLAT",
    value: 100,
    minSubtotal: 1000,
    description: "₹100 Flat Discount applied",
  },
  SAVE15: {
    type: "PERCENTAGE",
    value: 15,
    minSubtotal: 2500,
    description: "15% Bulk Order Discount applied",
  },
};

/**
 * Evaluates coupon against cart subtotal.
 */
export function evaluateCoupon(
  subtotal: number,
  couponCode?: string
): {
  eligible: boolean;
  discount: number;
  breakdown?: { code: string; amount: number; description: string };
  reason?: string;
} {
  if (!couponCode) return { eligible: false, discount: 0 };
  const cleanCode = couponCode.trim().toUpperCase();
  const rule = SUPPORTED_COUPONS[cleanCode];

  if (!rule) {
    return {
      eligible: false,
      discount: 0,
      reason: `Invalid coupon code "${cleanCode}". Try FIRSTORDER for 12% off.`,
    };
  }

  if (subtotal < rule.minSubtotal) {
    return {
      eligible: false,
      discount: 0,
      reason: `Coupon ${cleanCode} requires a minimum cart value of ₹${rule.minSubtotal}. Add ₹${rule.minSubtotal - subtotal} more.`,
    };
  }

  let discount = 0;
  if (rule.type === "PERCENTAGE") {
    discount = Math.round((subtotal * rule.value) / 100);
  } else {
    discount = Math.min(rule.value, subtotal);
  }

  return {
    eligible: true,
    discount,
    breakdown: {
      code: cleanCode,
      amount: discount,
      description: rule.description,
    },
  };
}

/**
 * Fast synchronous client cart calculation for instant zero-latency UI rendering.
 */
export function calculateClientCartPricing(
  items: CartItemInput[],
  couponCode?: string
): PricingCalculationResult {
  const calculatedItems: CalculatedItem[] = [];

  for (const item of items) {
    const fallback =
      CATALOG_FALLBACK[item.productId] ||
      Object.values(CATALOG_FALLBACK)[0];

    const normalizedQty = normalizeQuantity(
      item.qty || fallback.minQty,
      fallback.minQty,
      fallback.qtyStep
    );

    const unitPrice = resolveTierPrice(
      normalizedQty,
      fallback.basePrice,
      fallback.tiers
    );

    let optionDelta = 0;
    if (item.options) {
      for (const val of Object.values(item.options)) {
        if (typeof val === "string") {
          if (val.includes("2XL") || val.includes("XXL")) optionDelta += 30;
          if (val.includes("XL")) optionDelta += 15;
          if (val.toLowerCase().includes("velvet") || val.toLowerCase().includes("gold")) optionDelta += 10;
        }
      }
    }

    const effectiveUnitPrice = unitPrice + optionDelta;
    const lineTotal = effectiveUnitPrice * normalizedQty;

    calculatedItems.push({
      productId: item.productId,
      optionKey: item.optionKey,
      productName: fallback.name,
      productSlug: fallback.slug,
      qty: normalizedQty,
      unitPrice: effectiveUnitPrice,
      basePrice: fallback.basePrice,
      mrp: fallback.mrp,
      optionDelta,
      lineTotal,
      options: item.options,
      designId: item.designId,
      template: fallback.template,
      isAvailable: true,
    });
  }

  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const couponEval = evaluateCoupon(subtotal, couponCode);
  const discount = couponEval.discount;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gst = Math.round(discountedSubtotal * STANDARD_GST_RATE);
  const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);
  const total = discountedSubtotal + gst + shipping;

  return {
    items: calculatedItems,
    subtotal,
    discount,
    discountBreakdown: couponEval.breakdown,
    gst,
    shipping,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping,
    hasUnavailableItems: false,
  };
}
