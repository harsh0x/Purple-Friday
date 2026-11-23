import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CollectionPageView } from "@/components/collection/CollectionPageView";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { getCachedProducts, getCategoryBySlug } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";
import { categoryHref } from "@/lib/urls";

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
    title: "Custom Printed T-Shirts & Polos",
    description: "100% combed bio-washed cotton tees (180–240 GSM) and corporate polos with direct-to-garment and Tajima embroidery.",
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
  const resolved = await params;
  const slug = resolved?.slug;
  if (!slug) {
    return { title: "Category | Purple Friday" };
  }
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Purple Friday",
      description: "The requested merchandise category does not exist.",
    };
  }

    const canonicalSlug = category.slug;
    const meta = META_MAP[canonicalSlug] || META_MAP[slug] || {
      title: category.name || `${canonicalSlug.replace(/-/g, " ").toUpperCase()} Collection`,
      description: category.description || "Custom printed merchandise by Purple Friday India.",
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in";
    const canonicalUrl = `${siteUrl}${categoryHref(canonicalSlug)}`;

    return {
      title: `${meta.title} | Purple Friday`,
      description: meta.description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${meta.title} — Wholesale Custom Print India`,
        description: meta.description,
        url: canonicalUrl,
        type: "website",
        locale: "en_IN",
        siteName: "Purple Friday",
      },
    };
  }

  export default async function CategoryPage({
    params,
  }: {
    params: Promise<{ slug: string }>;
  }) {
    const resolved = await params;
    const slug = resolved?.slug;
    if (!slug) {
      notFound();
    }

    const category = await getCategoryBySlug(slug);
    if (!category) {
      notFound();
    }

      const canonicalSlug = category.slug;
      const meta = META_MAP[canonicalSlug] || META_MAP[slug] || {
        title: category.name || canonicalSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: category.description || "Precision-printed bulk custom merchandise for modern Indian brands.",
      };

      // Fetch initial products (for t-shirts, this includes both t-shirts & polo-shirts)
      const rawProducts = await getCachedProducts(canonicalSlug);

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
        template: p.template || p.slug,
        color: p.colors?.[0]?.hex || "#FFFFFF",
        colors: p.colors,
      }));

      const initialCursor = rawProducts.length > 12 ? rawProducts[11].slug : null;

      const counts = {
        all: rawProducts.length,
        team: rawProducts.filter((p) => p.audience === "TEAM" || p.audience === "BOTH").length,
        gifting: rawProducts.filter((p) => p.audience === "GIFTING" || p.audience === "BOTH").length,
      };

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in";
      const canonicalUrl = `${siteUrl}${categoryHref(slug)}`;

      const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: `${siteUrl}/category/all`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: meta.title,
            item: canonicalUrl,
          },
        ],
      };

      return(
    <>
      <script
        id={`breadcrumb-${slug}-schema`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Suspense fallback={<SectionSkeleton height="h-[600px]" title="Loading Category Atelier..." />}>
        <CollectionPageView
          title={meta.title}
          description={meta.description}
          categorySlug={slug}
          initialProducts={initialProducts}
          initialCursor={initialCursor}
          initialCounts={counts}
        />
      </Suspense>
    </>
  );
  }

