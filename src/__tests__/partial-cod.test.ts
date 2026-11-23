import { describe, it, expect, beforeEach } from "vitest";
import {
  validateCodEligibility,
  markCodBalanceCollected,
} from "@/server/payments/cod-service";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

  describe("Cash on Delivery (COD) / Pay Later Engine", () => {
    const sampleOrder: StoredOrderRecord = {
      id: "ord_cod_test_1",
      orderNumber: "PF-2611-99001",
      userId: "usr_test_1",
      status: "ORDER_PLACED",
      subtotal: 400000,
      discount: 0,
      gst: 72000,
      shipping: 0,
      total: 472000,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      advancePaidPaise: 0,
      balanceDuePaise: 472000,
      address: {
        line1: "Flat 101, Green Acres, MG Road",
        city: "Pune",
        state: "Maharashtra",
        pin: "411001",
        customerName: "Rohan Verma",
        customerPhone: "9876543210",
        customerEmail: "rohan@example.com",
      },
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      events: [],
    };

    beforeEach(() => {
      ORDER_STORE.set(sampleOrder.orderNumber, { ...sampleOrder, version: 1, events: [] });
    });

        it("permits Cash on Delivery with zero advance required and full balance on delivery", async () => {
          const result = await validateCodEligibility({
            customerName: "Rohan Verma",
            customerPhone: "9876543210",
            customerEmail: "rohan@example.com",
            shippingAddress: {
              line1: "Flat 101, Green Acres",
              city: "Pune",
              state: "Maharashtra",
              pin: "411001",
            },
            paymentMethod: "COD",
            totalPaise: 472000,
          });

          expect(result.eligible).toBe(true);
          expect(result.advancePaise).toBe(0);
          expect(result.balanceDuePaise).toBe(472000);
          expect(result.isPrepaidOnly).toBe(false);
        });

            it("marks COD balance as collected via admin manual reconciliation", async () => {
              const res = await markCodBalanceCollected({
                orderNumber: sampleOrder.orderNumber,
                actor: "admin@purplefriday.in",
                actorRole: "SUPER_ADMIN",
                method: "COD",
                notes: "Cash collected upon package delivery by courier",
              });

              expect(res.success).toBe(true);
              expect(res.paymentStatus).toBe("PAID");
              expect(res.balanceDuePaise).toBe(0);

              const updated = ORDER_STORE.get(sampleOrder.orderNumber)!;
              expect(updated.paymentStatus).toBe("PAID");
              expect(updated.balanceDuePaise).toBe(0);
            });
          });
