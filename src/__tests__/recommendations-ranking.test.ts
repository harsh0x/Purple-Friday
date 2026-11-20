import { describe, it, expect } from "vitest";
import {
  computeFrequentlyBoughtTogether,
} from "@/server/recommendations/fbt";
import {
  computeSmartRankingScores,
  rankCollectionProducts,
  ProductCatalogStats,
} from "@/server/recommendations/smart-ranking";
import { StoredOrderRecord } from "@/server/orders/state-machine";

describe("Part 5: Merchandising Intelligence (FBT & Smart Ranking)", () => {
  const dummyBaseOrder: StoredOrderRecord = {
    id: "ord_fbt_1",
    orderNumber: "PF-FBT-1",
    version: 1,
    status: "DELIVERED",
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    subtotal: 1000,
    discount: 0,
    shipping: 0,
    gst: 0,
    totalPausedDurationMs: 0,
    total: 1000,
    address: { customerName: "Test", email: "test@corp.com" },
    items: [],
    nudgeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    events: [],
  };

  it("safeguards against thin data by returning empty array rather than random items", () => {
    // Only 2 orders - thin catalog threshold is < 3 orders
    const orders: StoredOrderRecord[] = [
      {
        ...dummyBaseOrder,
        id: "o1",
        items: [{ id: "i1", productId: "pA", options: {}, qty: 10, unitPrice: 500 }],
      },
      {
        ...dummyBaseOrder,
        id: "o2",
        items: [{ id: "i2", productId: "pB", options: {}, qty: 10, unitPrice: 500 }],
      },
    ];

    const result = computeFrequentlyBoughtTogether(orders);
    expect(result.size).toBe(0);
  });

  it("calculates support, confidence, and lift for strong co-occurring pairs", () => {
    // 5 orders with products A and B co-occurring in 3 orders
    const orders: StoredOrderRecord[] = [
      {
        ...dummyBaseOrder,
        id: "o1",
        items: [
          { id: "i1", productId: "hoodie", options: {}, qty: 10, unitPrice: 500 },
          { id: "i2", productId: "tote", options: {}, qty: 10, unitPrice: 200 },
        ],
      },
      {
        ...dummyBaseOrder,
        id: "o2",
        items: [
          { id: "i3", productId: "hoodie", options: {}, qty: 10, unitPrice: 500 },
          { id: "i4", productId: "tote", options: {}, qty: 10, unitPrice: 200 },
        ],
      },
      {
        ...dummyBaseOrder,
        id: "o3",
        items: [
          { id: "i5", productId: "hoodie", options: {}, qty: 10, unitPrice: 500 },
          { id: "i6", productId: "tote", options: {}, qty: 10, unitPrice: 200 },
        ],
      },
      {
        ...dummyBaseOrder,
        id: "o4",
        items: [{ id: "i7", productId: "hoodie", options: {}, qty: 10, unitPrice: 500 }],
      },
      {
        ...dummyBaseOrder,
        id: "o5",
        items: [{ id: "i8", productId: "mug", options: {}, qty: 5, unitPrice: 150 }],
      },
    ];

    const result = computeFrequentlyBoughtTogether(orders, {
      minPairSupportCount: 2,
      minConfidence: 0.1,
      maxRecommendationsPerProduct: 4,
    });

    expect(result.has("hoodie")).toBe(true);
    const hoodieRecs = result.get("hoodie")!;
    expect(hoodieRecs.length).toBeGreaterThan(0);
    expect(hoodieRecs[0].recommendedProductId).toBe("tote");
    expect(hoodieRecs[0].pairCount).toBe(3);
    expect(hoodieRecs[0].support).toBeGreaterThan(0.4);
    expect(hoodieRecs[0].confidence).toBe(0.75);
  });

  it("never boosts out-of-stock or negative-margin products in Smart Ranking", () => {
    const products: ProductCatalogStats[] = [
      {
        id: "p_stockout",
        title: "High Demand But Zero Stock",
        slug: "zero-stock",
        category: "Apparel",
        unitPricePaise: 80000,
        costPricePaise: 30000,
        stockOnHand: 0, // OUT OF STOCK
        reorderLevel: 20,
        totalViews: 5000,
        totalOrders: 500,
        averageRating: 5.0,
      },
      {
        id: "p_negative_margin",
        title: "Negative Margin Item",
        slug: "negative-margin",
        category: "Apparel",
        unitPricePaise: 20000,
        costPricePaise: 35000, // COGS > Price
        stockOnHand: 200,
        reorderLevel: 20,
        totalViews: 5000,
        totalOrders: 400,
        averageRating: 4.8,
      },
      {
        id: "p_healthy",
        title: "Healthy In-Stock Item",
        slug: "healthy-item",
        category: "Apparel",
        unitPricePaise: 60000,
        costPricePaise: 25000,
        stockOnHand: 250,
        reorderLevel: 50,
        totalViews: 3000,
        totalOrders: 150,
        averageRating: 4.7,
      },
    ];

    const scores = computeSmartRankingScores(products);
    const stockoutScore = scores.find((s) => s.productId === "p_stockout")!;
    const negMarginScore = scores.find((s) => s.productId === "p_negative_margin")!;
    const healthyScore = scores.find((s) => s.productId === "p_healthy")!;

    expect(stockoutScore.isBoosted).toBe(false);
    expect(negMarginScore.isBoosted).toBe(false);
    expect(healthyScore.isBoosted).toBe(true);

    const ranked = rankCollectionProducts(products, scores, "SMART");
    // Healthy item must be ranked higher than the unboosted out-of-stock item
    expect(ranked[0].id).toBe("p_healthy");
  });
});