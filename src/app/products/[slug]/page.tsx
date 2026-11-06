import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Script from "next/script";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getCachedProducts } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getCachedProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "Product Not Found | Purple Friday",
    };
  }

  return {
    title: `${product.name} | Purple Friday India`,
    description: product.description,
    openGraph: {
      title: `${product.name} — Bulk Custom Merchandise`,
      description: `${product.description} Starts at ₹${product.basePrice}/pc with bulk quantity tiers.`,
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
  const { slug } = await params;
  const allProducts = await getCachedProducts();
  const product = allProducts.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  // Related products from same category or fallback
  const relatedRaw = allProducts
    .filter((p) => p.slug !== slug && (p.categorySlug === product.categorySlug || p.isBestSeller))
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
    template: p.slug,
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

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
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

  return (
    <>
      <Script
        id="product-schema-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </>
  );
}
