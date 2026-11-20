import { describe, it, expect, beforeEach } from "vitest";
import {
  listAdminOrders,
  getAdminOrderDetail,
  bulkAssignDesigner,
  addOrderInternalNote,
  exportOrdersCsv,
  computeOrderSla,
} from "@/server/orders/orders-service";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

describe("Order Service - RBAC Financial Data Masking", () => {
  it("strictly masks financial totals and payment status from GRAPHIC_DESIGNER", async () => {
    const res = await listAdminOrders({}, "GRAPHIC_DESIGNER");
    expect(res.orders.length).toBeGreaterThan(0);

    for (const order of res.orders) {
      expect(order.totalPaise).toBeUndefined();
      expect(order.paymentStatus).toBeUndefined();
    }
  });

  it("strictly masks financial totals and payment status from FACTORY_MANAGER", async () => {
    const res = await listAdminOrders({}, "FACTORY_MANAGER");
    expect(res.orders.length).toBeGreaterThan(0);

    for (const order of res.orders) {
      expect(order.totalPaise).toBeUndefined();
      expect(order.paymentStatus).toBeUndefined();
    }
  });

  it("reveals financial totals and payment status to SUPER_ADMIN and SUPPORT_AGENT", async () => {
    const adminRes = await listAdminOrders({}, "SUPER_ADMIN");
    const supportRes = await listAdminOrders({}, "SUPPORT_AGENT");

    expect(adminRes.orders[0].totalPaise).toBeDefined();
    expect(adminRes.orders[0].paymentStatus).toBe("PAID");

    expect(supportRes.orders[0].totalPaise).toBeDefined();
    expect(supportRes.orders[0].paymentStatus).toBe("PAID");
  });

  it("masks line item unit prices and totals in order details for FACTORY_MANAGER", async () => {
    const detail = await getAdminOrderDetail("PF-2611-40891", "FACTORY_MANAGER");
    expect(detail).not.toBeNull();
    expect(detail?.total).toBe(0);
    expect(detail?.subtotal).toBe(0);
    expect(detail?.gst).toBe(0);
    expect(detail?.paymentStatus).toBe("MASKED");
    expect(detail?.items[0].unitPrice).toBe(0);
  });
});

describe("Order Service - Filtering, Search & SLA", () => {
  it("filters orders by status accurately", async () => {
    const res = await listAdminOrders({ status: "IN_PRINTING" }, "SUPER_ADMIN");
    expect(res.orders.length).toBeGreaterThan(0);
    for (const o of res.orders) {
      expect(o.status).toBe("IN_PRINTING");
    }
  });

  it("searches across order number, customer name, and email", async () => {
    const byNumber = await listAdminOrders({ search: "40891" }, "SUPER_ADMIN");
    expect(byNumber.orders.length).toBe(1);
    expect(byNumber.orders[0].orderNumber).toBe("PF-2611-40891");

    const byName = await listAdminOrders({ search: "Aarav" }, "SUPER_ADMIN");
    expect(byName.orders.length).toBe(1);
    expect(byName.orders[0].customerName).toBe("Aarav Sharma");
  });

  it("detects overdue SLA orders correctly", async () => {
    const res = await listAdminOrders({ overdueOnly: true }, "SUPER_ADMIN");
    expect(res.orders.length).toBeGreaterThan(0);
    for (const o of res.orders) {
      expect(o.isOverdue).toBe(true);
    }
  });

  it("pauses SLA for orders waiting on customer mockup review", () => {
    const mockOrder: StoredOrderRecord = {
      id: "ord_paused_test",
      orderNumber: "PF-PAUSE-01",
      status: "MOCKUP_SENT",
      subtotal: 1000,
      discount: 0,
      gst: 180,
      shipping: 0,
      total: 1180,
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      address: {},
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    };

    const sla = computeOrderSla(mockOrder);
    expect(sla.isPaused).toBe(true);
    expect(sla.urgency).toBe("paused");
  });
});

describe("Order Service - Bulk Assign & CSV Export", () => {
  it("bulk assigns designer and updates order version", async () => {
    const actor = { email: "admin@purplefriday.com", role: "SUPER_ADMIN", name: "Admin" };
    const res = await bulkAssignDesigner(["PF-2611-40891", "PF-2611-40892"], "usr_des_rahul", actor);

    expect(res.count).toBe(2);
    expect(res.updated).toContain("PF-2611-40891");
    expect(res.updated).toContain("PF-2611-40892");

    const detail = await getAdminOrderDetail("PF-2611-40891", "SUPER_ADMIN");
    expect(detail?.assignedDesignerId).toBe("usr_des_rahul");
    expect(detail?.events?.[0].type).toBe("DESIGNER_ASSIGNED");
  });

  it("exports CSV with DDE formula injection sanitization", async () => {
    // Inject test order with dangerous formula injection strings
    const evilOrder: StoredOrderRecord = {
      id: "ord_evil",
      orderNumber: "=cmd|' /C calc'!A0",
      status: "ORDER_PLACED",
      subtotal: 1000,
      discount: 0,
      gst: 180,
      shipping: 0,
      total: 1180,
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      address: {
        customerName: "+@EVIL_NAME",
        email: "-evil@payload.com",
      },
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    };
    ORDER_STORE.set(evilOrder.id, evilOrder);
    ORDER_STORE.set(evilOrder.orderNumber, evilOrder);

    const csv = await exportOrdersCsv({ search: "=cmd" }, "SUPER_ADMIN");
    // Verify unsafe prefixes are escaped with single quote
    expect(csv).toContain("'=cmd|' /C calc'!A0");
    expect(csv).toContain("'+@EVIL_NAME");
    expect(csv).toContain("'-evil@payload.com");
  });
});
