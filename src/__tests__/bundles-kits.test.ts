import { describe, it, expect } from "vitest";
import {
  getAllKits,
  getKitBySlugOrId,
  evaluateKitAvailability,
  reserveKitForOrder,
  consumeKitForOrder,
  releaseKitForOrder,
} from "@/server/kits/kits-service";
import { getBlankSku } from "@/server/inventory/inventory-service";

describe("Bundles & Kits - Parent-Child SKU Definition", () => {
  it("initializes default corporate onboarding kits with components", async () => {
    const kits = await getAllKits();
    expect(kits.length).toBeGreaterThanOrEqual(3);

    const onboardingKit = await getKitBySlugOrId("new-joinee-onboarding-kit");
    expect(onboardingKit).not.toBeNull();
    expect(onboardingKit!.components.length).toBe(4);
    expect(onboardingKit!.kitPricePaise).toBe(85000); // ₹850
    expect(onboardingKit!.kitPrice).toBe(850);
  });
});

describe("Bundles & Kits - Multi-Component Reservation & Consumption", () => {
  it("reserves stock from every child blank SKU when kit is ordered", async () => {
    const kit = (await getKitBySlugOrId("executive-welcome-pack"))!;
    expect(kit).not.toBeNull();

    // Check pre-reservation available quantities
    const flaskBefore = (await getBlankSku("BLANK-FLASK-STEEL-750"))!;
    const journalBefore = (await getBlankSku("BLANK-NOTEBOOK-A5-DIARY"))!;
    const penBefore = (await getBlankSku("BLANK-PEN-METAL-BALL"))!;

    const initialFlaskReserved = flaskBefore.reservedQty;
    const initialJournalReserved = journalBefore.reservedQty;
    const initialPenReserved = penBefore.reservedQty;
    const initialFlaskStock = flaskBefore.stockOnHand;

    const orderId = `kit_ord_${Date.now()}`;
    const res = await reserveKitForOrder("executive-welcome-pack", 5, orderId, "E-Commerce Checkout");
    expect(res.success).toBe(true);

    // Verify all components were reserved by 5
    const flaskAfter = (await getBlankSku("BLANK-FLASK-STEEL-750"))!;
    const journalAfter = (await getBlankSku("BLANK-NOTEBOOK-A5-DIARY"))!;
    const penAfter = (await getBlankSku("BLANK-PEN-METAL-BALL"))!;

    expect(flaskAfter.reservedQty).toBe(initialFlaskReserved + 5);
    expect(journalAfter.reservedQty).toBe(initialJournalReserved + 5);
    expect(penAfter.reservedQty).toBe(initialPenReserved + 5);

    // 2. Consume into production on IN_PRINTING
    const resConsume = await consumeKitForOrder("executive-welcome-pack", 5, orderId, "Factory Lead");
    expect(resConsume.success).toBe(true);

    const flaskPostConsume = (await getBlankSku("BLANK-FLASK-STEEL-750"))!;
    expect(flaskPostConsume.stockOnHand).toBe(initialFlaskStock - 5);
    expect(flaskPostConsume.reservedQty).toBe(initialFlaskReserved);
  });

  it("releases reservations from every component when a kit order is cancelled", async () => {
    const orderId = `kit_cancel_${Date.now()}`;
    const penBefore = (await getBlankSku("BLANK-PEN-METAL-BALL"))!;
    const initialPenReserved = penBefore.reservedQty;

    await reserveKitForOrder("executive-welcome-pack", 3, orderId, "Customer Checkout");
    const penReserved = (await getBlankSku("BLANK-PEN-METAL-BALL"))!;
    expect(penReserved.reservedQty).toBe(initialPenReserved + 3);

    // Cancel order
    const resRelease = await releaseKitForOrder("executive-welcome-pack", 3, orderId, "Support Agent");
    expect(resRelease.success).toBe(true);

    const penPostRelease = (await getBlankSku("BLANK-PEN-METAL-BALL"))!;
    expect(penPostRelease.reservedQty).toBe(initialPenReserved);
  });
});

describe("Bundles & Kits - Shortage Detection & Substitute Logic", () => {
  it("automatically flags kit as Out of Stock if ANY component is short", async () => {
    const kit = (await getKitBySlugOrId("team-hoodie-cap-bundle"))!;
    // In default seed: Cap has only 6 available (8 on hand - 2 reserved)
    // Asking to fulfill 20 kits should trigger an automatic shortage on Cap
    const check = await evaluateKitAvailability(kit, 20);
    expect(check.isOutOfStock).toBe(true);
    expect(check.shortageComponents.length).toBeGreaterThan(0);

    const capShortage = check.shortageComponents.find((s) => s.sku === "BLANK-CAP-BLACK-OS");
    expect(capShortage).toBeDefined();
    expect(capShortage!.requiredQty).toBe(20);
    expect(capShortage!.shortageQty).toBeGreaterThan(0);

    // Shows configured substitute product
    expect(capShortage!.substituteSku).toBe("BLANK-BADGE-GLOSS-58");
    expect(capShortage!.substituteName).toBe("58mm Round Gloss Magnetic Badge");
  });

  it("blocks reservation when a component is short and returns shortage report", async () => {
    const orderId = `short_ord_${Date.now()}`;
    const res = await reserveKitForOrder("team-hoodie-cap-bundle", 50, orderId);

    expect(res.success).toBe(false);
    expect(res.error).toContain("out of stock");
    expect(res.shortageComponents).toBeDefined();
    expect(res.shortageComponents!.length).toBeGreaterThan(0);
  });
});
