import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { ORDER_IDEMPOTENCY_MAP } from "@/server/orders/idempotency";
import { processOrderRefund } from "@/server/refunds/refund-service";
import { markOrderPaidManually } from "@/server/payments/cod-service";
import { createOrder, getOrderByNumber } from "@/lib/orders";
import { ORDER_STORE } from "@/server/orders/state-machine";

  describe("Checkout Flow - No-Payment / Cash on Delivery Security", () => {
    beforeEach(() => {
      ORDER_IDEMPOTENCY_MAP.clear();
    });

    const validPayload = {
      customerName: "Rohan Verma",
      customerEmail: "rohan.verma@example.com",
      customerPhone: "9876543210",
      shippingAddress: {
        line1: "123 Indiranagar 100ft Road",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560038",
      },
      items: [
        {
          productId: "classic-crewneck-tee",
          optionKey: "opt-white-m",
          qty: 10,
          unitPrice: 1, // Tampered client price (1 rupee!)
          lineTotal: 10, // Tampered line total
        },
      ],
      total: 10, // Tampered total
    };

        it("1. ignores tampered prices/totals from client and recomputes server-side", async () => {
        const req = new NextRequest("http://localhost:3000/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validPayload),
        });

    const res = await createOrderRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Total must NOT be 10 rupees. It must be computed based on server catalog pricing.
    expect(data.total).toBeGreaterThan(500);

      const storedOrder = getOrderByNumber(data.orderNumber);
      expect(storedOrder).toBeDefined();
      expect(storedOrder?.total).toBe(data.total);
      expect(storedOrder?.paymentMethod).toBe("COD");
      expect(storedOrder?.paymentStatus).toBe("PENDING");
    });

    it("2. returns existing order for same idempotency key without creating duplicate", async () => {
      const idempKey = "test_idemp_key_12345";
      const payload = {
        ...validPayload,
        idempotencyKey: idempKey,
      };

      const req1 = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res1 = await createOrderRoute(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.success).toBe(true);

      const req2 = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

        const res2 = await createOrderRoute(req2);
        expect(res2.status).toBe(200);
        const data2 = await res2.json();

        // Must return the exact same orderNumber and orderId
        expect(data2.orderId).toBe(data1.orderId);
        expect(data2.orderNumber).toBe(data1.orderNumber);
        expect(data2.total).toBe(data1.total);
      });

        it("3. rejects invalid input with 400", async () => {
          const invalidPayload = {
            customerName: "R", // Too short
            customerEmail: "not-an-email",
            customerPhone: "1234", // Invalid phone
            shippingAddress: {
              line1: "",
              city: "",
              state: "",
              pin: "invalid-pin",
            },
            items: [], // Empty items
          };

          const req = new NextRequest("http://localhost:3000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invalidPayload),
          });

          const res = await createOrderRoute(req);
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
        });

            it("4. prevents refunds that exceed the paid amount", async () => {
            // Create an order
            const order = await createOrder({
              customerName: "Ananya Iyer",
              customerEmail: "ananya@example.com",
              customerPhone: "9876501234",
              shippingAddress: {
                line1: "42 Richmond Road",
                city: "Bengaluru",
                state: "Karnataka",
                pin: "560025",
              },
              items: [
                {
                  productId: "classic-crewneck-tee",
                  optionKey: "opt-black-l",
                  qty: 5,
                },
              ],
              paymentMethod: "COD",
            });

          // Case A: Unpaid order cannot be refunded
          await expect(
            processOrderRefund({
              orderNumber: order.orderNumber,
              amountPaise: 10000,
              reason: "Customer cancelled",
              idempotencyKey: `ref_test_unpaid_${order.orderNumber}`,
              actor: "admin@purplefriday.in",
              actorRole: "SUPER_ADMIN",
            })
          ).rejects.toThrow();

            // Mark order as paid
            await markOrderPaidManually({
              orderNumber: order.orderNumber,
              actor: "admin@purplefriday.in",
              actorRole: "SUPER_ADMIN",
              method: "COD",
            });

        const stateOrder = ORDER_STORE.get(order.orderNumber)!;
        expect(stateOrder.paymentStatus).toBe("PAID");

          // Case B: Refund exceeding total paid amount must be rejected
          const excessivePaise = stateOrder.total + 50000;
          await expect(
            processOrderRefund({
              orderNumber: order.orderNumber,
              amountPaise: excessivePaise,
              reason: "Customer cancelled order",
              idempotencyKey: `ref_test_excessive_${order.orderNumber}`,
              actor: "admin@purplefriday.in",
              actorRole: "SUPER_ADMIN",
            })
          ).rejects.toThrow(/exceeds maximum refundable balance/);

            // Case C: Valid refund within paid amount succeeds
            const validRefundPaise = Math.round(stateOrder.total / 2);
            const refund = await processOrderRefund({
              orderNumber: order.orderNumber,
              amountPaise: validRefundPaise,
              reason: "Partial cancellation requested",
              idempotencyKey: `ref_test_valid_${order.orderNumber}`,
              actor: "admin@purplefriday.in",
              actorRole: "SUPER_ADMIN",
            });

        expect(refund.status).toBe("PROCESSED");
        expect(refund.amountPaise).toBe(validRefundPaise);

          // Case D: Second refund exceeding remaining balance must be rejected
          await expect(
            processOrderRefund({
              orderNumber: order.orderNumber,
              amountPaise: stateOrder.total, // exceeds remaining half
              reason: "Second refund attempt",
              idempotencyKey: `ref_test_second_${order.orderNumber}`,
              actor: "admin@purplefriday.in",
              actorRole: "SUPER_ADMIN",
            })
          ).rejects.toThrow(/exceeds maximum refundable balance/);
        });
      });
