import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getProductBySlug, getCachedProducts } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";
import { productHref } from "@/lib/urls";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved?.slug;
  if (!slug) {
    return {
      title: "Product Not Found | Purple Friday",
      description: "The requested custom merchandise product does not exist.",
    };
  }
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Purple Friday",
      description: "The requested custom merchandise product does not exist.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in";
  const canonicalUrl = `${siteUrl}${productHref(product.slug)}`;

  return {
    title: `${product.name} | Purple Friday India`,
    description: product.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — Bulk Custom Merchandise India`,
      description: `${product.description} Starts at ₹${product.basePrice}/pc with bulk quantity tiers.`,
      url: canonicalUrl,
      type: "website",
      locale: "en_IN",
      siteName: "Purple Friday",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolved = await params;
  const slug = resolved?.slug;
  if (!slug) {
    notFound();
  }
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getCachedProducts();

  // Related products from same category or best sellers
  const relatedRaw = allProducts
    .filter((p) => p.slug !== product.slug && (p.categorySlug === product.categorySlug || p.isBestSeller))
    .slice(0, 4);

  const relatedProducts: ProductCardData[] = relatedRaw.map((p) => ({
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
    reviewCount: p.reviewCount || 38,
    badges: p.badges,
    template: p.template || p.slug,
    color: p.colors?.[0]?.hex || "#FFFFFF",
    colors: p.colors,
  }));

  // JSON-LD Product Schema with AggregateRating and Volume Offers
  const minTierPrice =
    product.priceTiers.length > 0
      ? Math.min(...product.priceTiers.map((t) => t.unitPrice))
      : product.basePrice;
  const maxTierPrice =
    product.priceTiers.length > 0
      ? Math.max(...product.priceTiers.map((t) => t.unitPrice))
      : product.mrp;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in";
  const canonicalUrl = `${siteUrl}${productHref(product.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    url: canonicalUrl,
    brand: {
      "@type": "Brand",
      name: "Purple Friday",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: minTierPrice,
      highPrice: maxTierPrice,
      offerCount: product.priceTiers.length,
      offers: product.priceTiers.map((tier) => ({
        "@type": "Offer",
        price: tier.unitPrice,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: tier.minQty,
          maxValue: tier.maxQty ?? undefined,
          unitCode: "C62",
        },
      })),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: "5",
      worstRating: "1",
    },
  };

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
        name: "Category",
        item: `${siteUrl}/category/${product.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        id="product-schema-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        id="product-breadcrumb-schema-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </>
  );
}

