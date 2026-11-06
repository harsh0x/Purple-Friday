import prisma from "./prisma";

export interface CartItemInput {
  productId: string;
  optionKey: string;
  qty: number;
  options?: Record<string, string>;
  designId?: string;
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

export const FREE_SHIPPING_THRESHOLD = 2500;
export const STANDARD_SHIPPING_FEE = 150;
export const STANDARD_GST_RATE = 0.18; // 18% GST for custom printing / merch in India

/**
 * Normalizes quantity against product minQty and qtyStep.
 */
export function normalizeQuantity(qty: number, minQty: number, qtyStep: number): number {
  if (qty < minQty) return minQty;
  if (qtyStep <= 1) return Math.floor(qty);

  const remainder = (qty - minQty) % qtyStep;
  if (remainder === 0) return qty;

  // Round up to nearest valid step
  return qty + (qtyStep - remainder);
}

/**
 * Finds the unit price for a given quantity across tier brackets.
 */
export function resolveTierPrice(
  qty: number,
  basePrice: number,
  tiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>
): number {
  if (!tiers || tiers.length === 0) return basePrice;

  // Sort tiers ascending by minQty
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  for (const tier of sortedTiers) {
    if (qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty)) {
      return tier.unitPrice;
    }
  }

  // If quantity exceeds the highest tier, return the highest tier price
  const highestTier = sortedTiers[sortedTiers.length - 1];
  if (qty >= highestTier.minQty) {
    return highestTier.unitPrice;
  }

  return basePrice;
}

/**
 * Calculate the authoritative cart total on the server.
 * Never trust the client for money!
 */
export async function calculateCartPricing(
  items: CartItemInput[],
  couponCode?: string
): Promise<PricingCalculationResult> {
  const calculatedItems: CalculatedItem[] = [];

  for (const item of items) {
    let productData: {
      name: string;
      slug: string;
      mrp: number;
      basePrice: number;
      minQty: number;
      qtyStep: number;
      template: string;
      tiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
    } | null = null;

    // Try finding product in Database if live DATABASE_URL exists
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("sample-project") && !process.env.DATABASE_URL.includes("user:password")) {
      try {
        const dbProduct = await prisma.product.findFirst({
          where: {
            OR: [{ id: item.productId }, { slug: item.productId }],
          },
          include: {
            priceTiers: true,
            options: true,
          },
        });

        if (dbProduct) {
          productData = {
            name: dbProduct.name,
            slug: dbProduct.slug,
            mrp: dbProduct.mrp,
            basePrice: dbProduct.basePrice,
            minQty: dbProduct.minQty,
            qtyStep: dbProduct.qtyStep,
            template: dbProduct.slug.split("-")[0] || "tee",
            tiers: dbProduct.priceTiers.map((t) => ({
              minQty: t.minQty,
              maxQty: t.maxQty,
              unitPrice: t.unitPrice,
            })),
          };
        }
      } catch {
        // Fallback to in-memory catalogue
      }
    }

    // If not found in DB, check in-memory catalog
    if (!productData) {
      productData =
        CATALOG_FALLBACK[item.productId] ??
        Object.values(CATALOG_FALLBACK)[0];
    }

    // 1. Normalize quantity
    const normalizedQty = normalizeQuantity(
      item.qty,
      productData.minQty,
      productData.qtyStep
    );

    // 2. Resolve Tier Unit Price
    const tierUnitPrice = resolveTierPrice(
      normalizedQty,
      productData.basePrice,
      productData.tiers
    );

    // 3. Option price deltas
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

    const effectiveUnitPrice = tierUnitPrice + optionDelta;
    const lineTotal = effectiveUnitPrice * normalizedQty;

    calculatedItems.push({
      productId: item.productId,
      optionKey: item.optionKey,
      productName: productData.name,
      productSlug: productData.slug,
      qty: normalizedQty,
      unitPrice: effectiveUnitPrice,
      basePrice: productData.basePrice,
      mrp: productData.mrp,
      optionDelta,
      lineTotal,
      options: item.options,
      designId: item.designId,
      template: productData.template,
    });
  }

  // 4. Calculate Subtotal
  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);

  // 5. Coupon Discount Verification
  let discount = 0;
  let discountBreakdown:
    | { code: string; amount: number; description: string }
    | undefined = undefined;

  if (couponCode) {
    const cleanCode = couponCode.trim().toUpperCase();

    // Verification logic
    if (cleanCode === "FIRSTORDER") {
      if (subtotal >= 1000) {
        discount = Math.round(subtotal * 0.12); // 12% off
        discountBreakdown = {
          code: "FIRSTORDER",
          amount: discount,
          description: "12% Welcome Discount applied",
        };
      }
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);

  // 6. GST Calculation (18% in India for custom printed goods)
  const gst = Math.round(discountedSubtotal * STANDARD_GST_RATE);

  // 7. Shipping Calculation
  const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - discountedSubtotal
  );

  // 8. Grand Total
  const total = discountedSubtotal + gst + shipping;

  return {
    items: calculatedItems,
    subtotal,
    discount,
    discountBreakdown,
    gst,
    shipping,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping,
  };
}
