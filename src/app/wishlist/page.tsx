"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { QuickViewSheet } from "@/components/product/QuickViewSheet";
import { ProductCardData } from "@/components/product/ProductCard";
import { formatINR } from "@/lib/utils";

export default function WishlistPage() {
  const { items: wishlistSlugs, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardData | null>(null);

  useEffect(() => {
    async function loadWishlistProducts() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/collections?limit=48");
        if (res.ok) {
          const data = await res.json();
          const items: ProductCardData[] = data.items;
          setProducts(items.filter((p) => wishlistSlugs.includes(p.slug)));
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadWishlistProducts();
  }, [wishlistSlugs]);

  const handleRemove = (slug: string, name: string) => {
    toggleWishlist(slug);
    toast.success(`${name} removed from your wishlist.`);
  };

  if (!isLoading && products.length === 0) {
    return (
      <div className="min-h-[70vh] bg-pf-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full border-2 border-pf-ink bg-white p-8 text-center shadow-[6px_6px_0_0_#15101F]">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full border-2 border-pf-ink bg-pf-paper flex items-center justify-center text-rose-500 shadow-[3px_3px_0_0_#15101F]">
            <Heart className="h-10 w-10 fill-rose-100 text-rose-500" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-pf-ink">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-sm font-sans text-pf-ink/75 leading-relaxed">
            Save your favorite custom blanks, magnetic badges, and polo shirts to review specifications with your team before ordering.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/collections/all"
              className="inline-flex items-center justify-center gap-2 border-2 border-pf-ink bg-pf-violet text-white font-mono text-xs font-bold uppercase tracking-wider py-3.5 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] transition-all"
            >
              <Sparkles className="h-4 w-4 text-pf-lime" />
              <span>Explore All Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* Header */}
      <div className="border-b-2 border-pf-ink bg-white py-10 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              Saved For Team Review
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-pf-ink mt-1">
              Your Wishlist Specimens
            </h1>
            <p className="text-sm font-sans text-pf-ink/75 mt-1">
              {products.length} {products.length === 1 ? "item" : "items"} saved with active bulk pricing tiers.
            </p>
          </div>

          <Link
            href="/collections/all"
            className="text-xs font-mono font-bold text-pf-ink hover:text-pf-violet uppercase tracking-wider underline underline-offset-4"
          >
            Continue browsing catalogue →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border-2 border-pf-ink bg-white p-4 shadow-[4px_4px_0_0_#15101F] flex flex-col justify-between"
            >
              {/* Thumbnail & Product Details */}
              <div>
                <div className="relative aspect-square border-2 border-pf-ink bg-pf-paper mb-3 p-3 flex items-center justify-center">
                  <ProductMockup
                    template={product.template}
                    color={product.color}
                    className="w-full h-full"
                  />
                  <button
                    onClick={() => handleRemove(product.slug, product.name)}
                    aria-label="Remove from wishlist"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full border-2 border-pf-ink bg-white flex items-center justify-center text-pf-ink/60 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <span className="font-mono text-[10px] text-pf-ink/60 bg-pf-ink/5 px-2 py-0.5 border border-pf-ink/10">
                  Min. {product.minQty} pcs
                </span>

                <h3 className="font-display text-base font-bold text-pf-ink leading-snug mt-2 line-clamp-2">
                  <Link href={`/products/${product.slug}`} className="hover:text-pf-violet">
                    {product.name}
                  </Link>
                </h3>

                <div className="mt-2 flex items-baseline gap-2 font-mono">
                  <span className="text-base font-black text-pf-ink">
                    From {formatINR(product.basePrice)}
                  </span>
                  <span className="text-xs text-pf-ink/40 line-through">
                    {formatINR(product.mrp)}
                  </span>
                  <span className="text-[10px] text-pf-ink/60">/pc</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-pf-ink/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(product)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-pf-ink bg-pf-violet text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 shadow-[2px_2px_0_0_#15101F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Move to Cart</span>
                </button>

                <Link
                  href={`/customize/${product.slug}`}
                  aria-label="Customize"
                  className="h-9 w-9 border-2 border-pf-ink bg-white flex items-center justify-center text-pf-ink hover:bg-pf-paper shadow-[2px_2px_0_0_#15101F]"
                >
                  <ShoppingBag className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick View Sheet for "Move to Cart" */}
      <QuickViewSheet
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
