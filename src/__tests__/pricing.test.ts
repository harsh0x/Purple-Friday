import { describe, it, expect } from "vitest";
import {
  normalizeQuantity,
  resolveTierPrice,
  calculateCartPricing,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  STANDARD_GST_RATE,
} from "@/lib/pricing";

describe("Pricing Engine - normalizeQuantity", () => {
  it("clamps quantity to minQty if below minimum", () => {
    expect(normalizeQuantity(2, 5, 1)).toBe(5);
    expect(normalizeQuantity(0, 10, 5)).toBe(10);
  });

  it("leaves valid step quantities unchanged", () => {
    expect(normalizeQuantity(10, 10, 5)).toBe(10);
    expect(normalizeQuantity(15, 10, 5)).toBe(15);
    expect(normalizeQuantity(25, 10, 5)).toBe(25);
  });

  it("rounds up invalid step quantities to the nearest valid step", () => {
    // minQty: 10, step: 5 -> valid: 10, 15, 20...
    expect(normalizeQuantity(12, 10, 5)).toBe(15);
    expect(normalizeQuantity(16, 10, 5)).toBe(20);
  });
});

describe("Pricing Engine - resolveTierPrice", () => {
  const capTiers = [
    { minQty: 5, maxQty: 14, unitPrice: 278 },
    { minQty: 15, maxQty: 49, unitPrice: 225 },
    { minQty: 50, maxQty: 99, unitPrice: 185 },
    { minQty: 100, maxQty: 149, unitPrice: 165 },
    { minQty: 150, maxQty: null, unitPrice: 150 },
  ];

  it("resolves lowest tier for small orders", () => {
    expect(resolveTierPrice(5, 278, capTiers)).toBe(278);
    expect(resolveTierPrice(14, 278, capTiers)).toBe(278);
  });

  it("resolves intermediate tier boundaries accurately", () => {
    expect(resolveTierPrice(15, 278, capTiers)).toBe(225);
    expect(resolveTierPrice(49, 278, capTiers)).toBe(225);
    expect(resolveTierPrice(50, 278, capTiers)).toBe(185);
    expect(resolveTierPrice(99, 278, capTiers)).toBe(185);
    expect(resolveTierPrice(100, 278, capTiers)).toBe(165);
    expect(resolveTierPrice(149, 278, capTiers)).toBe(165);
  });

  it("resolves bulk discount tier for orders of 150+ pieces", () => {
    expect(resolveTierPrice(150, 278, capTiers)).toBe(150);
    expect(resolveTierPrice(500, 278, capTiers)).toBe(150);
  });
});

describe("Pricing Engine - calculateCartPricing", () => {
  it("calculates subtotal, GST (18%), and applies shipping correctly under threshold", async () => {
    const result = await calculateCartPricing([
      {
        productId: "structured-cotton-twill-cap",
        optionKey: "cap-black",
        qty: 5, // 5 * 278 = 1390
      },
    ]);

    expect(result.subtotal).toBe(1390);
    expect(result.discount).toBe(0);

    // GST 18% of 1390 = 250.2 -> 250
    expect(result.gst).toBe(Math.round(1390 * STANDARD_GST_RATE));

    // Under ₹2500, shipping is ₹150
    expect(result.shipping).toBe(STANDARD_SHIPPING_FEE);
    expect(result.total).toBe(1390 + result.gst + 150);
    expect(result.amountNeededForFreeShipping).toBe(FREE_SHIPPING_THRESHOLD - 1390);
  });

  it("qualifies for free shipping when subtotal exceeds threshold", async () => {
    const result = await calculateCartPricing([
      {
        productId: "structured-cotton-twill-cap",
        optionKey: "cap-black",
        qty: 50, // 50 * 185 = 9250
      },
    ]);

    expect(result.subtotal).toBe(9250);
    expect(result.shipping).toBe(0);
    expect(result.amountNeededForFreeShipping).toBe(0);
    expect(result.gst).toBe(Math.round(9250 * 0.18));
    expect(result.total).toBe(9250 + result.gst);
  });

  it("applies FIRSTORDER coupon correctly (12% off)", async () => {
    const result = await calculateCartPricing(
      [
        {
          productId: "classic-crewneck-tshirt",
          optionKey: "tee-black",
          qty: 20, // 20 * 240 = 4800
        },
      ],
      "FIRSTORDER"
    );

    expect(result.subtotal).toBe(4800);
    // 12% of 4800 = 576
    expect(result.discount).toBe(576);
    expect(result.discountBreakdown?.code).toBe("FIRSTORDER");

    const discounted = 4800 - 576; // 4224
    expect(result.subtotal - result.discount).toBe(discounted);
    expect(result.gst).toBe(Math.round(discounted * 0.18)); // 760
    expect(result.shipping).toBe(0); // 4224 > 2500 -> free
    expect(result.total).toBe(discounted + result.gst);
  });
});

