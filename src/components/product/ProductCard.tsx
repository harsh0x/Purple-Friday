"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { ProductMockup } from "../mockup/ProductMockup";
import { Rating } from "../ui/rating";
import { CropCorners } from "../ui/decorative";
import { useWishlist } from "@/hooks/useWishlist";
import { formatINR, calculateDiscountPercent } from "@/lib/utils";
import { QuickViewSheet } from "./QuickViewSheet";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  description?: string;
  basePrice: number;
  mrp: number;
  minQty: number;
  qtyStep?: number;
  rating?: number;
  reviewCount?: number;
  badges?: string[];
  template: string;
  color?: string;
  colors?: Array<{ name: string; hex: string }>;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.slug);
  const discountPercent = calculateDiscountPercent(product.mrp, product.basePrice);

  return (
    <>
      <div
        className="group p-4 border border-ink/20 bg-paper-pure rounded-sm hover:border-ink hover:shadow-card hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CropCorners offset={4} length={8} />

        {/* Top Flags: Min Qty & Wishlist Button */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink bg-paper px-2 py-0.5 rounded-full border border-ink/20">
              Min. {product.minQty} pcs
            </span>

            {discountPercent > 0 && (
              <span className="font-mono text-[10px] font-bold uppercase text-ink bg-spot-lime px-2 py-0.5 rounded-full border border-ink/30">
                Save {discountPercent}%
              </span>
            )}

            <button
              type="button"
              onClick={() => toggleWishlist(product.slug)}
              className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet ${isFavorited ? "text-violet fill-violet" : "text-ink/40 hover:text-violet"
                }`}
              aria-label={isFavorited ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-violet stroke-violet" : ""}`} />
            </button>
          </div>

          {/* SVG Mockup Image Container with Gentle Lift & Alternate View Swap on Hover */}
          <Link href={`/product/${product.slug}`} className="block">
            <div className="aspect-square w-full flex items-center justify-center p-3 bg-paper rounded-xs mb-3 overflow-hidden relative">
              <ProductMockup
                slug={product.slug}
                template={product.template}
                color={product.color}
                view={isHovered ? "back" : "front"}
                size="card"
                className="max-h-full max-w-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Rating */}
          <div className="mb-1.5">
            <Rating
              score={product.rating || 4.9}
              totalReviews={product.reviewCount || 48}
              size="sm"
            />
          </div>

          {/* Product Name */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-display font-bold text-sm text-ink truncate hover:text-violet transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Bottom Price Block & Quick Add Button */}
        <div className="pt-3 mt-3 border-t border-ink/10 flex items-end justify-between">
          <div className="font-mono">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-ink/50 uppercase">From</span>
              <span className="font-bold text-base text-ink tracking-tight">
                {formatINR(product.basePrice)}
              </span>
              <span className="text-xs text-ink/40 line-through">
                {formatINR(product.mrp)}
              </span>
            </div>
            <span className="text-[10px] text-ink/60 lowercase block">
              /pc for {product.minQty} pcs
            </span>
          </div>

          {/* Circular Quick Add Button */}
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="h-10 w-10 rounded-full border border-ink bg-paper text-ink flex items-center justify-center hover:bg-violet hover:text-white hover:border-violet shadow-stamp-sm hover:shadow-stamp active:scale-95 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
            title="Quick Order"
            aria-label={`Quick View ${product.name}`}
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Quick View Bottom Sheet */}
      <QuickViewSheet
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}

