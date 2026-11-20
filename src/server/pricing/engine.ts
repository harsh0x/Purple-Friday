/**
 * Purple Friday - Unified Pure Pricing Engine
 * 
 * Rules:
 * - Pure functions, zero database side-effects
 * - Strict integer paise (1 Rupee = 100 Paise)
 * - Round half up: Math.floor(x + 0.5), applied once per line
 * - GST-inclusive display with configurable GST rate per product
 * - Computes: slab unit price, MOQ/step checks, bundle pricing, coupon caps, shipping, and state GST breakdown
 */

export const DEFAULT_GST_RATE = 0.18; // 18% standard GST for merchandise in India
export const FREE_SHIPPING_THRESHOLD_PAISE = 250000; // ₹2,500 in paise
export const STANDARD_SHIPPING_FEE_PAISE = 15000; // ₹150 in paise
export const DEFAULT_SELLER_STATE = "Karnataka";

export interface PriceSlab {
  minQty: number;
  maxQty: number | null;
  unitPricePaise: number; // in integer paise
}

export interface ProductPricingConfig {
  id: string;
  slug: string;
  name: string;
  basePricePaise: number;
  mrpPaise: number;
  minQty: number;
  qtyStep: number;
  gstRate?: number; // e.g. 0.18, 0.12, 0.05
  priceSlabs: PriceSlab[];
  costPricePaise?: number; // COGS (blank + print)
  categorySlug?: string;
}

export interface CouponRule {
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number; // percentage (e.g. 12) or flat paise
  maxDiscountCapPaise?: number; // max cap in paise
  minSubtotalPaise?: number; // min subtotal in paise to qualify
  applicableCategories?: string[];
  firstOrderOnly?: boolean;
  active?: boolean;
  expiresAt?: string | null;
}

export interface LineItemInput {
  productId: string;
  optionKey: string;
  qty: number;
  options?: Record<string, string>;
  designId?: string;
  customPricePaise?: number; // Staff negotiated price if approved
}

export interface CalculatedLineItem {
  productId: string;
  optionKey: string;
  productName: string;
  productSlug: string;
  qty: number;
  unitPricePaise: number;
  basePricePaise: number;
  mrpPaise: number;
  optionDeltaPaise: number;
  lineTotalPaise: number; // Gross GST-inclusive total in paise
  taxableBasePaise: number; // Net taxable amount in paise
  gstAmountPaise: number; // GST included in paise
  gstRate: number;
  options?: Record<string, string>;
  designId?: string;
  template: string;
  // Rupee equivalents for convenience
  unitPrice: number;
  lineTotal: number;
  basePrice: number;
  mrp: number;
}

export interface GstTaxBreakdown {
  taxableAmountPaise: number;
  totalGstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  isInterstate: boolean;
  placeOfSupply: string;
}

export interface CartPricingResult {
  items: CalculatedLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  discountBreakdown?: {
    code: string;
    amountPaise: number;
    amount: number;
    description: string;
  };
  gstPaise: number; // Total GST included
  shippingPaise: number;
  totalPaise: number; // Grand total payable in paise
  freeShippingThresholdPaise: number;
  amountNeededForFreeShippingPaise: number;
  taxBreakdown: GstTaxBreakdown;

  // Rupee representations for backward compatibility
  subtotal: number;
  discount: number;
  gst: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
}

// -------------------------------------------------------------
// Pure Helper Functions
// -------------------------------------------------------------

/**
 * Converts Indian Rupees to integer paise.
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to Indian Rupees.
 */
export function toRupees(paise: number): number {
  return paise / 100;
}

/**
 * Round half up: 2.5 -> 3, 2.4 -> 2. Applied once per line.
 */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/**
 * Validates Minimum Order Quantity (MOQ) and Step constraints.
 */
export function validateMoqAndStep(
  qty: number,
  minQty: number,
  qtyStep: number = 1
): { valid: boolean; normalizedQty: number; error?: string } {
  if (qty < minQty) {
    return {
      valid: false,
      normalizedQty: minQty,
      error: `Minimum order quantity is ${minQty} pieces.`,
    };
  }

  if (qtyStep <= 1) {
    const intQty = Math.floor(qty);
    return { valid: true, normalizedQty: intQty };
  }

  const remainder = (qty - minQty) % qtyStep;
  if (remainder === 0) {
    return { valid: true, normalizedQty: qty };
  }

  const normalized = qty + (qtyStep - remainder);
  return {
    valid: false,
    normalizedQty: normalized,
    error: `Quantity must increment in multiples of ${qtyStep} starting from ${minQty}. Next valid quantity is ${normalized}.`,
  };
}

/**
 * Resolves the unit price in integer paise from quantity slabs.
 */
export function resolveSlabUnitPrice(
  qty: number,
  slabs: PriceSlab[],
  basePricePaise: number
): number {
  if (!slabs || slabs.length === 0) return basePricePaise;

  // Sort ascending by minQty
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);

  for (const slab of sorted) {
    if (qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)) {
      return slab.unitPricePaise;
    }
  }

  // If quantity exceeds highest slab, use highest slab unit price
  const highest = sorted[sorted.length - 1];
  if (qty >= highest.minQty) {
    return highest.unitPricePaise;
  }

  return basePricePaise;
}

/**
 * Calculates option delta in integer paise (e.g., larger apparel sizes or premium finishes).
 */
export function calculateOptionDeltaPaise(options?: Record<string, string>): number {
  if (!options) return 0;
  let deltaPaise = 0;

  for (const val of Object.values(options)) {
    if (typeof val === "string") {
      const lower = val.toLowerCase();
      if (val.includes("2XL") || val.includes("XXL") || val.includes("3XL")) {
        deltaPaise += 3000; // ₹30 in paise
      } else if (val.includes("XL")) {
        deltaPaise += 1500; // ₹15 in paise
      }
      if (lower.includes("velvet") || lower.includes("gold")) {
        deltaPaise += 1000; // ₹10 in paise
      }
    }
  }

  return deltaPaise;
}

/**
 * Calculates GST breakdown for GST-inclusive prices according to Indian GST rules.
 * Taxable base = RoundHalfUp(GrossTotal / (1 + GstRate))
 * Total GST = GrossTotal - TaxableBase
 */
export function calculateGstBreakdown(
  grossTotalPaise: number,
  gstRate: number = DEFAULT_GST_RATE,
  customerState: string = "Karnataka",
  sellerState: string = DEFAULT_SELLER_STATE
): GstTaxBreakdown {
  if (grossTotalPaise <= 0) {
    return {
      taxableAmountPaise: 0,
      totalGstPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      isInterstate: false,
      placeOfSupply: customerState,
    };
  }

  const taxableAmountPaise = roundHalfUp(grossTotalPaise / (1 + gstRate));
  const totalGstPaise = grossTotalPaise - taxableAmountPaise;

  const normCustomer = customerState.trim().toLowerCase();
  const normSeller = sellerState.trim().toLowerCase();
  const isInterstate =
    normCustomer !== normSeller &&
    !(
      (normCustomer === "ka" && normSeller === "karnataka") ||
      (normCustomer === "karnataka" && normSeller === "ka")
    );

  if (isInterstate) {
    return {
      taxableAmountPaise,
      totalGstPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: totalGstPaise,
      isInterstate: true,
      placeOfSupply: customerState,
    };
  }

  const cgstPaise = roundHalfUp(totalGstPaise / 2);
  const sgstPaise = totalGstPaise - cgstPaise;

  return {
    taxableAmountPaise,
    totalGstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise: 0,
    isInterstate: false,
    placeOfSupply: customerState,
  };
}

/**
 * Computes bundle price based on component quantities, unit prices, and optional bundle discount.
 */
export function calculateBundlePrice(
  components: Array<{ qty: number; unitPricePaise: number }>,
  bundleDiscountPercent: number = 0,
  overrideKitPricePaise?: number
): number {
  if (overrideKitPricePaise !== undefined && overrideKitPricePaise > 0) {
    return overrideKitPricePaise;
  }

  const componentsSumPaise = components.reduce(
    (sum, c) => sum + c.qty * c.unitPricePaise,
    0
  );

  if (bundleDiscountPercent <= 0) return componentsSumPaise;

  const discountPaise = roundHalfUp(
    (componentsSumPaise * bundleDiscountPercent) / 100
  );
  return Math.max(0, componentsSumPaise - discountPaise);
}

/**
 * Validates and calculates coupon discount.
 */
export function applyCouponDiscount(
  subtotalPaise: number,
  coupon?: CouponRule | null,
  cartCategories: string[] = []
): { discountPaise: number; eligible: boolean; reason?: string } {
  if (!coupon || !coupon.active) {
    return { discountPaise: 0, eligible: false, reason: "Coupon is inactive or invalid." };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { discountPaise: 0, eligible: false, reason: "Coupon has expired." };
  }

  if (coupon.minSubtotalPaise && subtotalPaise < coupon.minSubtotalPaise) {
    return {
      discountPaise: 0,
      eligible: false,
      reason: `Minimum cart value of ₹${toRupees(
        coupon.minSubtotalPaise
      )} required for coupon ${coupon.code}.`,
    };
  }

  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const matches = cartCategories.some((cat) =>
      coupon.applicableCategories!.includes(cat)
    );
    if (!matches) {
      return {
        discountPaise: 0,
        eligible: false,
        reason: `Coupon only applies to: ${coupon.applicableCategories.join(", ")}.`,
      };
    }
  }

  let discountPaise = 0;
  if (coupon.type === "PERCENTAGE") {
    discountPaise = roundHalfUp((subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountCapPaise && discountPaise > coupon.maxDiscountCapPaise) {
      discountPaise = coupon.maxDiscountCapPaise;
    }
  } else {
    // FLAT discount
    discountPaise = Math.min(coupon.value, subtotalPaise);
  }

  return { discountPaise, eligible: true };
}

/**
 * Authoritative Pure Pricing Engine: Computes complete cart pricing.
 */
export function calculateCartPricingPure(params: {
  items: LineItemInput[];
  products: Record<string, ProductPricingConfig>;
  coupon?: CouponRule | null;
  customerState?: string;
  sellerState?: string;
}): CartPricingResult {
  const calculatedItems: CalculatedLineItem[] = [];
  const cartCategories: string[] = [];

  for (const item of params.items) {
    const product = params.products[item.productId];
    if (!product) {
      throw new Error(`Product '${item.productId}' not found in pricing catalog.`);
    }

    if (product.categorySlug) {
      cartCategories.push(product.categorySlug);
    }

    // 1. Normalize quantity against MOQ and step
    const { normalizedQty } = validateMoqAndStep(
      item.qty,
      product.minQty,
      product.qtyStep
    );

    // 2. Unit price from quantity slab or custom staff override
    let unitPricePaise =
      item.customPricePaise !== undefined && item.customPricePaise > 0
        ? item.customPricePaise
        : resolveSlabUnitPrice(
            normalizedQty,
            product.priceSlabs,
            product.basePricePaise
          );

    // 3. Option deltas
    const optionDeltaPaise = calculateOptionDeltaPaise(item.options);
    unitPricePaise += optionDeltaPaise;

    // 4. Line total in paise (applied once per line)
    const lineTotalPaise = roundHalfUp(unitPricePaise * normalizedQty);

    const gstRate = product.gstRate ?? DEFAULT_GST_RATE;
    const taxableBasePaise = roundHalfUp(lineTotalPaise / (1 + gstRate));
    const gstAmountPaise = lineTotalPaise - taxableBasePaise;

    calculatedItems.push({
      productId: item.productId,
      optionKey: item.optionKey,
      productName: product.name,
      productSlug: product.slug,
      qty: normalizedQty,
      unitPricePaise,
      basePricePaise: product.basePricePaise,
      mrpPaise: product.mrpPaise,
      optionDeltaPaise,
      lineTotalPaise,
      taxableBasePaise,
      gstAmountPaise,
      gstRate,
      options: item.options,
      designId: item.designId,
      template: product.slug.split("-")[0] || "product",
      // Rupee compatibility
      unitPrice: toRupees(unitPricePaise),
      lineTotal: toRupees(lineTotalPaise),
      basePrice: toRupees(product.basePricePaise),
      mrp: toRupees(product.mrpPaise),
    });
  }

  // 5. Cart Subtotal
  const subtotalPaise = calculatedItems.reduce(
    (acc, curr) => acc + curr.lineTotalPaise,
    0
  );

  // 6. Coupon Discount
  let discountPaise = 0;
  let discountBreakdown: CartPricingResult["discountBreakdown"] = undefined;

  if (params.coupon) {
    const couponResult = applyCouponDiscount(
      subtotalPaise,
      params.coupon,
      cartCategories
    );
    if (couponResult.eligible && couponResult.discountPaise > 0) {
      discountPaise = couponResult.discountPaise;
      discountBreakdown = {
        code: params.coupon.code,
        amountPaise: discountPaise,
        amount: toRupees(discountPaise),
        description:
          params.coupon.type === "PERCENTAGE"
            ? `${params.coupon.value}% discount applied`
            : `₹${toRupees(params.coupon.value)} flat discount applied`,
      };
    }
  }

  const discountedSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);

  // 7. Shipping calculation
  const isFreeShipping =
    discountedSubtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE || subtotalPaise === 0;
  const shippingPaise = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE_PAISE;
  const amountNeededForFreeShippingPaise = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PAISE - discountedSubtotalPaise
  );

  // 8. Tax breakdown on discounted taxable amount
  const customerState = params.customerState || DEFAULT_SELLER_STATE;
  const sellerState = params.sellerState || DEFAULT_SELLER_STATE;
  const taxBreakdown = calculateGstBreakdown(
    discountedSubtotalPaise,
    DEFAULT_GST_RATE,
    customerState,
    sellerState
  );

  // 9. Grand Total (in paise)
  // For GST-inclusive pricing, subtotal already includes GST.
  // Grand total = Discounted Subtotal + Shipping.
  const totalPaise = discountedSubtotalPaise + shippingPaise;

  return {
    items: calculatedItems,
    subtotalPaise,
    discountPaise,
    discountBreakdown,
    gstPaise: taxBreakdown.totalGstPaise,
    shippingPaise,
    totalPaise,
    freeShippingThresholdPaise: FREE_SHIPPING_THRESHOLD_PAISE,
    amountNeededForFreeShippingPaise,
    taxBreakdown,
    // Rupee values
    subtotal: toRupees(subtotalPaise),
    discount: toRupees(discountPaise),
    gst: toRupees(taxBreakdown.totalGstPaise),
    shipping: toRupees(shippingPaise),
    total: toRupees(totalPaise),
    freeShippingThreshold: toRupees(FREE_SHIPPING_THRESHOLD_PAISE),
    amountNeededForFreeShipping: toRupees(amountNeededForFreeShippingPaise),
  };
}
