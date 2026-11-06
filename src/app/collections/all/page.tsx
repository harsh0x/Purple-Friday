import React, { Suspense } from "react";
import { Metadata } from "next";
import { CollectionPageView } from "@/components/collection/CollectionPageView";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { getCachedProducts } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: "All Custom Merchandise | Purple Friday",
  description: "Browse the complete collection of custom-printed magnetic badges, t-shirts, hoodies, caps, and executive gifts.",
};

export default async function AllCollectionsPage() {
  const rawProducts = await getCachedProducts("all");

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
    <Suspense fallback={<SectionSkeleton height="h-[600px]" title="Loading All Products..." />}>
      <CollectionPageView
        title="All Print Merchandise"
        description="The complete atelier catalogue of proof-ready custom merchandise with bulk quantity pricing for Indian businesses."
        categorySlug="all"
        initialProducts={initialProducts}
        initialCursor={initialCursor}
        initialCounts={counts}
      />
    </Suspense>
  );
}
