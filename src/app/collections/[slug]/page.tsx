import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CollectionPageView } from "@/components/collection/CollectionPageView";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { getCachedProducts, getCachedCategories } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";

interface CollectionMeta {
  title: string;
  description: string;
}

const META_MAP: Record<string, CollectionMeta> = {
  all: {
    title: "All Print Merchandise",
    description: "The complete atelier catalogue of proof-ready custom merchandise with bulk tier pricing for Indian teams.",
  },
  "best-sellers": {
    title: "Best Selling Merchandise",
    description: "Our top-rated products chosen by over 1,200 Indian tech companies, college festivals, and design teams.",
  },
  "magnetic-badges": {
    title: "Magnetic Lapel Badges",
    description: "Dual N42 neodymium magnetic fasteners with offset CMYK printing. Zero pinholes, zero blazer fabric tear.",
  },
  "t-shirts": {
    title: "Custom Printed T-Shirts",
    description: "100% combed bio-washed cotton tees (180–240 GSM) with direct-to-garment and spot screen printing.",
  },
  "polo-shirts": {
    title: "Corporate Polo Shirts",
    description: "230 GSM piqué knit corporate polos with precision Japanese Tajima embroidery and reinforced collars.",
  },
  hoodies: {
    title: "Hoodies & Sweatshirts",
    description: "320 GSM brushed heavy fleece winterwear with double-lined hoods and durable ribbed cuffs.",
  },
  caps: {
    title: "Caps & Headwear",
    description: "Structured 6-panel cotton twill caps and breathable mesh trucker hats with 3D raised puff embroidery.",
  },
  "corporate-gifts": {
    title: "Corporate Gifts & Kits",
    description: "Laser-engraved metal pens, debossed linen journals, vacuum flasks, and luxury employee onboarding sets.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = META_MAP[slug] || {
    title: `${slug.replace(/-/g, " ").toUpperCase()} Collection`,
    description: "Custom printed merchandise by Purple Friday India.",
  };

  return {
    title: `${meta.title} | Purple Friday`,
    description: meta.description,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const categories = await getCachedCategories();
  const validSlugs = ["all", "best-sellers", ...categories.map((c) => c.slug)];

  if (!validSlugs.includes(slug)) {
    notFound();
  }

  const meta = META_MAP[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "Precision-printed bulk custom merchandise for modern Indian brands.",
  };

  // Fetch initial products
  const rawProducts = await getCachedProducts(slug);

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
    <Suspense fallback={<SectionSkeleton height="h-[600px]" title="Loading Collection Atelier..." />}>
      <CollectionPageView
        title={meta.title}
        description={meta.description}
        categorySlug={slug}
        initialProducts={initialProducts}
        initialCursor={initialCursor}
        initialCounts={counts}
      />
    </Suspense>
  );
}
