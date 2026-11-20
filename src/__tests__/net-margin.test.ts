import { describe, it, expect } from "vitest";
import {
  calculateOrderMargin,
  calculateWaterfallBreakdown,
  aggregateMonthlyMargins,
  OrderMarginInput,
} from "@/server/analytics/margin-engine";

describe("True Net Margin Calculation Engine (Pure Tested Module)", () => {
  describe("Single Order Margin Computation", () => {
    it("computes net margin accurately for a standard bulk order with hand-verified math", () => {
      // 50 Hoodies at Rs 1,200 (120,000 paise) = Rs 60,000 (6,000,000 paise)
      // Blank cost: Rs 550 (55,000 paise), Print cost: Rs 150 (15,000 paise)
      // COGS per unit: Rs 700 (70,000 paise) -> Total COGS: Rs 35,000 (3,500,000 paise)
      // Gateway fee: 2% of Rs 60,000 = Rs 1,200 (120,000 paise)
      // Shipping cost: Rs 60 (6,000 paise)
      // Net Margin: 6,000,000 - 3,500,000 - 120,000 - 6,000 = 2,374,000 paise (Rs 23,740)
      // Margin %: 23,740 / 60,000 = 39.56% -> rounds to 39.6%
      const order: OrderMarginInput = {
        orderNumber: "PF-TEST-001",
        createdAt: "2026-10-15T10:00:00.000Z",
        status: "DELIVERED",
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        totalCollectedPaise: 6000000,
        revenueExclGstPaise: 6000000,
        shippingCostPaise: 6000,
        items: [
          {
            name: "Apex Pullover Hoodie",
            qty: 50,
            unitPriceExclGstPaise: 120000,
            blankCostPaise: 55000,
            printCostPaise: 15000,
          },
        ],
      };

      const result = calculateOrderMargin(order, {
        paymentGatewayFeePercent: 2.0,
        paymentGatewayFixedFeePaise: 0,
      });

      expect(result.revenueExclGstPaise).toBe(6000000);
      expect(result.cogsPaise).toBe(3500000);
      expect(result.gatewayFeePaise).toBe(120000);
      expect(result.shippingCostPaise).toBe(6000);
      expect(result.rtoLossPaise).toBe(0);
      expect(result.netMarginPaise).toBe(2374000);
      expect(result.marginPercent).toBe(39.6);
    });

    it("evaluates custom merchandise RTO loss including unsellable manufactured goods and return freight", () => {
      // 10 Polos: Blank Rs 260 (26,000 paise) + Print Rs 80 (8,000 paise) = Rs 340 (34,000 paise) per unit
      // Total COGS: 10 * 34,000 = 340,000 paise (Rs 3,400)
      // Outbound shipping: Rs 80 (8,000 paise)
      // Return shipping: Rs 70 (7,000 paise)
      // RTO Total Loss = 340,000 + 8,000 + 7,000 = 355,000 paise (Rs 3,550 loss)
      // Effective revenue = 0
      // Net Margin = -355,000 paise
      const rtoOrder: OrderMarginInput = {
        orderNumber: "PF-RTO-001",
        createdAt: "2026-10-20T10:00:00.000Z",
        status: "RTO",
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        totalCollectedPaise: 0,
        revenueExclGstPaise: 500000,
        shippingCostPaise: 8000,
        returnShippingCostPaise: 7000,
        items: [
          {
            name: "Classic Pique Polo",
            qty: 10,
            unitPriceExclGstPaise: 50000,
            blankCostPaise: 26000,
            printCostPaise: 8000,
          },
        ],
      };

      const result = calculateOrderMargin(rtoOrder);

      expect(result.revenueExclGstPaise).toBe(0); // No realized revenue
      expect(result.rtoLossPaise).toBe(355000);
      expect(result.netMarginPaise).toBe(-355000);
      expect(result.marginPercent).toBe(-100);
    });
  });

  describe("Waterfall Cohort Breakdown", () => {
    it("generates cumulative waterfall steps including allocated ad spend", () => {
      const order1: OrderMarginInput = {
        orderNumber: "ORD-1",
        createdAt: "2026-11-01T00:00:00Z",
        status: "DELIVERED",
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        totalCollectedPaise: 1000000, // Rs 10,000
        revenueExclGstPaise: 1000000,
        shippingCostPaise: 10000, // Rs 100
        items: [
          {
            name: "Polo",
            qty: 20,
            unitPriceExclGstPaise: 50000,
            blankCostPaise: 20000,
            printCostPaise: 5000, // COGS = 20 * 25,000 = 500,000 paise (Rs 5,000)
          },
        ],
      };

      const order2: OrderMarginInput = {
        orderNumber: "ORD-2",
        createdAt: "2026-11-02T00:00:00Z",
        status: "RTO",
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        totalCollectedPaise: 0,
        revenueExclGstPaise: 200000,
        shippingCostPaise: 8000,
        returnShippingCostPaise: 8000,
        items: [
          {
            name: "Hoodie",
            qty: 2,
            unitPriceExclGstPaise: 100000,
            blankCostPaise: 40000,
            printCostPaise: 10000, // COGS = 2 * 50,000 = 100,000 paise (Rs 1,000)
          },
        ],
      };

      const b1 = calculateOrderMargin(order1);
      const b2 = calculateOrderMargin(order2);

      // Ad spend: Rs 1,500 (150,000 paise)
      const waterfall = calculateWaterfallBreakdown({
        orders: [b1, b2],
        adSpendPaise: 150000,
      });

      expect(waterfall.grossRevenueExclGstPaise).toBe(1000000); // Only order 1 realized
      expect(waterfall.cogsPaise).toBe(500000);
      expect(waterfall.gatewayFeesPaise).toBe(20000); // 2% of 10,000
      expect(waterfall.shippingCostPaise).toBe(10000);
      expect(waterfall.rtoLossesPaise).toBe(116000); // 100,000 cogs + 8,000 out + 8,000 ret
      expect(waterfall.adSpendPaise).toBe(150000);

      // Net margin = 1,000,000 - 500,000 - 20,000 - 10,000 - 116,000 - 150,000 = 204,000 paise (Rs 2,040)
      expect(waterfall.netMarginPaise).toBe(204000);
      expect(waterfall.netMarginPercent).toBe(20.4);

      expect(waterfall.steps).toHaveLength(7);
      expect(waterfall.steps[0].name).toBe("Gross Revenue (Ex-GST)");
      expect(waterfall.steps[6].name).toBe("True Net Margin");
      expect(waterfall.steps[6].cumulativePaise).toBe(204000);
    });
  });

  describe("Monthly Margin Aggregation", () => {
    it("groups orders by month and applies monthly ad spend", () => {
      const orders = [
        calculateOrderMargin({
          orderNumber: "ORD-OCT-1",
          createdAt: "2026-10-05T00:00:00Z",
          status: "DELIVERED",
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          totalCollectedPaise: 500000,
          revenueExclGstPaise: 500000,
          items: [{ name: "Tee", qty: 10, unitPriceExclGstPaise: 50000, blankCostPaise: 20000, printCostPaise: 5000 }],
        }),
        calculateOrderMargin({
          orderNumber: "ORD-NOV-1",
          createdAt: "2026-11-05T00:00:00Z",
          status: "DELIVERED",
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          totalCollectedPaise: 800000,
          revenueExclGstPaise: 800000,
          items: [{ name: "Polo", qty: 10, unitPriceExclGstPaise: 80000, blankCostPaise: 30000, printCostPaise: 10000 }],
        }),
      ];

      const monthly = aggregateMonthlyMargins(orders, {
        "2026-10": 50000, // Rs 500 ad spend in Oct
        "2026-11": 80000, // Rs 800 ad spend in Nov
      });

      expect(monthly).toHaveLength(2);
      expect(monthly[0].month).toBe("2026-10");
      expect(monthly[0].adSpendPaise).toBe(50000);
      expect(monthly[1].month).toBe("2026-11");
      expect(monthly[1].adSpendPaise).toBe(80000);
    });
  });
});
