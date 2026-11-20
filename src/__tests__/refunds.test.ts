import { describe, it, expect, beforeEach } from "vitest";
import {
  processOrderRefund,
  getRefundsForOrder,
  REFUND_STORE,
  REFUND_IDEMPOTENCY_MAP,
} from "@/server/refunds/refund-service";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

describe("Refunds & Support Role Limits Engine", () => {
  beforeEach(() => {
    REFUND_STORE.clear();
    REFUND_IDEMPOTENCY_MAP.clear();
  });

  describe("Role Limit Enforcement", () => {
    it("allows a Support Agent to process a refund within their authorized limit (<= Rs 5,000)", async () => {
      const testOrderNumber = `PF-REF-SUP-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-ref-1",
        orderNumber: testOrderNumber,
        status: "CANCELLED",
        subtotal: 4500,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 4500, // Rs 4,500
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {
          name: "Maya Raman",
          email: "maya@example.com",
          phone: "9876543210",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      const refund = await processOrderRefund({
        orderNumber: testOrderNumber,
        amountPaise: 450000,
        reason: "Customer cancelled prior to production",
        idempotencyKey: `idemp-sup-${Date.now()}`,
        actor: "support@purplefriday.com",
        actorRole: "SUPPORT_AGENT",
        type: "MANUAL",
        reference: "UPI_REF_12345",
      });

      expect(refund.status).toBe("PROCESSED");
      expect(refund.amountPaise).toBe(450000);
      expect(refund.processedRole).toBe("SUPPORT_AGENT");
    });

    it("blocks a Support Agent from processing a refund exceeding their authorized limit (> Rs 5,000)", async () => {
      const testOrderNumber = `PF-REF-HIGH-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-ref-2",
        orderNumber: testOrderNumber,
        status: "CANCELLED",
        subtotal: 12000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 12000, // Rs 12,000
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {
          name: "Large Org",
          email: "org@example.com",
          phone: "9876543211",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      await expect(
        processOrderRefund({
          orderNumber: testOrderNumber,
          amountPaise: 1200000, // Rs 12,000 > Rs 5,000 limit
          reason: "Bulk order cancellation",
          idempotencyKey: `idemp-block-${Date.now()}`,
          actor: "support@purplefriday.com",
          actorRole: "SUPPORT_AGENT",
          type: "MANUAL",
        })
      ).rejects.toThrow("Support Agent refund limit is Rs 5000");
    });

    it("permits a SUPER_ADMIN to process large refunds exceeding the support limit", async () => {
      const testOrderNumber = `PF-REF-ADMIN-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-ref-3",
        orderNumber: testOrderNumber,
        status: "CANCELLED",
        subtotal: 25000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 25000, // Rs 25,000
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {
          name: "VIP Client",
          email: "vip@example.com",
          phone: "9876543212",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      const refund = await processOrderRefund({
        orderNumber: testOrderNumber,
        amountPaise: 2500000,
        reason: "Super Admin authorized executive refund",
        idempotencyKey: `idemp-admin-${Date.now()}`,
        actor: "admin@purplefriday.com",
        actorRole: "SUPER_ADMIN",
        type: "MANUAL",
      });

      expect(refund.status).toBe("PROCESSED");
      expect(refund.amountPaise).toBe(2500000);
      expect(refund.processedRole).toBe("SUPER_ADMIN");
    });
  });

  describe("Partial Refunds & Balance Tracking", () => {
    it("tracks multiple partial refunds and rejects attempts to refund more than paid", async () => {
      const testOrderNumber = `PF-PARTIAL-REF-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-partial-1",
        orderNumber: testOrderNumber,
        status: "DELIVERED",
        subtotal: 10000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 10000, // Rs 10,000
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {
          name: "Karan Johar",
          email: "karan@example.com",
          phone: "9876543215",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      // Refund 1: Rs 3,000 (300000 paise)
      const r1 = await processOrderRefund({
        orderNumber: testOrderNumber,
        amountPaise: 300000,
        reason: "Damaged item during shipping",
        idempotencyKey: `idemp-part-1-${Date.now()}`,
        actor: "support@purplefriday.com",
        actorRole: "SUPPORT_AGENT",
        type: "MANUAL",
      });
      expect(r1.amountPaise).toBe(300000);

      const orderAfterR1 = ORDER_STORE.get(testOrderNumber);
      expect(orderAfterR1?.paymentStatus).toBe("PARTIALLY_REFUNDED");

      // Refund 2: Rs 7,000 (remaining balance) - execute as SUPER_ADMIN since > Rs 5000
      const r2 = await processOrderRefund({
        orderNumber: testOrderNumber,
        amountPaise: 700000,
        reason: "Remainder concession",
        idempotencyKey: `idemp-part-2-${Date.now()}`,
        actor: "admin@purplefriday.com",
        actorRole: "SUPER_ADMIN",
        type: "MANUAL",
      });
      expect(r2.amountPaise).toBe(700000);

      const orderAfterR2 = ORDER_STORE.get(testOrderNumber);
      expect(orderAfterR2?.paymentStatus).toBe("REFUNDED");

      // Refund 3: Any additional refund must be blocked
      await expect(
        processOrderRefund({
          orderNumber: testOrderNumber,
          amountPaise: 10000,
          reason: "Extra refund",
          idempotencyKey: `idemp-part-3-${Date.now()}`,
          actor: "admin@purplefriday.com",
          actorRole: "SUPER_ADMIN",
          type: "MANUAL",
        })
      ).rejects.toThrow("already been fully refunded");
    });
  });

  describe("Idempotency Protection", () => {
    it("returns identical refund record on duplicate requests without double charging", async () => {
      const testOrderNumber = `PF-IDEMP-ORD-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-idemp-1",
        orderNumber: testOrderNumber,
        status: "CANCELLED",
        subtotal: 2000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 2000,
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {
          name: "Idempotent User",
          email: "user@example.com",
          phone: "9876543216",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      const idempotencyKey = `unique-idemp-key-${Date.now()}`;

      const res1 = await processOrderRefund({
        orderNumber: testOrderNumber,
        amountPaise: 100000,
        reason: "Goodwill refund",
        idempotencyKey,
        actor: "support@purplefriday.com",
        actorRole: "SUPPORT_AGENT",
        type: "MANUAL",
      });

      const res2 = await processOrderRefund({
        orderNumber: testOrderNumber,
        amountPaise: 100000,
        reason: "Goodwill refund retry",
        idempotencyKey,
        actor: "support@purplefriday.com",
        actorRole: "SUPPORT_AGENT",
        type: "MANUAL",
      });

      expect(res1.id).toBe(res2.id);
      expect(res1.refundNumber).toBe(res2.refundNumber);

      const allRefunds = getRefundsForOrder(testOrderNumber);
      expect(allRefunds.length).toBe(1); // Exactly one record exists
    });
  });
});
