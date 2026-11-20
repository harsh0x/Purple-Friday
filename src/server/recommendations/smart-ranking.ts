import { SmartRankingSettings, DEFAULT_SMART_RANKING_SETTINGS } from "@/lib/admin/app-settings";

export interface ProductCatalogStats {
  id: string;
  title: string;
  slug: string;
  category: string;
  unitPricePaise: number;
  costPricePaise: number;
  stockOnHand: number;
  reorderLevel: number;
  totalViews: number;
  totalOrders: number;
  averageRating: number; // 0 to 5
  manualSortOrder?: number;
}

export interface ProductSmartRankingScore {
  productId: string;
  title: string;
  slug: string;
  category: string;
  rawConversionRate: number;
  rawProfitMargin: number;
  rawStockHealth: number;
  rawReviewRating: number;
  normalizedConversionRate: number; // 0 to 1
  normalizedProfitMargin: number; // 0 to 1
  normalizedStockHealth: number; // 0 to 1
  normalizedReviewRating: number; // 0 to 1
  compositeScore: number; // 0 to 1
  isOutOfStock: boolean;
  isNegativeMargin: boolean;
  isBoosted: boolean;
}

/**
 * Min-Max normalization helper.
 */
function minMaxNormalize(val: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  const norm = (val - min) / (max - min);
  return Math.max(0, Math.min(1, Math.round(norm * 1000) / 1000));
}

/**
 * Pure function: Computes Smart Ranking scores across products in a catalog or collection.
 * Formula:
 * Score = 0.4 * norm(conversionRate) + 0.3 * norm(profitMargin) + 0.2 * norm(stockHealth) + 0.1 * norm(reviewRating)
 * Out-of-stock and negative-margin products are NEVER boosted.
 */
export function computeSmartRankingScores(
  products: ProductCatalogStats[],
  settings: SmartRankingSettings = DEFAULT_SMART_RANKING_SETTINGS
): ProductSmartRankingScore[] {
  if (products.length === 0) return [];

  // 1. Calculate raw values per product
  const rawList = products.map((p) => {
    // Conversion rate: orders / views (fallback to orders / 100 if views 0)
    const convRate = p.totalViews > 0 ? p.totalOrders / p.totalViews : p.totalOrders > 0 ? 0.05 : 0;
    // Profit margin: (unitPrice - costPrice) / unitPrice
    const margin = p.unitPricePaise > 0 ? (p.unitPricePaise - p.costPricePaise) / p.unitPricePaise : 0;
    // Stock health: ratio of stock on hand to reorder level (clamped to 3.0)
    const stockRatio = p.reorderLevel > 0 ? p.stockOnHand / p.reorderLevel : p.stockOnHand > 0 ? 1 : 0;
    const stockHealth = Math.min(3.0, Math.max(0, stockRatio));
    // Review rating: 0 to 5
    const rating = Math.max(0, Math.min(5, p.averageRating));

    return {
      p,
      convRate,
      margin,
      stockHealth,
      rating,
      isOutOfStock: p.stockOnHand <= 0,
      isNegativeMargin: margin <= 0,
    };
  });

  // 2. Compute min and max across the collection for normalization
  const minConv = Math.min(...rawList.map((r) => r.convRate));
  const maxConv = Math.max(...rawList.map((r) => r.convRate));

  const minMargin = Math.min(...rawList.map((r) => r.margin));
  const maxMargin = Math.max(...rawList.map((r) => r.margin));

  const minStock = Math.min(...rawList.map((r) => r.stockHealth));
  const maxStock = Math.max(...rawList.map((r) => r.stockHealth));

  const minRating = Math.min(...rawList.map((r) => r.rating));
  const maxRating = Math.max(...rawList.map((r) => r.rating));

  // 3. Compute weighted composite score
  const scoredProducts: ProductSmartRankingScore[] = rawList.map((r) => {
    const normConv = minMaxNormalize(r.convRate, minConv, maxConv);
    const normMargin = minMaxNormalize(r.margin, minMargin, maxMargin);
    const normStock = minMaxNormalize(r.stockHealth, minStock, maxStock);
    const normRating = minMaxNormalize(r.rating, minRating, maxRating);

    // Rule: Out-of-stock and negative-margin products are NEVER boosted
    const canBoost = !r.isOutOfStock && !r.isNegativeMargin;

    let compositeScore = 0;
    if (canBoost) {
      compositeScore =
        settings.conversionWeight * normConv +
        settings.marginWeight * normMargin +
        settings.stockWeight * normStock +
        settings.reviewWeight * normRating;
      compositeScore = Math.round(compositeScore * 1000) / 1000;
    } else {
      // Penalized to bottom
      compositeScore = r.isOutOfStock ? 0.001 : 0.005;
    }

    return {
      productId: r.p.id,
      title: r.p.title,
      slug: r.p.slug,
      category: r.p.category,
      rawConversionRate: Math.round(r.convRate * 1000) / 1000,
      rawProfitMargin: Math.round(r.margin * 1000) / 1000,
      rawStockHealth: Math.round(r.stockHealth * 100) / 100,
      rawReviewRating: Math.round(r.rating * 10) / 10,
      normalizedConversionRate: normConv,
      normalizedProfitMargin: normMargin,
      normalizedStockHealth: normStock,
      normalizedReviewRating: normRating,
      compositeScore,
      isOutOfStock: r.isOutOfStock,
      isNegativeMargin: r.isNegativeMargin,
      isBoosted: canBoost,
    };
  });

  // Sort descending by compositeScore
  return scoredProducts.sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Sorts products based on collection sort mode ("SMART" vs "MANUAL").
 */
export function rankCollectionProducts<T extends { id: string; sortOrder?: number }>(
  items: T[],
  smartScores: ProductSmartRankingScore[],
  mode: "SMART" | "MANUAL" = "SMART"
): T[] {
  if (mode === "MANUAL") {
    return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const scoreMap = new Map<string, number>();
  for (const s of smartScores) {
    scoreMap.set(s.productId, s.compositeScore);
  }

  return [...items].sort((a, b) => {
    const scoreA = scoreMap.get(a.id) ?? 0;
    const scoreB = scoreMap.get(b.id) ?? 0;
    return scoreB - scoreA;
  });
}
