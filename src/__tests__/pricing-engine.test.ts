import { describe, it, expect } from "vitest";
import {
  toPaise,
  toRupees,
  roundHalfUp,
  validateMoqAndStep,
  resolveSlabUnitPrice,
  calculateOptionDeltaPaise,
  calculateGstBreakdown,
  calculateBundlePrice,
  applyCouponDiscount,
  calculateCartPricingPure,
  PriceSlab,
  ProductPricingConfig,
} from "@/server/pricing/engine";

describe("Pricing Engine - Pure Integer Paise & Rounding", () => {
  it("converts rupees to paise and paise to rupees accurately", () => {
    expect(toPaise(724)).toBe(72400);
    expect(toPaise(640)).toBe(64000);
    expect(toPaise(550)).toBe(55000);
    expect(toPaise(85.5)).toBe(8550);

    expect(toRupees(72400)).toBe(724);
    expect(toRupees(64000)).toBe(640);
    expect(toRupees(55000)).toBe(550);
  });

  it("applies round half up correctly", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(2.49)).toBe(2);
    expect(roundHalfUp(2.51)).toBe(3);
    expect(roundHalfUp(10.0)).toBe(10);
    expect(roundHalfUp(15.4)).toBe(15);
    expect(roundHalfUp(15.6)).toBe(16);
  });

  it("calculates option deltas in integer paise accurately", () => {
    expect(calculateOptionDeltaPaise({ Size: "M" })).toBe(0);
    expect(calculateOptionDeltaPaise({ Size: "XL" })).toBe(1500); // ₹15
    expect(calculateOptionDeltaPaise({ Size: "2XL" })).toBe(3000); // ₹30
    expect(calculateOptionDeltaPaise({ Size: "2XL", Finish: "Gold Foil" })).toBe(4000); // ₹30 + ₹10 = ₹40
  });
});

describe("Pricing Engine - Slab Boundaries & Reference Examples", () => {
  // Reference example from user prompt:
  // 2 to 4 pieces at Rs 724 (72,400 paise)
  // 5 to 19 pieces at Rs 640 (64,000 paise)
  // 20 and above at Rs 550 (55,000 paise)
  const referenceSlabs: PriceSlab[] = [
    { minQty: 2, maxQty: 4, unitPricePaise: 72400 },
    { minQty: 5, maxQty: 19, unitPricePaise: 64000 },
    { minQty: 20, maxQty: null, unitPricePaise: 55000 },
  ];
  const basePricePaise = 72400;

  it("resolves the 2 to 4 slab at exactly Rs 724 (72,400 paise)", () => {
    expect(resolveSlabUnitPrice(2, referenceSlabs, basePricePaise)).toBe(72400);
    expect(resolveSlabUnitPrice(3, referenceSlabs, basePricePaise)).toBe(72400);
    expect(resolveSlabUnitPrice(4, referenceSlabs, basePricePaise)).toBe(72400);
  });

  it("resolves the 5 to 19 slab at exactly Rs 640 (64,000 paise)", () => {
    expect(resolveSlabUnitPrice(5, referenceSlabs, basePricePaise)).toBe(64000);
    expect(resolveSlabUnitPrice(10, referenceSlabs, basePricePaise)).toBe(64000);
    expect(resolveSlabUnitPrice(19, referenceSlabs, basePricePaise)).toBe(64000);
  });

  it("resolves the 20 and above slab at exactly Rs 550 (55,000 paise)", () => {
    expect(resolveSlabUnitPrice(20, referenceSlabs, basePricePaise)).toBe(55000);
    expect(resolveSlabUnitPrice(50, referenceSlabs, basePricePaise)).toBe(55000);
    expect(resolveSlabUnitPrice(500, referenceSlabs, basePricePaise)).toBe(55000);
  });
});

describe("Pricing Engine - MOQ & Step Validation", () => {
  it("flags MOQ violations and normalizes to minimum quantity", () => {
    const moqResult = validateMoqAndStep(1, 2, 1);
    expect(moqResult.valid).toBe(false);
    expect(moqResult.normalizedQty).toBe(2);
    expect(moqResult.error).toContain("Minimum order quantity is 2 pieces.");

    const badgeMoq = validateMoqAndStep(3, 5, 5);
    expect(badgeMoq.valid).toBe(false);
    expect(badgeMoq.normalizedQty).toBe(5);
  });

  it("flags step violations and normalizes to next valid step", () => {
    // minQty 5, step 5 -> valid: 5, 10, 15, 20...
    const stepCheck = validateMoqAndStep(7, 5, 5);
    expect(stepCheck.valid).toBe(false);
    expect(stepCheck.normalizedQty).toBe(10);
    expect(stepCheck.error).toContain("multiples of 5");

    const validStep = validateMoqAndStep(15, 5, 5);
    expect(validStep.valid).toBe(true);
    expect(validStep.normalizedQty).toBe(15);
  });
});

describe("Pricing Engine - Bundle & Kit Pricing", () => {
  it("sums component prices accurately in integer paise", () => {
    // Example: 1 polo (₹420 = 42000p), 1 metal pen (₹120 = 12000p), 1 diary (₹350 = 35000p), 1 badge (₹65 = 6500p)
    const components = [
      { qty: 1, unitPricePaise: 42000 },
      { qty: 1, unitPricePaise: 12000 },
      { qty: 1, unitPricePaise: 35000 },
      { qty: 1, unitPricePaise: 6500 },
    ];
    // Total sum = 42000 + 12000 + 35000 + 6500 = 95500 paise (₹955)
    expect(calculateBundlePrice(components)).toBe(95500);
  });

  it("applies bundle discount percentage with round-half-up", () => {
    const components = [
      { qty: 2, unitPricePaise: 50000 }, // 100,000 paise
      { qty: 1, unitPricePaise: 50000 }, // 50,000 paise
    ]; // Sum = 150,000 paise
    // 10% discount on 150,000 = 15,000 paise -> Total = 135,000 paise (₹1,350)
    expect(calculateBundlePrice(components, 10)).toBe(135000);
  });

  it("respects explicit kit price override when configured by admin", () => {
    const components = [{ qty: 1, unitPricePaise: 50000 }];
    expect(calculateBundlePrice(components, 0, 44900)).toBe(44900);
  });
});

describe("Pricing Engine - Coupon Rules & Caps", () => {
  it("applies percentage discount within maximum cap", () => {
    // 12% discount with cap of ₹500 (50,000 paise), min cart ₹1,000 (100,000 paise)
    const coupon = {
      code: "FIRSTORDER",
      type: "PERCENTAGE" as const,
      value: 12,
      minSubtotalPaise: 100000,
      maxDiscountCapPaise: 50000,
      active: true,
    };

    // Subtotal ₹2,000 (200,000 paise) -> 12% = ₹240 (24,000 paise) < ₹500 cap
    const res1 = applyCouponDiscount(200000, coupon);
    expect(res1.eligible).toBe(true);
    expect(res1.discountPaise).toBe(24000);

    // Subtotal ₹10,000 (1,000,000 paise) -> 12% = ₹1,200 (120,000 paise) -> capped at ₹500 (50,000 paise)
    const res2 = applyCouponDiscount(1000000, coupon);
    expect(res2.eligible).toBe(true);
    expect(res2.discountPaise).toBe(50000);
  });

  it("rejects coupon if cart subtotal is below minimum threshold", () => {
    const coupon = {
      code: "FIRSTORDER",
      type: "PERCENTAGE" as const,
      value: 12,
      minSubtotalPaise: 100000,
      active: true,
    };

    const res = applyCouponDiscount(50000, coupon); // ₹500 < ₹1,000 min
    expect(res.eligible).toBe(false);
    expect(res.discountPaise).toBe(0);
    expect(res.reason).toContain("Minimum cart value");
  });

  it("applies flat coupon discount correctly", () => {
    const flatCoupon = {
      code: "FLAT200",
      type: "FLAT" as const,
      value: 20000, // ₹200
      minSubtotalPaise: 50000,
      active: true,
    };
    const res = applyCouponDiscount(100000, flatCoupon);
    expect(res.eligible).toBe(true);
    expect(res.discountPaise).toBe(20000);
  });
});

describe("Pricing Engine - GST Breakdown & Indian Invoicing", () => {
  it("splits GST equally into CGST and SGST for intrastate Karnataka supply", () => {
    // ₹1,180 gross (118,000 paise) at 18% GST
    // Taxable base = roundHalfUp(118000 / 1.18) = 100,000 paise (₹1,000)
    // GST = 18,000 paise
    // CGST = 9,000 paise (9%), SGST = 9,000 paise (9%)
    const tax = calculateGstBreakdown(118000, 0.18, "Karnataka", "Karnataka");
    expect(tax.taxableAmountPaise).toBe(100000);
    expect(tax.totalGstPaise).toBe(18000);
    expect(tax.cgstPaise).toBe(9000);
    expect(tax.sgstPaise).toBe(9000);
    expect(tax.igstPaise).toBe(0);
    expect(tax.isInterstate).toBe(false);
  });

  it("assigns entire GST to IGST for interstate supply (e.g. Maharashtra)", () => {
    const tax = calculateGstBreakdown(118000, 0.18, "Maharashtra", "Karnataka");
    expect(tax.taxableAmountPaise).toBe(100000);
    expect(tax.totalGstPaise).toBe(18000);
    expect(tax.cgstPaise).toBe(0);
    expect(tax.sgstPaise).toBe(0);
    expect(tax.igstPaise).toBe(18000);
    expect(tax.isInterstate).toBe(true);
  });
});

describe("Pricing Engine - Full calculateCartPricingPure End-to-End", () => {
  const hoodieProduct: ProductPricingConfig = {
    id: "premium-hoodie",
    slug: "premium-hoodie",
    name: "Executive Pullover Hoodie",
    basePricePaise: 72400,
    mrpPaise: 149900,
    minQty: 2,
    qtyStep: 1,
    gstRate: 0.18,
    categorySlug: "hoodies",
    priceSlabs: [
      { minQty: 2, maxQty: 4, unitPricePaise: 72400 },
      { minQty: 5, maxQty: 19, unitPricePaise: 64000 },
      { minQty: 20, maxQty: null, unitPricePaise: 55000 },
    ],
  };

  it("calculates reference order: 3 hoodies at Rs 724", () => {
    const res = calculateCartPricingPure({
      items: [
        {
          productId: "premium-hoodie",
          optionKey: "hoodie-black-l",
          qty: 3,
        },
      ],
      products: { "premium-hoodie": hoodieProduct },
    });

    expect(res.items[0].qty).toBe(3);
    expect(res.items[0].unitPricePaise).toBe(72400);
    expect(res.items[0].lineTotalPaise).toBe(217200); // 3 * 72400
    expect(res.subtotalPaise).toBe(217200);
    // Under ₹2500 threshold (250,000 paise), shipping is ₹150 (15,000 paise)
    expect(res.shippingPaise).toBe(15000);
    expect(res.totalPaise).toBe(217200 + 15000);
  });

  it("calculates reference order: 10 hoodies at Rs 640 qualifies for free shipping", () => {
    const res = calculateCartPricingPure({
      items: [
        {
          productId: "premium-hoodie",
          optionKey: "hoodie-black-l",
          qty: 10,
        },
      ],
      products: { "premium-hoodie": hoodieProduct },
    });

    expect(res.items[0].unitPricePaise).toBe(64000);
    expect(res.items[0].lineTotalPaise).toBe(640000); // ₹6,400
    expect(res.subtotalPaise).toBe(640000);
    expect(res.shippingPaise).toBe(0);
    expect(res.totalPaise).toBe(640000);
  });
});
