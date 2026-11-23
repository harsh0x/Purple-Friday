import { describe, it, expect, beforeEach } from "vitest";
import {
  canTransition,
  changeOrderStatus,
  normalizeOrderStatus,
  ORDER_STORE,
  StoredOrderRecord,
} from "@/server/orders/state-machine";

describe("Order State Machine - Pure Transitions", () => {
  it("normalizes QC_PASSED legacy status to IN_PRINTING", () => {
    expect(normalizeOrderStatus("QC_PASSED")).toBe("IN_PRINTING");
    expect(normalizeOrderStatus("IN_PRODUCTION")).toBe("IN_PRINTING");
    expect(normalizeOrderStatus("APPROVED")).toBe("CUSTOMER_APPROVED");
  });

  it("allows all legal state transitions for Admin", () => {
    // 1. ORDER_PLACED -> ARTWORK_UPLOADED or CANCELLED
    expect(canTransition("ORDER_PLACED", "ARTWORK_UPLOADED").allowed).toBe(true);
    expect(canTransition("ORDER_PLACED", "CANCELLED", { reason: "Customer request" }).allowed).toBe(true);

    // 2. ARTWORK_UPLOADED -> MOCKUP_SENT or CANCELLED
    expect(canTransition("ARTWORK_UPLOADED", "MOCKUP_SENT").allowed).toBe(true);
    expect(canTransition("ARTWORK_UPLOADED", "CANCELLED", { reason: "Out of stock" }).allowed).toBe(true);

    // 3. MOCKUP_SENT -> CUSTOMER_APPROVED, REVISION_REQUESTED or CANCELLED
    expect(canTransition("MOCKUP_SENT", "CUSTOMER_APPROVED").allowed).toBe(true);
    expect(canTransition("MOCKUP_SENT", "REVISION_REQUESTED").allowed).toBe(true);
    expect(canTransition("MOCKUP_SENT", "CANCELLED", { reason: "Client declined" }).allowed).toBe(true);

    // 4. REVISION_REQUESTED -> MOCKUP_SENT or CANCELLED
    expect(canTransition("REVISION_REQUESTED", "MOCKUP_SENT").allowed).toBe(true);
    expect(canTransition("REVISION_REQUESTED", "CANCELLED", { reason: "Unfeasible logo" }).allowed).toBe(true);

    // 5. CUSTOMER_APPROVED -> IN_PRINTING or CANCELLED
    expect(canTransition("CUSTOMER_APPROVED", "IN_PRINTING").allowed).toBe(true);
    expect(canTransition("CUSTOMER_APPROVED", "CANCELLED", { reason: "Defective blank batch" }).allowed).toBe(true);

    // 6. IN_PRINTING -> DISPATCHED (no QC_PASSED intermediary)
    expect(canTransition("IN_PRINTING", "DISPATCHED").allowed).toBe(true);

    // 7. DISPATCHED -> DELIVERED or RTO
    expect(canTransition("DISPATCHED", "DELIVERED").allowed).toBe(true);
    expect(canTransition("DISPATCHED", "RTO").allowed).toBe(true);

    // 8. CANCELLED -> REFUNDED (when moneyPaid=true)
    expect(canTransition("CANCELLED", "REFUNDED", { moneyPaid: true }).allowed).toBe(true);
  });

  it("forbids illegal state transitions", () => {
    // Skipping stages
    expect(canTransition("ORDER_PLACED", "IN_PRINTING").allowed).toBe(false);
    expect(canTransition("ORDER_PLACED", "DISPATCHED").allowed).toBe(false);
    expect(canTransition("ARTWORK_UPLOADED", "DELIVERED").allowed).toBe(false);
    expect(canTransition("MOCKUP_SENT", "DISPATCHED").allowed).toBe(false);

    // Backward transitions
    expect(canTransition("IN_PRINTING", "CUSTOMER_APPROVED").allowed).toBe(false);
    expect(canTransition("DISPATCHED", "IN_PRINTING").allowed).toBe(false);
    expect(canTransition("DELIVERED", "ORDER_PLACED").allowed).toBe(false);

    // Transitions from terminal states
    expect(canTransition("DELIVERED", "CANCELLED").allowed).toBe(false);
    expect(canTransition("REFUNDED", "ORDER_PLACED").allowed).toBe(false);
    expect(canTransition("RTO", "DISPATCHED").allowed).toBe(false);
  });
});

describe("Order State Machine - Cancellation Gate", () => {
  const baseOrderTime = new Date("2026-11-20T10:00:00Z").getTime();

  it("allows customer to cancel within 2-hour window before printing (1h 59m)", () => {
    const edgeTimeWithin = new Date(baseOrderTime + 119 * 60 * 1000); // 1h 59m
    const result = canTransition("ORDER_PLACED", "CANCELLED", {
      isCustomer: true,
      orderCreatedAt: baseOrderTime,
      now: edgeTimeWithin,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(true);
  });

  it("forbids customer cancellation after 2-hour window has elapsed (2h 01m)", () => {
    const edgeTimePast = new Date(baseOrderTime + 121 * 60 * 1000); // 2h 01m
    const result = canTransition("ORDER_PLACED", "CANCELLED", {
      isCustomer: true,
      orderCreatedAt: baseOrderTime,
      now: edgeTimePast,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("allows customer cancellation at exactly 2h 00m 00s", () => {
    const exactWindow = new Date(baseOrderTime + 120 * 60 * 1000); // 2h 00m
    const result = canTransition("ORDER_PLACED", "CANCELLED", {
      isCustomer: true,
      orderCreatedAt: baseOrderTime,
      now: exactWindow,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(true);
  });

  it("forbids customer cancellation once order enters IN_PRINTING even within 2 hours", () => {
    const earlyTime = new Date(baseOrderTime + 10 * 60 * 1000); // 10 minutes in
    const result = canTransition("IN_PRINTING", "CANCELLED", {
      isCustomer: true,
      orderCreatedAt: baseOrderTime,
      now: earlyTime,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(false);
  });

  it("enforces written justification for cancellations", () => {
    const withoutReason = canTransition("CUSTOMER_APPROVED", "CANCELLED", {
      reason: "",
    });
    expect(withoutReason.allowed).toBe(false);
    expect(withoutReason.reason).toContain("written justification");

    const withReason = canTransition("CUSTOMER_APPROVED", "CANCELLED", {
      reason: "Item out of inventory at supplier hub",
    });
    expect(withReason.allowed).toBe(true);
  });
});

describe("Order State Machine - Refund Gate", () => {
  it("forbids refund if money was not paid", () => {
    const result = canTransition("CANCELLED", "REFUNDED", {
      moneyPaid: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("no payment was captured");
  });

  it("allows refund when money was paid", () => {
    const result = canTransition("CANCELLED", "REFUNDED", {
      moneyPaid: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("forbids refund from non-cancelled status", () => {
    const result = canTransition("ORDER_PLACED", "REFUNDED", {
      moneyPaid: true,
    });
    expect(result.allowed).toBe(false);
  });
});

describe("Order State Machine - Optimistic Locking & Order Mutations", () => {
  const mockOrder: StoredOrderRecord = {
    id: "ord_test_001",
    orderNumber: "PF-2026-9901",
    userId: "usr_cust_123",
    status: "ARTWORK_UPLOADED",
    subtotal: 500000,
    discount: 0,
    gst: 90000,
    shipping: 0,
    total: 590000,
    paymentMethod: "COD",
    paymentStatus: "PAID",
    address: { city: "Bengaluru", state: "Karnataka" },
    version: 1,
    totalPausedDurationMs: 0,
    nudgeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item_01",
        productId: "prod_tee_01",
        options: { size: "L", color: "Black" },
        qty: 50,
        unitPrice: 10000,
      },
    ],
    events: [],
  };

  beforeEach(() => {
    ORDER_STORE.clear();
    ORDER_STORE.set(mockOrder.id, { ...mockOrder });
    ORDER_STORE.set(mockOrder.orderNumber, { ...mockOrder });
  });

  it("successfully transitions order and increments version without role argument", async () => {
    const actor = { email: "admin@purplefriday.com", name: "Client Admin" };
    const res = await changeOrderStatus(mockOrder.id, "MOCKUP_SENT", actor, "Proof rendered and attached", 1);

    expect(res.success).toBe(true);
    expect(res.order.status).toBe("MOCKUP_SENT");
    expect(res.order.version).toBe(2);
    expect(res.order.events?.[0].type).toBe("STATUS_CHANGE");
    expect(res.order.events?.[0].actor).toContain("Client Admin");
  });

  it("rejects transition with optimistic concurrency error when version is stale", async () => {
    const actor = { email: "admin@purplefriday.com" };
    await expect(
      changeOrderStatus(mockOrder.id, "MOCKUP_SENT", actor, "Proof", 99)
    ).rejects.toThrow("Someone else changed this order, refresh.");
  });
});
