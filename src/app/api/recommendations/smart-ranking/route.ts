import { NextRequest, NextResponse } from "next/server";
import { computeSmartRankingScores, rankCollectionProducts, ProductCatalogStats } from "@/server/recommendations/smart-ranking";
import { getSmartRankingSettings } from "@/lib/admin/app-settings";

// Sample catalogue stats for smart ranking demonstration
const SAMPLE_CATALOG_STATS: ProductCatalogStats[] = [
  {
    id: "prod_hoodie_01",
    title: "Premium Heavyweight Oversized Hoodie (380 GSM)",
    slug: "premium-heavyweight-oversized-hoodie",
    category: "Custom Apparel",
    unitPricePaise: 85000,
    costPricePaise: 42000,
    stockOnHand: 450,
    reorderLevel: 100,
    totalViews: 3200,
    totalOrders: 180,
    averageRating: 4.9,
    manualSortOrder: 1,
  },
  {
    id: "prod_tee_01",
    title: "240 GSM French Terry Custom Graphic Tee",
    slug: "french-terry-custom-graphic-tee",
    category: "Custom Apparel",
    unitPricePaise: 55000,
    costPricePaise: 24000,
    stockOnHand: 680,
    reorderLevel: 150,
    totalViews: 4100,
    totalOrders: 230,
    averageRating: 4.8,
    manualSortOrder: 2,
  },
  {
    id: "prod_mug_01",
    title: "Ceramic Matte Corporate Branding Coffee Mug",
    slug: "ceramic-matte-branding-coffee-mug",
    category: "Drinkware",
    unitPricePaise: 22000,
    costPricePaise: 9500,
    stockOnHand: 320,
    reorderLevel: 80,
    totalViews: 1800,
    totalOrders: 95,
    averageRating: 4.7,
    manualSortOrder: 3,
  },
  {
    id: "prod_tote_01",
    title: "Organic Cotton Canvas Corporate Tote Bag",
    slug: "organic-cotton-canvas-tote-bag",
    category: "Corporate Accessories",
    unitPricePaise: 28000,
    costPricePaise: 11000,
    stockOnHand: 50,
    reorderLevel: 100,
    totalViews: 1200,
    totalOrders: 40,
    averageRating: 4.6,
    manualSortOrder: 4,
  },
  {
    id: "prod_notebook_01",
    title: "Hardbound Debossed Executive Journal",
    slug: "hardbound-debossed-executive-journal",
    category: "Corporate Accessories",
    unitPricePaise: 35000,
    costPricePaise: 16000,
    stockOnHand: 0, // Out of stock - should never be boosted
    reorderLevel: 50,
    totalViews: 900,
    totalOrders: 20,
    averageRating: 4.4,
    manualSortOrder: 5,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "SMART") as "SMART" | "MANUAL";

  const settings = await getSmartRankingSettings();
  const smartScores = computeSmartRankingScores(SAMPLE_CATALOG_STATS, settings);
  const rankedItems = rankCollectionProducts(SAMPLE_CATALOG_STATS, smartScores, mode);

  return NextResponse.json({
    mode,
    smartScores,
    rankedItems,
  });
}