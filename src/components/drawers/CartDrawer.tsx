"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from "../ui/drawer";
import { Button } from "../ui/button";
import { useCart } from "@/hooks/useCart";
import { ProductMockup } from "../mockup/ProductMockup";
import { formatINR } from "@/lib/utils";
import { PricingCalculationResult } from "@/lib/pricing";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, couponCode, setCouponCode } = useCart();
  const [pricing, setPricing] = useState<PricingCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [couponInput, setCouponInput] = useState(couponCode || "FIRSTORDER");

  // Fetch verified server pricing whenever items or couponCode changes
  const fetchPricing = useCallback(async () => {
    if (items.length === 0) {
      setPricing(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/cart/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            optionKey: i.optionKey,
            qty: i.qty,
            options: i.options,
            designId: i.designId,
          })),
          couponCode,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPricing(json.data);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [items, couponCode]);

  useEffect(() => {
    if (isOpen) {
      fetchPricing();
    }
  }, [isOpen, fetchPricing]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponCode(couponInput.trim().toUpperCase());
    toast.success(`Coupon code ${couponInput.trim().toUpperCase()} applied!`);
  };

  const freeShippingProgress = pricing
    ? Math.min(100, Math.round(((pricing.subtotal - pricing.discount) / pricing.freeShippingThreshold) * 100))
    : 0;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <DrawerContent side="responsive">
        <DrawerHeader>
          <div>
            <DrawerTitle>Your Merchandise Cart</DrawerTitle>
            <DrawerDescription>
              {items.length} {items.length === 1 ? "Product" : "Products"} • All bulk rates verified by server
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <DrawerBody className="p-4 sm:p-6 space-y-6">
          {items.length > 0 ? (
            <>
              {/* Free Shipping Progress Indicator */}
              {pricing && (
                <div className="p-3.5 border border-ink/20 bg-paper-pure rounded-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-ink">
                      {pricing.shipping === 0
                        ? "🎉 Qualified for Free Pan-India Courier"
                        : `Add ${formatINR(pricing.amountNeededForFreeShipping)} more for Free Shipping`}
                    </span>
                    <span className="text-ink/60">{freeShippingProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-ink/20">
                    <div
                      className="h-full bg-violet transition-all duration-300"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-4">
                {items.map((item) => {
                  const calculated = pricing?.items.find((i) => i.optionKey === item.optionKey);
                  const unitPrice = calculated?.unitPrice ?? item.unitPrice ?? 225;
                  const lineTotal = calculated?.lineTotal ?? unitPrice * item.qty;
                  const isUnavailable = calculated?.isAvailable === false;

                  return (
                    <div
                      key={item.optionKey}
                      className="p-4 border border-ink/30 bg-paper-pure rounded-sm flex gap-3 relative"
                    >
                      {/* Thumbnail SVG Mockup */}
                      <div className="h-20 w-20 p-1.5 bg-paper rounded-xs shrink-0 flex items-center justify-center border border-ink/10">
                        <ProductMockup
                          template={item.template || "tee"}
                          className="max-h-full max-w-full"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display font-bold text-sm text-ink truncate">
                            {item.name || item.productId}
                          </h4>
                          <button
                            onClick={() => removeItem(item.optionKey)}
                            className="text-ink/50 hover:text-red-600 transition-colors p-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Options summary */}
                        {item.options && (
                          <p className="text-xs font-mono text-ink/60 truncate mt-0.5">
                            {Object.entries(item.options)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" • ")}
                          </p>
                        )}

                        {isUnavailable && (
                          <div className="mt-1">
                            <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              No longer available
                            </span>
                          </div>
                        )}

                        {/* Price & Quantity Controls */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-ink/10">
                          <div className="flex items-center border border-ink rounded-sm bg-paper">
                            <button
                              onClick={() => updateQty(item.optionKey, item.qty - 1)}
                              className="p-1 text-ink hover:bg-ink/10"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono text-xs font-bold px-2.5 min-w-[32px] text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.optionKey, item.qty + 1)}
                              className="p-1 text-ink hover:bg-ink/10"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-ink">
                              {formatINR(lineTotal)}
                            </span>
                            <span className="block font-mono text-[10px] text-ink/60">
                              @{formatINR(unitPrice)}/pc
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="h-4 w-4 absolute left-3 top-3 text-ink/40" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter Coupon (e.g. FIRSTORDER)"
                    className="w-full min-h-[40px] pl-9 pr-3 rounded-sm bg-paper-pure text-ink text-xs font-mono border border-ink/30 uppercase tracking-wider focus:outline-none focus:border-violet"
                  />
                </div>
                <Button type="submit" variant="ghost" size="sm">
                  Apply
                </Button>
              </form>

              {/* Verified Trust Badges */}
              <div className="flex items-center gap-2 p-3 bg-paper rounded-sm border border-ink/10 text-xs font-mono text-ink/80">
                <ShieldCheck className="h-4 w-4 text-violet shrink-0" />
                <span>Prepress team verifies artwork before printing. 100% Quality Guaranteed.</span>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-paper border border-ink/20 flex items-center justify-center text-ink/40">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Your Cart is Empty
                </h3>
                <p className="font-sans text-xs text-ink/60 mt-1 max-w-xs mx-auto">
                  Browse our high-definition magnetic badges, custom tees, or corporate kits.
                </p>
              </div>
              <Link
                href="/category/best-sellers"
                onClick={closeCart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-violet text-white font-mono text-xs font-bold uppercase shadow-stamp hover:shadow-stamp-hover"
              >
                <span>Explore Best Sellers</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </DrawerBody>

        {/* Drawer Footer with Price Breakup & Checkout CTA */}
        {items.length > 0 && pricing && (
          <DrawerFooter className="space-y-3">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-ink/80">
                <span>Subtotal ({items.reduce((a, b) => a + b.qty, 0)} pcs)</span>
                <span>{formatINR(pricing.subtotal)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-violet font-bold">
                  <span>Discount ({pricing.discountBreakdown?.code})</span>
                  <span>-{formatINR(pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink/80">
                <span>GST (18% Input Credit)</span>
                <span>{formatINR(pricing.gst)}</span>
              </div>
              <div className="flex justify-between text-ink/80">
                <span>Pan-India Courier</span>
                <span>{pricing.shipping === 0 ? "FREE" : formatINR(pricing.shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-ink pt-2 border-t border-ink/20">
                <span>Total Amount</span>
                <span>{formatINR(pricing.total)}</span>
              </div>
            </div>

            {pricing.hasUnavailableItems ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-sm bg-rose-600 text-white font-mono text-xs font-bold uppercase opacity-75 cursor-not-allowed"
              >
                <span>Items unavailable — remove to checkout</span>
              </button>
            ) : (
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-sm bg-violet text-white font-mono text-sm font-bold uppercase shadow-stamp hover:shadow-stamp-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-active transition-all"
              >
                <span>{isLoading ? "Recalculating..." : `Checkout — ${formatINR(pricing.total)}`}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

