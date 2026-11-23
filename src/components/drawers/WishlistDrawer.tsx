"use client";

import React from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "../ui/drawer";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { ProductMockup } from "../mockup/ProductMockup";
import { CATALOG_FALLBACK } from "@/lib/pricing-client";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export function WishlistDrawer() {
  const { items, isOpen, closeWishlist, toggleWishlist } = useWishlist();
  const { addItem, openCart } = useCart();

  const handleMoveToCart = (slug: string) => {
    const product = CATALOG_FALLBACK[slug] || Object.values(CATALOG_FALLBACK)[0];
    addItem({
      productId: slug,
      optionKey: `${slug}-default`,
      qty: product.minQty,
      name: product.name,
      slug: product.slug,
      unitPrice: product.basePrice,
      template: product.template,
    });
    toggleWishlist(slug);
    closeWishlist();
    openCart();
    toast.success(`Moved ${product.name} to cart!`);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeWishlist()}>
      <DrawerContent side="right">
        <DrawerHeader>
          <div>
            <DrawerTitle>Saved Wishlist</DrawerTitle>
            <DrawerDescription>
              {items.length} {items.length === 1 ? "Product" : "Products"} saved for your next order
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <DrawerBody className="p-4 sm:p-6 space-y-4">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((slug) => {
                const product =
                  CATALOG_FALLBACK[slug] || {
                    name: slug.replace(/-/g, " ").toUpperCase(),
                    slug,
                    mrp: 499,
                    basePrice: 280,
                    minQty: 5,
                    template: slug.split("-")[0] || "tee",
                  };

                return (
                  <div
                    key={slug}
                    className="p-3.5 border border-ink/30 bg-paper-pure rounded-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 p-1 bg-paper rounded-xs shrink-0 flex items-center justify-center border border-ink/10">
                        <ProductMockup
                          template={product.template}
                          className="max-h-full max-w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-xs sm:text-sm text-ink truncate">
                          {product.name}
                        </h4>
                        <p className="font-mono text-xs text-ink/70">
                          From {formatINR(product.basePrice)}/pc (min {product.minQty})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleMoveToCart(slug)}
                        className="px-2.5 py-1.5 rounded-sm bg-violet text-white font-mono text-[11px] font-bold uppercase flex items-center gap-1 hover:bg-violet-hover"
                        title="Move to Cart"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => toggleWishlist(slug)}
                        className="p-1.5 text-ink/40 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-paper border border-ink/20 flex items-center justify-center text-ink/40">
                <Heart className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Your Wishlist is Empty
                </h3>
                <p className="font-sans text-xs text-ink/60 mt-1 max-w-xs mx-auto">
                  Click the heart icon on any product to save it for future bulk ordering.
                </p>
              </div>
              <Link
                href="/category/best-sellers"
                onClick={closeWishlist}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-violet text-white font-mono text-xs font-bold uppercase shadow-stamp hover:shadow-stamp-hover"
              >
                <span>Browse Products</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

