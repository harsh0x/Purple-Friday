import React, { Suspense } from "react";
import { Metadata } from "next";
import { CollectionPageView } from "@/components/collection/CollectionPageView";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { getCachedProducts } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: "Best Selling Merchandise | Purple Friday",
  description: "Explore our most sought-after custom merchandise: magnetic badges, bio-washed cotton tees, and luxury drinkware.",
};

export default async function BestSellersCollectionPage() {
  const rawProducts = await getCachedProducts("best-sellers");

  const initialProducts: ProductCardData[] = rawProducts.slice(0, 12).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortName: p.shortName,
    description: p.description,
    basePrice: p.basePrice,
    mrp: p.mrp,
    minQty: p.minQty,
    qtyStep: p.qtyStep,
    rating: p.rating || 4.9,
    reviewCount: p.reviewCount || 42,
    badges: p.badges,
    template: p.slug,
    color: p.colors?.[0]?.hex || "#FFFFFF",
    colors: p.colors,
  }));

  const initialCursor = rawProducts.length > 12 ? rawProducts[11].slug : null;

  const counts = {
    all: rawProducts.length,
    team: rawProducts.filter((p) => p.audience === "TEAM" || p.audience === "BOTH").length,
    gifting: rawProducts.filter((p) => p.audience === "GIFTING" || p.audience === "BOTH").length,
  };

  return (
    <Suspense fallback={<SectionSkeleton height="h-[600px]" title="Loading Best Sellers..." />}>
      <CollectionPageView
        title="Best Selling Merchandise"
        description="Client-tested and production-proven merchandise chosen by over 1,200 Indian companies and organizations."
        categorySlug="best-sellers"
        initialProducts={initialProducts}
        initialCursor={initialCursor}
        initialCounts={counts}
      />
    </Suspense>
  );
}
