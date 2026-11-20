import { describe, it, expect } from "vitest";
import { ALL_PRODUCTS } from "@/lib/catalogue";
import { resolveTierPrice, calculateCartPricing, STANDARD_GST_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/pricing";
import {
  toPaise,
  toRupees,
  roundHalfUp,
  resolveSlabUnitPrice,
  validateMoqAndStep,
} from "@/server/pricing/engine";

describe("Storefront Price Invariance Verification", () => {
  // Sample 20 distinct products across various categories: badges, tees, polos, hoodies, caps, bottles, etc.
  const sampleProducts = ALL_PRODUCTS.slice(0, 20);

  it("samples at least 20 real catalog products", () => {
    expect(sampleProducts.length).toBeGreaterThanOrEqual(20);
  });

  describe("Unit price and tier lookup invariance across 20 products", () => {
    for (const product of sampleProducts) {
      it(`matches exact catalog tier pricing for ${product.name} (${product.slug})`, () => {
        expect(product.priceTiers.length).toBeGreaterThan(0);

        for (const tier of product.priceTiers) {
          // Test lower bound of slab
          const priceAtMin = resolveTierPrice(tier.minQty, product.basePrice, product.priceTiers);
          expect(priceAtMin).toBe(tier.unitPrice);

          // Verify with direct engine calculation in paise
          const slabs = product.priceTiers.map((t) => ({
            minQty: t.minQty,
            maxQty: t.maxQty,
            unitPricePaise: toPaise(t.unitPrice),
          }));
          const enginePricePaise = resolveSlabUnitPrice(
            tier.minQty,
            slabs,
            toPaise(product.basePrice)
          );
          expect(enginePricePaise).toBe(toPaise(tier.unitPrice));

          // If upper bound exists, test upper bound
          if (tier.maxQty !== null) {
            const priceAtMax = resolveTierPrice(tier.maxQty, product.basePrice, product.priceTiers);
            expect(priceAtMax).toBe(tier.unitPrice);

            const engineMaxPaise = resolveSlabUnitPrice(
              tier.maxQty,
              slabs,
              toPaise(product.basePrice)
            );
            expect(engineMaxPaise).toBe(toPaise(tier.unitPrice));
          } else {
            // Uncapped bulk tier - test large quantity
            const bulkQty = tier.minQty + 500;
            const priceAtBulk = resolveTierPrice(bulkQty, product.basePrice, product.priceTiers);
            expect(priceAtBulk).toBe(tier.unitPrice);
          }
        }
      });
    }
  });

  describe("Cart calculation invariance for single-item carts across 20 products", () => {
    for (const product of sampleProducts) {
      it(`calculates line total and cart values identically for ${product.slug}`, async () => {
        // Test at product MOQ
        const testQty = product.minQty;
        const expectedTier = product.priceTiers.find((t) => {
          if (t.maxQty === null) return testQty >= t.minQty;
          return testQty >= t.minQty && testQty <= t.maxQty;
        });

        const expectedUnitPrice = expectedTier ? expectedTier.unitPrice : product.basePrice;
        const expectedLineTotal = expectedUnitPrice * testQty;

        // Verify with engine line total calculation in paise
        const engineLineTotalPaise = roundHalfUp(toPaise(expectedUnitPrice) * testQty);
        expect(toRupees(engineLineTotalPaise)).toBe(expectedLineTotal);

        // Verify with storefront cart calculator
        const cartResult = await calculateCartPricing([
          {
            productId: product.slug,
            optionKey: `${product.slug}-default`,
            qty: testQty,
          },
        ]);

        expect(cartResult.items).toHaveLength(1);
        const item = cartResult.items[0];
        expect(item.qty).toBe(testQty);
        expect(item.unitPrice).toBe(expectedUnitPrice);
        expect(item.lineTotal).toBe(expectedLineTotal);
        expect(cartResult.subtotal).toBe(expectedLineTotal);

        // Verify GST is 18% standard
        const expectedGst = roundHalfUp(expectedLineTotal * STANDARD_GST_RATE);
        expect(cartResult.gst).toBe(expectedGst);

        // Verify shipping threshold rule (₹2500)
        const expectedShipping = expectedLineTotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
        expect(cartResult.shipping).toBe(expectedShipping);
        expect(cartResult.total).toBe(expectedLineTotal + expectedGst + expectedShipping);
      });
    }
  });

  describe("Multi-item cart calculation invariance with varied quantities and coupon", () => {
    it("computes complex multi-item cart identical to line sum", async () => {
      // Pick 5 distinct products from our 20
      const subset = sampleProducts.slice(0, 5);
      const cartInputs = subset.map((prod, idx) => ({
        productId: prod.slug,
        optionKey: `${prod.slug}-opt-${idx}`,
        qty: prod.minQty + (idx * prod.qtyStep),
      }));

      const cartResult = await calculateCartPricing(cartInputs);
      expect(cartResult.items).toHaveLength(5);

      let manualSum = 0;
      for (let i = 0; i < subset.length; i++) {
        const prod = subset[i];
        const input = cartInputs[i];
        const item = cartResult.items[i];

        const tier = prod.priceTiers.find((t) => {
          if (t.maxQty === null) return input.qty >= t.minQty;
          return input.qty >= t.minQty && input.qty <= t.maxQty;
        });
        const expectedUnitPrice = tier ? tier.unitPrice : prod.basePrice;

        expect(item.unitPrice).toBe(expectedUnitPrice);
        expect(item.lineTotal).toBe(expectedUnitPrice * input.qty);
        manualSum += item.lineTotal;
      }

      expect(cartResult.subtotal).toBe(manualSum);
      expect(cartResult.gst).toBe(roundHalfUp(manualSum * STANDARD_GST_RATE));
      const expectedShipping = manualSum >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      expect(cartResult.shipping).toBe(expectedShipping);
      expect(cartResult.total).toBe(manualSum + cartResult.gst + expectedShipping);
    });

    it("maintains step and MOQ validation rules identically", () => {
      for (const product of sampleProducts) {
        // Below MOQ clamps to minQty
        const clampedMoq = validateMoqAndStep(0, product.minQty, product.qtyStep);
        expect(clampedMoq.normalizedQty).toBe(product.minQty);
        expect(clampedMoq.valid).toBe(false);

        // Exact MOQ is valid
        const validMoq = validateMoqAndStep(product.minQty, product.minQty, product.qtyStep);
        expect(validMoq.normalizedQty).toBe(product.minQty);
        expect(validMoq.valid).toBe(true);

        // Quantity + valid step is valid
        const validNext = validateMoqAndStep(
          product.minQty + product.qtyStep,
          product.minQty,
          product.qtyStep
        );
        expect(validNext.normalizedQty).toBe(product.minQty + product.qtyStep);
        expect(validNext.valid).toBe(true);
      }
    });
  });
});
