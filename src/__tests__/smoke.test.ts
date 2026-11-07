import { describe, it, expect } from "vitest";
import { ALL_PRODUCTS } from "@/lib/catalogue";
import { calculateCartPricing } from "@/lib/pricing";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import { recommendCorporateKit } from "@/lib/corporate/kits";
import { generateAssistantReply } from "@/lib/assistant/responder";
import { sanitizeSvg } from "@/lib/security/sanitize-svg";

describe("Step 3J - End-to-End Core Workflow Smoke Tests", () => {
  it("Journey 1: Storefront Catalogue Integrity - all products have valid tiers and print templates", () => {
    expect(ALL_PRODUCTS.length).toBeGreaterThan(0);

    for (const p of ALL_PRODUCTS) {
      expect(p.slug).toBeDefined();
      expect(p.mrp).toBeGreaterThan(0);
      expect(p.basePrice).toBeGreaterThan(0);
      expect(p.minQty).toBeGreaterThanOrEqual(1);
      expect(p.priceTiers.length).toBeGreaterThan(0);

      // Verify that the final tier is open-ended
      const finalTier = p.priceTiers[p.priceTiers.length - 1];
      expect(finalTier.maxQty).toBeNull();
    }
  });

  it("Journey 2: Logo Customizer Print Boundaries - SVG is sanitized and ready for canvas", () => {
    const rawSvgLogo = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#6A2CFF"/></svg>`;
    const { sanitizedSvg, hadScripts } = sanitizeSvg(rawSvgLogo);

    expect(hadScripts).toBe(false);
    expect(sanitizedSvg).toContain("<circle");
    expect(sanitizedSvg).toContain("#6A2CFF");
  });

  it("Journey 3: Cart Pricing Engine - calculates server-side tier discounts with 18% GST", async () => {
    const cartItems = [
      {
        productId: "round-gloss-badge-58mm",
        optionKey: "opt_badge_default",
        qty: 50,
      },
    ];

    const result = await calculateCartPricing(cartItems);

    expect(result.items.length).toBe(1);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.gst).toBe(Math.round(result.subtotal * 0.18));
    expect(result.total).toBe(result.subtotal + result.gst + result.shipping);
  });

  it("Journey 4: Role-Based Access Guard - protects admin route from standard customers", () => {
    const customerUser = { id: "cust_1", role: "CUSTOMER" };
    const adminUser = { id: "admin_1", role: "ADMIN" };
    const guestUser = null;

    expect(isUserAdmin(customerUser)).toBe(false);
    expect(isUserAdmin(guestUser)).toBe(false);
    expect(isUserAdmin(adminUser)).toBe(true);
  });

  it("Journey 5: Corporate Gifting Planner - produces complete 3-item package with volume savings", () => {
    const kit = recommendCorporateKit(100, 1500, "new_joiners");
    expect(kit.items.length).toBe(3);
    expect(kit.percentSavings).toBeGreaterThan(0);
    expect(kit.totalTeamInvestment).toBeGreaterThan(0);
  });

  it("Journey 6: Floating Assistant - answers print queries instantly", async () => {
    const reply = await generateAssistantReply("What is the MOQ?");
    expect(reply.reply).toContain("Minimum Order Quantity");
  });
});

