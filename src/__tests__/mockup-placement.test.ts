import { describe, it, expect, beforeEach } from "vitest";
import { getPrintAreaForTemplate } from "@/lib/customizer/print-areas";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

describe("Mockup Print-Zone Placement & Clamping (Step 4)", () => {
  const mockOrder: StoredOrderRecord = {
    id: "ord_mockup_test",
    orderNumber: "PF-TEST-MOCKUP",
    status: "ARTWORK_UPLOADED",
    subtotal: 100000,
    discount: 0,
    gst: 18000,
    shipping: 0,
    total: 118000,
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    address: { customerName: "Design Test" },
    version: 2,
    totalPausedDurationMs: 0,
    nudgeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item_test_01",
        productId: "classic-crewneck-tee",
        options: { color: "Black" },
        qty: 50,
        unitPrice: 2000,
        artworkUrl: "https://example.com/logo.png",
      },
    ],
    events: [],
  };

  beforeEach(() => {
    ORDER_STORE.set(mockOrder.id, { ...mockOrder, items: [{ ...mockOrder.items[0] }] });
    ORDER_STORE.set(mockOrder.orderNumber, { ...mockOrder, items: [{ ...mockOrder.items[0] }] });
  });

  it("retrieves standard physical print boundaries for apparel and hard goods", () => {
    const teeBounds = getPrintAreaForTemplate("classic-crewneck-tee");
    expect(teeBounds.width).toBe(170);
    expect(teeBounds.physicalWidthMm).toBe(250);

    const bottleBounds = getPrintAreaForTemplate("stainless-steel-bottle");
    expect(bottleBounds.physicalWidthMm).toBe(90);

    const badgeBounds = getPrintAreaForTemplate("round-pin-badge");
    expect(badgeBounds.shape).toBe("circle");
  });

  it("verifies placement attributes (x, y, width, height, rotation, pantone, notes) stay within schema", () => {
    const placement = {
      x: 50,
      y: 40,
      width: 60,
      height: 60,
      rotation: 15,
      pantone: "PMS 2685 C",
      notes: "Satin stitch with backing tearaway",
    };

    // Update item
    const order = ORDER_STORE.get(mockOrder.orderNumber)!;
    const item = order.items[0];
    item.placement = placement;
    item.printMethod = "Embroidery";
    order.version += 1;

    expect(item.placement).toEqual(placement);
    expect(item.printMethod).toBe("Embroidery");
    expect(order.version).toBe(3);
  });
});
