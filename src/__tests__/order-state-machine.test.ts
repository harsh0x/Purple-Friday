import { describe, it, expect, beforeEach } from "vitest";
import {
  canTransition,
  changeOrderStatus,
  recordQcRework,
  ORDER_STORE,
  StoredOrderRecord,
  OrderStatus,
} from "@/server/orders/state-machine";

describe("Order State Machine - Pure Transitions", () => {
  it("allows all legal state transitions for SUPER_ADMIN", () => {
    // 1. ORDER_PLACED -> ARTWORK_UPLOADED or CANCELLED
    expect(canTransition("ORDER_PLACED", "ARTWORK_UPLOADED", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("ORDER_PLACED", "CANCELLED", "SUPER_ADMIN", { reason: "Customer request" }).allowed).toBe(true);

    // 2. ARTWORK_UPLOADED -> MOCKUP_SENT or CANCELLED
    expect(canTransition("ARTWORK_UPLOADED", "MOCKUP_SENT", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("ARTWORK_UPLOADED", "CANCELLED", "SUPER_ADMIN", { reason: "Out of stock" }).allowed).toBe(true);

    // 3. MOCKUP_SENT -> CUSTOMER_APPROVED, REVISION_REQUESTED or CANCELLED
    expect(canTransition("MOCKUP_SENT", "CUSTOMER_APPROVED", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("MOCKUP_SENT", "REVISION_REQUESTED", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("MOCKUP_SENT", "CANCELLED", "SUPER_ADMIN", { reason: "Client declined" }).allowed).toBe(true);

    // 4. REVISION_REQUESTED -> MOCKUP_SENT or CANCELLED
    expect(canTransition("REVISION_REQUESTED", "MOCKUP_SENT", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("REVISION_REQUESTED", "CANCELLED", "SUPER_ADMIN", { reason: "Unfeasible logo" }).allowed).toBe(true);

    // 5. CUSTOMER_APPROVED -> IN_PRINTING or CANCELLED
    expect(canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("CUSTOMER_APPROVED", "CANCELLED", "SUPER_ADMIN", { reason: "Defective blank batch" }).allowed).toBe(true);

    // 6. IN_PRINTING -> QC_PASSED
    expect(canTransition("IN_PRINTING", "QC_PASSED", "SUPER_ADMIN").allowed).toBe(true);

    // 7. QC_PASSED -> DISPATCHED
    expect(canTransition("QC_PASSED", "DISPATCHED", "SUPER_ADMIN").allowed).toBe(true);

    // 8. DISPATCHED -> DELIVERED or RTO
    expect(canTransition("DISPATCHED", "DELIVERED", "SUPER_ADMIN").allowed).toBe(true);
    expect(canTransition("DISPATCHED", "RTO", "SUPER_ADMIN").allowed).toBe(true);

    // 9. CANCELLED -> REFUNDED (when moneyPaid=true)
    expect(canTransition("CANCELLED", "REFUNDED", "SUPER_ADMIN", { moneyPaid: true }).allowed).toBe(true);
  });

  it("forbids illegal state transitions regardless of role", () => {
    // Skipping stages
    expect(canTransition("ORDER_PLACED", "IN_PRINTING", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("ORDER_PLACED", "DISPATCHED", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("ARTWORK_UPLOADED", "DELIVERED", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("MOCKUP_SENT", "DISPATCHED", "SUPER_ADMIN").allowed).toBe(false);

    // Backward transitions
    expect(canTransition("IN_PRINTING", "CUSTOMER_APPROVED", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("DISPATCHED", "QC_PASSED", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("DELIVERED", "ORDER_PLACED", "SUPER_ADMIN").allowed).toBe(false);

    // Transitions from terminal states
    expect(canTransition("DELIVERED", "CANCELLED", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("REFUNDED", "ORDER_PLACED", "SUPER_ADMIN").allowed).toBe(false);
    expect(canTransition("RTO", "DISPATCHED", "SUPER_ADMIN").allowed).toBe(false);
  });
});

describe("Order State Machine - Role-Based Access Control", () => {
  it("enforces GRAPHIC_DESIGNER permissions", () => {
    // Allowed: upload/send mockup
    expect(canTransition("ARTWORK_UPLOADED", "MOCKUP_SENT", "GRAPHIC_DESIGNER").allowed).toBe(true);
    expect(canTransition("REVISION_REQUESTED", "MOCKUP_SENT", "GRAPHIC_DESIGNER").allowed).toBe(true);

    // Forbidden: moving into printing, QC, dispatch, cancellation, refund
    expect(canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "GRAPHIC_DESIGNER").allowed).toBe(false);
    expect(canTransition("QC_PASSED", "DISPATCHED", "GRAPHIC_DESIGNER").allowed).toBe(false);
    expect(canTransition("ORDER_PLACED", "CANCELLED", "GRAPHIC_DESIGNER", { reason: "Test" }).allowed).toBe(false);
    expect(canTransition("CANCELLED", "REFUNDED", "GRAPHIC_DESIGNER", { moneyPaid: true }).allowed).toBe(false);
  });

  it("enforces FACTORY_MANAGER permissions", () => {
    // Allowed: production workflow
    expect(canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "FACTORY_MANAGER").allowed).toBe(true);
    expect(canTransition("IN_PRINTING", "QC_PASSED", "FACTORY_MANAGER").allowed).toBe(true);
    expect(canTransition("QC_PASSED", "DISPATCHED", "FACTORY_MANAGER").allowed).toBe(true);

    // Forbidden: design proofs, customer approval, cancellation, refund
    expect(canTransition("ARTWORK_UPLOADED", "MOCKUP_SENT", "FACTORY_MANAGER").allowed).toBe(false);
    expect(canTransition("MOCKUP_SENT", "CUSTOMER_APPROVED", "FACTORY_MANAGER").allowed).toBe(false);
    expect(canTransition("ORDER_PLACED", "CANCELLED", "FACTORY_MANAGER", { reason: "Test" }).allowed).toBe(false);
    expect(canTransition("CANCELLED", "REFUNDED", "FACTORY_MANAGER", { moneyPaid: true }).allowed).toBe(false);
  });

  it("enforces CUSTOMER permissions", () => {
    // Allowed: artwork upload, approval, requesting changes
    expect(canTransition("ORDER_PLACED", "ARTWORK_UPLOADED", "CUSTOMER").allowed).toBe(true);
    expect(canTransition("MOCKUP_SENT", "CUSTOMER_APPROVED", "CUSTOMER").allowed).toBe(true);
    expect(canTransition("MOCKUP_SENT", "REVISION_REQUESTED", "CUSTOMER").allowed).toBe(true);

    // Forbidden: internal production steps
    expect(canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "CUSTOMER").allowed).toBe(false);
    expect(canTransition("IN_PRINTING", "QC_PASSED", "CUSTOMER").allowed).toBe(false);
    expect(canTransition("QC_PASSED", "DISPATCHED", "CUSTOMER").allowed).toBe(false);
  });

  it("enforces SUPPORT_AGENT permissions", () => {
    // Allowed: delivery management, cancellations with reason, refund
    expect(canTransition("DISPATCHED", "DELIVERED", "SUPPORT_AGENT").allowed).toBe(true);
    expect(canTransition("DISPATCHED", "RTO", "SUPPORT_AGENT").allowed).toBe(true);
    expect(canTransition("ORDER_PLACED", "CANCELLED", "SUPPORT_AGENT", { reason: "Customer requested over phone" }).allowed).toBe(true);
    expect(canTransition("CANCELLED", "REFUNDED", "SUPPORT_AGENT", { moneyPaid: true }).allowed).toBe(true);

    // Forbidden: printing or proof stages
    expect(canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "SUPPORT_AGENT").allowed).toBe(false);
    expect(canTransition("ARTWORK_UPLOADED", "MOCKUP_SENT", "SUPPORT_AGENT").allowed).toBe(false);
  });
});

describe("Order State Machine - Cancellation Gate", () => {
  const baseOrderTime = new Date("2026-11-20T10:00:00Z").getTime();

  it("allows customer to cancel within 2-hour window before printing (1h 59m)", () => {
    const edgeTimeWithin = new Date(baseOrderTime + 119 * 60 * 1000); // 1h 59m
    const result = canTransition("ORDER_PLACED", "CANCELLED", "CUSTOMER", {
      orderCreatedAt: baseOrderTime,
      now: edgeTimeWithin,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(true);
  });

  it("forbids customer cancellation after 2-hour window has elapsed (2h 01m)", () => {
    const edgeTimePast = new Date(baseOrderTime + 121 * 60 * 1000); // 2h 01m
    const result = canTransition("ORDER_PLACED", "CANCELLED", "CUSTOMER", {
      orderCreatedAt: baseOrderTime,
      now: edgeTimePast,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("allows customer cancellation at exactly 2h 00m 00s", () => {
    const exactWindow = new Date(baseOrderTime + 120 * 60 * 1000); // 2h 00m
    const result = canTransition("ORDER_PLACED", "CANCELLED", "CUSTOMER", {
      orderCreatedAt: baseOrderTime,
      now: exactWindow,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(true);
  });

  it("forbids customer cancellation once order enters IN_PRINTING even within 2 hours", () => {
    const earlyTime = new Date(baseOrderTime + 10 * 60 * 1000); // 10 minutes in
    // Note: Table doesn't even allow IN_PRINTING -> CANCELLED, but also gate checks pre-printing status
    const result = canTransition("IN_PRINTING", "CANCELLED", "CUSTOMER", {
      orderCreatedAt: baseOrderTime,
      now: earlyTime,
      cancellationWindowHours: 2,
    });
    expect(result.allowed).toBe(false);
  });

  it("enforces written justification for staff cancellations", () => {
    // Missing reason -> forbidden
    const withoutReason = canTransition("CUSTOMER_APPROVED", "CANCELLED", "SUPPORT_AGENT", {
      reason: "",
    });
    expect(withoutReason.allowed).toBe(false);
    expect(withoutReason.reason).toContain("written justification");

    // With reason -> allowed
    const withReason = canTransition("CUSTOMER_APPROVED", "CANCELLED", "SUPPORT_AGENT", {
      reason: "Item out of inventory at supplier hub",
    });
    expect(withReason.allowed).toBe(true);
  });
});

describe("Order State Machine - Refund Gate", () => {
  it("forbids refund if money was not paid", () => {
    const result = canTransition("CANCELLED", "REFUNDED", "SUPPORT_AGENT", {
      moneyPaid: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("no payment was captured");
  });

  it("allows refund when money was paid", () => {
    const result = canTransition("CANCELLED", "REFUNDED", "SUPPORT_AGENT", {
      moneyPaid: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("forbids refund from non-cancelled status", () => {
    const result = canTransition("ORDER_PLACED", "REFUNDED", "SUPPORT_AGENT", {
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
    paymentMethod: "RAZORPAY",
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

  it("successfully transitions order and increments version", async () => {
    const actor = { email: "designer@purplefriday.com", role: "GRAPHIC_DESIGNER", name: "Ananya Deshmukh" };
    const res = await changeOrderStatus(mockOrder.id, "MOCKUP_SENT", actor, "Proof rendered and attached", 1);

    expect(res.success).toBe(true);
    expect(res.order.status).toBe("MOCKUP_SENT");
    expect(res.order.version).toBe(2);
    expect(res.order.events?.[0].type).toBe("STATUS_CHANGE");
    expect(res.order.events?.[0].actor).toContain("Ananya Deshmukh");
    expect(res.order.pausedAt).toBeDefined(); // SLA clock paused
  });

  it("rejects transition with optimistic concurrency error when version is stale", async () => {
    const actor = { email: "designer@purplefriday.com", role: "GRAPHIC_DESIGNER" };
    // Pass expectedVersion = 99 when order is version 1
    await expect(
      changeOrderStatus(mockOrder.id, "MOCKUP_SENT", actor, "Proof", 99)
    ).rejects.toThrow("Someone else changed this order, refresh.");
  });

  it("records QC rework event on IN_PRINTING without changing status", async () => {
    // Setup order as IN_PRINTING
    const printingOrder: StoredOrderRecord = {
      ...mockOrder,
      id: "ord_test_002",
      orderNumber: "PF-2026-9902",
      status: "IN_PRINTING",
      version: 3,
    };
    ORDER_STORE.set(printingOrder.id, printingOrder);

    const actor = { email: "factory@purplefriday.com", role: "FACTORY_MANAGER", name: "Vikram Singhania" };
    const res = await recordQcRework(printingOrder.id, actor, "Color registration misaligned on back print", 3);

    expect(res.success).toBe(true);
    expect(res.order.status).toBe("IN_PRINTING"); // Status unchanged
    expect(res.order.version).toBe(4); // Version bumped
    expect(res.order.events?.[0].type).toBe("QC_REWORK");
    expect(res.order.events?.[0].message).toContain("Color registration misaligned");
  });

  it("rejects QC rework on non-printing order", async () => {
    const actor = { email: "factory@purplefriday.com", role: "FACTORY_MANAGER" };
    await expect(
      recordQcRework(mockOrder.id, actor, "Rework")
    ).rejects.toThrow("QC rework can only be registered on orders currently IN_PRINTING");
  });
});
