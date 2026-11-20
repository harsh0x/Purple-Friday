import { describe, it, expect, beforeEach } from "vitest";
import {
  validateCodEligibility,
  processCodAdvancePayment,
  markCodBalanceCollected,
} from "@/server/payments/cod-service";
import { ORDER_STORE, canTransition, StoredOrderRecord } from "@/server/orders/state-machine";
import { PIN_STATS_STORE } from "@/server/risk/rto";

describe("Partial Cash on Delivery (COD) Engine", () => {
  beforeEach(() => {
    PIN_STATS_STORE.clear();
  });

  describe("COD Eligibility & Advance Calculation", () => {
    it("calculates 25% advance and 75% balance due accurately with integer paise", async () => {
      const order = {
        customerName: "Rohan Verma",
        customerPhone: "9876543210",
        customerEmail: "rohan@example.com",
        shippingAddress: {
          line1: "Flat 101, Green Acres, MG Road",
          city: "Pune",
          state: "Maharashtra",
          pin: "411001",
        },
        billingAddress: { state: "Maharashtra" },
        paymentMethod: "COD",
        totalPaise: 400000, // Rs 4,000.00
      };

      const result = await validateCodEligibility(order);
      expect(result.eligible).toBe(true);
      expect(result.advancePercent).toBe(25);
      expect(result.advancePaise).toBe(100000); // Rs 1,000
      expect(result.balanceDuePaise).toBe(300000); // Rs 3,000
    });

    it("applies roundHalfUp rounding rule once per line calculation", async () => {
      // Rs 1,235.50 -> 123550 paise. 25% = 30887.5 paise -> rounds half up to 30888 paise.
      const order = {
        customerName: "Neha Gupta",
        customerPhone: "9876543211",
        shippingAddress: {
          line1: "House 24, Model Town, Civil Lines",
          city: "Delhi",
          state: "Delhi",
          pin: "110009",
        },
        billingAddress: { state: "Delhi" },
        paymentMethod: "COD",
        totalPaise: 123550,
      };

      const result = await validateCodEligibility(order);
      expect(result.eligible).toBe(true);
      expect(result.advancePaise).toBe(30888);
      expect(result.balanceDuePaise).toBe(123550 - 30888);
    });

    it("rejects COD when total value exceeds maximum allowed COD threshold (Rs 15,000)", async () => {
      const highValueOrder = {
        customerName: "Corporate Buyer",
        customerPhone: "9876543212",
        shippingAddress: {
          line1: "Tower B, Cyber City, DLF Phase 2",
          city: "Gurugram",
          state: "Haryana",
          pin: "122002",
        },
        paymentMethod: "COD",
        totalPaise: 2500000, // Rs 25,000.00 > Rs 15,000
      };

      const result = await validateCodEligibility(highValueOrder);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("only available for orders up to Rs 15000");
    });

    it("blocks COD for addresses with severe RTO risk score >= 50", async () => {
      // Simulate high RTO pin code (e.g. 800001 with 5 delivered, 3 RTO = 37.5% RTO rate -> +30)
      // plus state mismatch (+15) plus suspicious address (+25) => score 70
      PIN_STATS_STORE.set("800001", {
        pincode: "800001",
        deliveredCount: 5,
        rtoCount: 3,
        totalOrders: 8,
        rtoRate: 0.375,
      });

      const riskyOrder = {
        customerName: "Guest",
        customerPhone: "9876543213",
        shippingAddress: {
          line1: "Near temple", // Suspiciously short address
          city: "Patna",
          state: "Bihar",
          pin: "800001",
        },
        billingAddress: { state: "Uttar Pradesh" }, // State mismatch
        paymentMethod: "COD",
        totalPaise: 400000,
      };

      const result = await validateCodEligibility(riskyOrder);
      expect(result.eligible).toBe(false);
      expect(result.isPrepaidOnly).toBe(true);
      expect(result.reason).toContain("Prepaid only");
    });

    it("permits COD when staff explicitly overrides RTO risk", async () => {
      PIN_STATS_STORE.set("800001", {
        pincode: "800001",
        deliveredCount: 5,
        rtoCount: 3,
        totalOrders: 8,
        rtoRate: 0.375,
      });

      const riskyOrder = {
        customerName: "Verified VIP",
        customerPhone: "9876543214",
        shippingAddress: {
          line1: "Near temple",
          city: "Patna",
          state: "Bihar",
          pin: "800001",
        },
        paymentMethod: "COD",
        totalPaise: 400000,
      };

      const result = await validateCodEligibility(riskyOrder, true); // Overridden
      expect(result.eligible).toBe(true);
      expect(result.advancePaise).toBe(100000);
    });
  });

  describe("Production Gate & State Machine COD Guard", () => {
    it("blocks transition to IN_PRINTING if COD order is still in PENDING payment status", () => {
      const result = canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "FACTORY_MANAGER", {
        paymentMethod: "COD",
        paymentStatus: "PENDING",
      });
      expect(result.allowed).toBe(false);
    });

    it("permits transition to IN_PRINTING once COD advance is paid (ADVANCE_PAID)", () => {
      const result = canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "FACTORY_MANAGER", {
        paymentMethod: "COD",
        paymentStatus: "ADVANCE_PAID",
      });
      expect(result.allowed).toBe(true);
    });

    it("permits transition to IN_PRINTING for PREPAID orders that are PAID", () => {
      const result = canTransition("CUSTOMER_APPROVED", "IN_PRINTING", "FACTORY_MANAGER", {
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("Advance Payment Processing & Idempotency", () => {
    it("processes advance payment and transitions order paymentStatus to ADVANCE_PAID", async () => {
      const testOrderNumber = `PF-TEST-COD-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-cod-1",
        orderNumber: testOrderNumber,
        status: "CUSTOMER_APPROVED",
        subtotal: 5000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 5000,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        address: {
          name: "Vikram Malhotra",
          email: "vikram@example.com",
          phone: "9876543219",
          line1: "Flat 2, Green View",
          city: "Bengaluru",
          state: "Karnataka",
          pin: "560001",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            options: {},
            qty: 5,
            unitPrice: 1000,
          },
        ],
        advancePaidPaise: 0,
        balanceDuePaise: 500000,
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      const res1 = await processCodAdvancePayment({
        orderNumber: testOrderNumber,
        paymentId: "pay_test_advance_123",
        amountPaise: 125000, // 25% of 500000
      });

      expect(res1.paymentStatus).toBe("ADVANCE_PAID");
      expect(res1.advancePaidPaise).toBe(125000);
      expect(res1.balanceDuePaise).toBe(375000);

      // Idempotency: second call with same paymentId returns unchanged state without error
      const res2 = await processCodAdvancePayment({
        orderNumber: testOrderNumber,
        paymentId: "pay_test_advance_123",
        amountPaise: 125000,
      });

      expect(res2.paymentStatus).toBe("ADVANCE_PAID");
      expect(res2.advancePaidPaise).toBe(125000);
    });

    it("allows staff to record COD balance collected upon delivery with full audit", async () => {
      const testOrderNumber = `PF-TEST-COLLECT-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-ord-collect-1",
        orderNumber: testOrderNumber,
        status: "DELIVERED",
        subtotal: 2000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 2000,
        paymentMethod: "COD",
        paymentStatus: "ADVANCE_PAID",
        address: {
          name: "Sunil Rao",
          email: "sunil@example.com",
          phone: "9876543220",
        },
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        advancePaidPaise: 50000,
        balanceDuePaise: 150000,
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      const updated = await markCodBalanceCollected({
        orderNumber: testOrderNumber,
        actor: "staff@purplefriday.com",
        actorRole: "FACTORY_MANAGER",
        notes: "Delivered & cash received by delivery associate",
      });

      expect(updated.paymentStatus).toBe("PAID");
      expect(updated.balanceDuePaise).toBe(0);
      expect(updated.balanceCollectedBy).toBe("staff@purplefriday.com");
      expect(updated.balanceCollectedAt).toBeDefined();
    });
  });
});
