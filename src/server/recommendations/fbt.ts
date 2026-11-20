import { StoredOrderRecord } from "@/server/orders/state-machine";

export interface FbtRecommendation {
  productId: string;
  recommendedProductId: string;
  recommendedProductTitle: string;
  pairCount: number;
  support: number; // P(A and B)
  confidence: number; // P(B | A)
  lift: number; // Lift > 1 indicates strong positive association
}

export interface FbtSettings {
  minPairSupportCount: number; // default at least 2 shared orders
  minConfidence: number; // default at least 0.10 (10%)
  maxRecommendationsPerProduct: number; // default 4
}

export const DEFAULT_FBT_SETTINGS: FbtSettings = {
  minPairSupportCount: 2,
  minConfidence: 0.05,
  maxRecommendationsPerProduct: 4,
};

// In-memory registry for computed recommendations
export const FBT_RECOMMENDATIONS_STORE = new Map<string, FbtRecommendation[]>();

/**
 * Pure function: Computes Frequently Bought Together pair statistics from orders.
 * Follows strict rule: if data is thin, returns an empty array rather than random items.
 */
export function computeFrequentlyBoughtTogether(
  orders: StoredOrderRecord[],
  settings: FbtSettings = DEFAULT_FBT_SETTINGS
): Map<string, FbtRecommendation[]> {
  const totalOrders = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RTO").length;
  const result = new Map<string, FbtRecommendation[]>();

  if (totalOrders < 3) {
    // Data too thin across the catalog
    return result;
  }

  // 1. Count individual product occurrences
  const productOrderCount = new Map<string, number>();
  const productTitleMap = new Map<string, string>();

  // 2. Count pair co-occurrences
  const pairCountMap = new Map<string, number>(); // "prodA:::prodB" -> count

  for (const o of orders) {
    if (o.status === "CANCELLED" || o.status === "RTO") continue;

    // Distinct products in this order
    const distinctProducts = new Map<string, string>();
    for (const item of o.items || []) {
      const itemRec = item as Record<string, unknown>;
      distinctProducts.set(
        item.productId,
        ((itemRec.title || itemRec.name || item.productId) as string)
      );
    }

    const prodIds = Array.from(distinctProducts.keys());

    // Update single counts
    for (const id of prodIds) {
      productOrderCount.set(id, (productOrderCount.get(id) || 0) + 1);
      productTitleMap.set(id, distinctProducts.get(id)!);
    }

    // Update pair counts
    for (let i = 0; i < prodIds.length; i++) {
      for (let j = 0; j < prodIds.length; j++) {
        if (i === j) continue;
        const key = `${prodIds[i]}:::${prodIds[j]}`;
        pairCountMap.set(key, (pairCountMap.get(key) || 0) + 1);
      }
    }
  }

  // 3. Compute Support, Confidence, Lift per (A, B) pair
  const candidateRecsByProduct = new Map<string, FbtRecommendation[]>();

  for (const [pairKey, pairCount] of pairCountMap.entries()) {
    if (pairCount < settings.minPairSupportCount) {
      // Discard thin pairs
      continue;
    }

    const [prodA, prodB] = pairKey.split(":::");
    const countA = productOrderCount.get(prodA) || 1;
    const countB = productOrderCount.get(prodB) || 1;

    const support = pairCount / totalOrders;
    const confidence = pairCount / countA;
    const probB = countB / totalOrders;
    const lift = probB > 0 ? confidence / probB : 1;

    // Minimum confidence gate
    if (confidence < settings.minConfidence) {
      continue;
    }

    const rec: FbtRecommendation = {
      productId: prodA,
      recommendedProductId: prodB,
      recommendedProductTitle: productTitleMap.get(prodB) || prodB,
      pairCount,
      support: Math.round(support * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000,
      lift: Math.round(lift * 100) / 100,
    };

    const list = candidateRecsByProduct.get(prodA) || [];
    list.push(rec);
    candidateRecsByProduct.set(prodA, list);
  }

  // 4. Rank by lift then confidence and take top N (default 4)
  for (const [prodId, recs] of candidateRecsByProduct.entries()) {
    recs.sort((a, b) => {
      if (b.lift !== a.lift) return b.lift - a.lift;
      return b.confidence - a.confidence;
    });
    result.set(prodId, recs.slice(0, settings.maxRecommendationsPerProduct));
  }

  return result;
}

/**
 * Fast lookup for product page or cart drawer.
 * Returns top recommendations or empty list if no strong affinity.
 */
export function getProductRecommendations(productId: string): FbtRecommendation[] {
  return FBT_RECOMMENDATIONS_STORE.get(productId) || [];
}
