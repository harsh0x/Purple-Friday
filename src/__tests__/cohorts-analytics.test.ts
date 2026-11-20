import { describe, it, expect } from "vitest";
import {
  computeSampleToBulkConversion,
  computeRetentionCohorts,
  computeAnalyticsMetrics,
} from "@/server/analytics/cohorts";
import { StoredOrderRecord } from "@/server/orders/state-machine";

describe("Part 5: Cohort Retention & Corporate Analytics", () => {
  const baseOrder: StoredOrderRecord = {
    id: "ord_1",
    orderNumber: "PF-2026-101",
    version: 1,
    status: "DELIVERED",
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    subtotal: 1500,
    discount: 0,
    shipping: 0,
    gst: 0,
    totalPausedDurationMs: 0,
    total: 1500,
    address: {
      customerName: "Acme Corp",
      email: "acme@example.com",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560001",
    },
    items: [
      {
        id: "item_1",
        productId: "prod_hoodie",
        options: {},
        qty: 2,
        unitPrice: 750,
      },
    ],
    nudgeCount: 0,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
    events: [],
  };

  it("identifies sample-to-bulk conversion within 60 days", () => {
    const sampleOrder: StoredOrderRecord = {
      ...baseOrder,
      id: "ord_sample",
      orderNumber: "PF-2026-SAMPLE",
      createdAt: "2026-01-10T10:00:00Z",
      items: [{ id: "i1", productId: "p1", options: {}, qty: 2, unitPrice: 700 }],
    };

    const bulkOrder: StoredOrderRecord = {
      ...baseOrder,
      id: "ord_bulk",
      orderNumber: "PF-2026-BULK",
      createdAt: "2026-01-25T10:00:00Z", // 15 days later (within 60 days)
      subtotal: 27500,
      total: 27500,
      items: [{ id: "i2", productId: "p1", options: {}, qty: 50, unitPrice: 550 }],
    };

    const orders = [sampleOrder, bulkOrder];
    const result = computeSampleToBulkConversion(orders, {
      sampleMaxQty: 2,
      bulkMinQty: 20,
      conversionWindowDays: 60,
    });

    expect(result.totalSampleOrders).toBe(1);
    expect(result.convertedToBulkCount).toBe(1);
    expect(result.conversionRatePercent).toBe(100);
    expect(result.avgDaysToConvert).toBe(15);
    expect(result.totalConvertedRevenuePaise).toBe(2750000);
  });

  it("ignores follow-on orders that fall outside the conversion window", () => {
    const sampleOrder: StoredOrderRecord = {
      ...baseOrder,
      id: "ord_sample_2",
      orderNumber: "PF-2026-SAMPLE2",
      createdAt: "2026-01-01T10:00:00Z",
      items: [{ id: "i1", productId: "p1", options: {}, qty: 2, unitPrice: 700 }],
    };

    const lateBulkOrder: StoredOrderRecord = {
      ...baseOrder,
      id: "ord_late_bulk",
      orderNumber: "PF-2026-LATE",
      createdAt: "2026-04-10T10:00:00Z", // 100 days later (> 60 days)
      subtotal: 50000,
      total: 50000,
      items: [{ id: "i2", productId: "p1", options: {}, qty: 100, unitPrice: 500 }],
    };

    const result = computeSampleToBulkConversion([sampleOrder, lateBulkOrder], {
      sampleMaxQty: 2,
      bulkMinQty: 20,
      conversionWindowDays: 60,
    });

    expect(result.totalSampleOrders).toBe(1);
    expect(result.convertedToBulkCount).toBe(0);
    expect(result.conversionRatePercent).toBe(0);
  });

  it("computes monthly cohort retention matrix", () => {
    const orders: StoredOrderRecord[] = [
      {
        ...baseOrder,
        id: "c_1",
        createdAt: "2026-01-05T10:00:00Z",
      },
      {
        ...baseOrder,
        id: "c_2",
        createdAt: "2026-02-12T10:00:00Z", // repeat in month 1
      },
    ];

    const cohorts = computeRetentionCohorts(orders, 12);
    expect(cohorts.length).toBe(12);
    const janCohort = cohorts.find((c) => c.cohortMonth === "2026-01");
    expect(janCohort).toBeDefined();
    expect(janCohort?.initialCustomers).toBe(1);
    // M0 retention should be 100%
    expect(janCohort?.months[0].retentionPct).toBe(100);
  });

  it("breaks down sales by city tiers and top pin codes", () => {
    const orders: StoredOrderRecord[] = [
      {
        ...baseOrder,
        id: "t1_order",
        address: { city: "Mumbai", state: "Maharashtra", pinCode: "400001" },
        subtotal: 10000,
        total: 10000,
      },
      {
        ...baseOrder,
        id: "t2_order",
        address: { city: "Jaipur", state: "Rajasthan", pinCode: "302001" },
        subtotal: 5000,
        total: 5000,
      },
    ];

    const metrics = computeAnalyticsMetrics(orders);
    expect(metrics.cityTiers.tier1RevenuePaise).toBe(1000000);
    expect(metrics.cityTiers.tier23RevenuePaise).toBe(500000);
    expect(metrics.cityTiers.tier1Percentage).toBe(67);
    expect(metrics.topPinCodes.length).toBe(5);
  });
});