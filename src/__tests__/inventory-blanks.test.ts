import { describe, it, expect } from "vitest";
import {
  getBlankInventory,
  getBlankSku,
  adjustStock,
  getStockMovements,
  reserveBlanksForOrder,
  consumeBlanksForOrder,
  releaseBlanksForOrder,
} from "@/server/inventory/inventory-service";

describe("Blank Inventory - Ledger & Stock Levels", () => {
  it("initializes blank inventory with low stock calculations", async () => {
    const all = await getBlankInventory();
    expect(all.length).toBeGreaterThanOrEqual(9);

    // Hoodie (18 on hand <= 20 reorder) and Cap (8 on hand <= 15 reorder) are low stock
    const lowStock = await getBlankInventory({ lowStockOnly: true });
    expect(lowStock.length).toBeGreaterThanOrEqual(2);
    expect(lowStock.some((s) => s.sku === "BLANK-HOODIE-GREY-XL")).toBe(true);
    expect(lowStock.some((s) => s.sku === "BLANK-CAP-BLACK-OS")).toBe(true);
  });

  it("records opening stock movement in the immutable ledger", async () => {
    const movements = await getStockMovements("BLANK-POLO-NAVY-M");
    expect(movements.length).toBeGreaterThanOrEqual(1);
    expect(movements.some((m) => m.reason === "PURCHASE")).toBe(true);
  });
});

describe("Blank Inventory - Quick Adjust & Optimistic Concurrency", () => {
  const actor = { name: "Warehouse Supervisor", role: "FACTORY_MANAGER" };

  it("adjusts stock by delta and records movement ledger with actor and notes", async () => {
    const sku = await getBlankSku("BLANK-TEE-BLACK-L");
    expect(sku).not.toBeNull();
    const initialOnHand = sku!.stockOnHand;

    const res = await adjustStock({
      skuId: "BLANK-TEE-BLACK-L",
      delta: 50, // Received 50 pcs from Coimbatore Knitting Hub
      reason: "PURCHASE",
      notes: "PO-4091 shipment verified",
      expectedVersion: sku!.version,
      actor,
    });

    expect(res.success).toBe(true);
    expect(res.item?.stockOnHand).toBe(initialOnHand + 50);

    // Check ledger record
    const movements = await getStockMovements("BLANK-TEE-BLACK-L");
    const latest = movements[0];
    expect(latest.reason).toBe("PURCHASE");
    expect(latest.changeQty).toBe(50);
    expect(latest.actor).toBe("Warehouse Supervisor");
    expect(latest.notes).toContain("PO-4091");
  });

  it("enforces optimistic version check on concurrent adjustments", async () => {
    const sku = await getBlankSku("BLANK-POLO-NAVY-L");
    const staleVersion = sku!.version - 1;

    const res = await adjustStock({
      skuId: "BLANK-POLO-NAVY-L",
      delta: 10,
      reason: "ADJUSTMENT",
      expectedVersion: staleVersion,
      actor,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Conflict: Inventory was modified by another operator");
  });
});

describe("Blank Inventory - Order Reservation, Consumption, and Release Lifecycle", () => {
  it("reserves blanks when order is paid, consumes on IN_PRINTING, and releases on cancellation", async () => {
    const sku = await getBlankSku("BLANK-POLO-NAVY-M");
    const initialOnHand = sku!.stockOnHand;
    const initialReserved = sku!.reservedQty;
    const initialAvailable = sku!.availableQty;

    const testOrderId = `test_ord_${Date.now()}`;
    const orderItems = [{ blankSkuId: "BLANK-POLO-NAVY-M", qty: 10 }];

    // 1. Payment: Reserve blanks
    const resReserve = await reserveBlanksForOrder(testOrderId, orderItems, "Payment Gateway");
    expect(resReserve.success).toBe(true);
    expect(resReserve.reservedCount).toBe(10);

    const postReserve = await getBlankSku("BLANK-POLO-NAVY-M");
    expect(postReserve!.reservedQty).toBe(initialReserved + 10);
    expect(postReserve!.availableQty).toBe(initialAvailable - 10);
    expect(postReserve!.stockOnHand).toBe(initialOnHand); // Physical stock still in warehouse

    // 2. Production: Consume blanks into printing floor
    const resConsume = await consumeBlanksForOrder(testOrderId, orderItems, "Factory Operator");
    expect(resConsume.success).toBe(true);
    expect(resConsume.consumedCount).toBe(10);

    const postConsume = await getBlankSku("BLANK-POLO-NAVY-M");
    expect(postConsume!.stockOnHand).toBe(initialOnHand - 10); // Physical stock consumed
    expect(postConsume!.reservedQty).toBe(initialReserved); // Reservation resolved

    // 3. Test Cancellation Release on another order
    const cancelOrderId = `cancel_ord_${Date.now()}`;
    await reserveBlanksForOrder(cancelOrderId, orderItems, "Customer Checkout");
    const preCancel = await getBlankSku("BLANK-POLO-NAVY-M");
    expect(preCancel!.reservedQty).toBe(initialReserved + 10);

    await releaseBlanksForOrder(cancelOrderId, orderItems, "Support Agent");
    const postCancel = await getBlankSku("BLANK-POLO-NAVY-M");
    expect(postCancel!.reservedQty).toBe(initialReserved); // Restored
  });
});
