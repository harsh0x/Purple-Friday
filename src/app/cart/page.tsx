"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Sparkles,
  Truck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { formatINR } from "@/lib/utils";
import { PricingCalculationResult } from "@/lib/pricing";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, couponCode, setCouponCode } = useCart();
  const [pricing, setPricing] = useState<PricingCalculationResult | null>(null);
  const [couponInput, setCouponInput] = useState(couponCode || "");
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  // Fetch verified server pricing
  const fetchPricing = useCallback(async () => {
    if (items.length === 0) {
      setPricing(null);
      return;
    }

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
      // offline fallback
    }
  }, [items, couponCode]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponCode(cleanCode);
    toast.success(`Coupon code ${cleanCode} submitted for validation!`);
  };

  const handleRemoveItem = (optionKey: string) => {
    removeItem(optionKey);
    setItemToRemove(null);
    toast.success("Item removed from your cart.");
  };

  const freeShippingProgress = pricing
    ? Math.min(100, Math.round(((pricing.subtotal - pricing.discount) / pricing.freeShippingThreshold) * 100))
    : 0;

  // Calculate total volume savings compared to MRP
  const totalVolumeSavings = pricing
    ? pricing.items.reduce((acc, item) => acc + (item.mrp - item.unitPrice) * item.qty, 0)
    : 0;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-pf-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full border-2 border-pf-ink bg-white p-8 text-center shadow-[6px_6px_0_0_#15101F]">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full border-2 border-pf-ink bg-pf-paper flex items-center justify-center text-pf-violet shadow-[3px_3px_0_0_#15101F]">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-pf-ink">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm font-sans text-pf-ink/75 leading-relaxed">
            You have not added any custom-printed merchandise or specimen blanks to your order yet.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/collections/best-sellers"
              className="inline-flex items-center justify-center gap-2 border-2 border-pf-ink bg-pf-violet text-white font-mono text-xs font-bold uppercase tracking-wider py-3.5 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] transition-all"
            >
              <Sparkles className="h-4 w-4 text-pf-lime" />
              <span>Explore Best Sellers</span>
            </Link>
            <Link
              href="/collections/all"
              className="font-mono text-xs font-bold text-pf-ink hover:underline uppercase tracking-wider text-center py-2"
            >
              Browse Complete Catalogue →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* Header */}
      <div className="border-b-2 border-pf-ink bg-white py-8 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              Step 1 of 3: Pre-Press Cart Review
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-pf-ink mt-1">
              Your Merchandise Order
            </h1>
          </div>
          <button
            onClick={() => clearCart()}
            className="self-start sm:self-auto text-xs font-mono font-bold text-rose-700 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear entire cart
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Line Items (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Progress Bar */}
            {pricing && (
              <div className="border-2 border-pf-ink bg-white p-4 shadow-[3px_3px_0_0_#15101F] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold text-pf-ink">
                    <Truck className="h-4 w-4 text-pf-violet" />
                    <span>
                      {pricing.shipping === 0
                        ? "Qualified for Free Pan-India Air Express Delivery!"
                        : `Add ${formatINR(pricing.amountNeededForFreeShipping)} more for FREE delivery`}
                    </span>
                  </div>
                  <span className="font-bold text-pf-violet">{freeShippingProgress}%</span>
                </div>
                <div className="h-2.5 w-full bg-pf-ink/10 rounded-full overflow-hidden border border-pf-ink/20">
                  <div
                    className="h-full bg-pf-violet transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Line Items List */}
            <div className="space-y-4">
              {items.map((item) => {
                const resolvedItem = pricing?.items.find((i) => i.optionKey === item.optionKey);
                const currentUnitPrice = resolvedItem ? resolvedItem.unitPrice : item.unitPrice || 0;
                const currentLineTotal = resolvedItem ? resolvedItem.lineTotal : item.qty * currentUnitPrice;
                const isUnavailable = resolvedItem?.isAvailable === false;

                return (
                  <article
                    key={item.optionKey}
                    className="border-2 border-pf-ink bg-white p-4 sm:p-5 shadow-[4px_4px_0_0_#15101F] flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                  >
                    {/* Thumbnail & Product Details */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-20 w-20 shrink-0 border-2 border-pf-ink bg-pf-paper p-1 flex items-center justify-center">
                        <ProductMockup
                          template={item.template || "badge"}
                          className="w-full h-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <h2 className="font-display text-base font-bold text-pf-ink leading-snug">
                          {item.name}
                        </h2>
                        {item.options && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {Object.entries(item.options).map(([k, v]) => (
                              <span
                                key={k}
                                className="font-mono text-[10px] text-pf-ink/75 bg-pf-paper px-1.5 py-0.5 border border-pf-ink/15"
                              >
                                {k}: <strong>{v}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="font-mono text-xs text-pf-ink/60 pt-1">
                          Tier Price:{" "}
                          <strong className="text-pf-ink font-bold">
                            {formatINR(currentUnitPrice)}
                          </strong>{" "}
                          / piece
                        </div>
                        {isUnavailable && (
                          <div className="pt-1">
                            <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5">
                              No longer available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-pf-ink/10">
                      <div className="flex items-center border-2 border-pf-ink bg-white">
                        <button
                          type="button"
                          onClick={() => updateQty(item.optionKey, Math.max(1, item.qty - 1))}
                          disabled={item.qty <= 1}
                          className="h-8 w-8 flex items-center justify-center text-pf-ink hover:bg-pf-paper disabled:opacity-30 border-r-2 border-pf-ink"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="h-8 w-12 flex items-center justify-center font-mono text-xs font-bold text-pf-ink">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.optionKey, item.qty + 1)}
                          className="h-8 w-8 flex items-center justify-center text-pf-ink hover:bg-pf-paper border-l-2 border-pf-ink"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <span className="font-mono text-base font-black text-pf-ink block">
                          {formatINR(currentLineTotal)}
                        </span>
                        <span className="font-mono text-[10px] text-pf-ink/50">inc. 18% GST</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setItemToRemove(item.optionKey)}
                        aria-label="Remove item"
                        className="p-2 text-pf-ink/40 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Inline Removal Confirmation */}
                    {itemToRemove === item.optionKey && (
                      <div className="w-full sm:col-span-full pt-3 mt-2 border-t border-rose-200 bg-rose-50 p-3 flex items-center justify-between text-xs">
                        <span className="font-mono text-rose-800 font-bold">
                          Remove {item.name} from cart?
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveItem(item.optionKey)}
                            className="bg-rose-600 text-white font-mono font-bold px-3 py-1 text-xs"
                          >
                            Yes, remove
                          </button>
                          <button
                            onClick={() => setItemToRemove(null)}
                            className="border border-pf-ink bg-white font-mono font-bold px-3 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Trust Callout */}
            <div className="border-2 border-dashed border-pf-ink/30 bg-pf-paper/50 p-4 flex items-center gap-3 text-xs font-mono text-pf-ink/75">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                100% Pre-Print WhatsApp Approval: You inspect and sign off on exact 1:1 scale proofs before production begins.
              </span>
            </div>
          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            <div className="border-2 border-pf-ink bg-white p-6 shadow-[5px_5px_0_0_#15101F] space-y-5">
              <h2 className="font-display text-xl font-bold text-pf-ink border-b-2 border-pf-ink pb-3">
                Order Summary
              </h2>

              {/* Volume Savings Callout */}
              {totalVolumeSavings > 0 && (
                <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 p-3 text-xs font-mono text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    You saved <strong>{formatINR(totalVolumeSavings)}</strong> with volume tier pricing!
                  </span>
                </div>
              )}

              {/* Coupon Input Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="block font-mono text-xs font-bold text-pf-ink uppercase">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="text"
                      placeholder="e.g. FIRSTORDER"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full h-9 pl-8 pr-2 border-2 border-pf-ink bg-white font-mono text-xs uppercase font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-3 border-2 border-pf-ink bg-pf-ink text-white font-mono text-xs font-bold uppercase hover:bg-pf-violet transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {pricing?.discountBreakdown && (
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-200">
                    <span>Code: {pricing.discountBreakdown.code}</span>
                    <span>-{formatINR(pricing.discountBreakdown.amount)}</span>
                  </div>
                )}
              </form>

              {/* Price Breakdown Rows */}
              <dl className="space-y-2.5 font-mono text-xs border-t border-pf-ink/10 pt-4">
                <div className="flex justify-between text-pf-ink/75">
                  <dt>Merchandise Subtotal:</dt>
                  <dd className="font-bold text-pf-ink">
                    {formatINR(pricing?.subtotal || 0)}
                  </dd>
                </div>

                {pricing && pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <dt>Coupon Discount:</dt>
                    <dd>-{formatINR(pricing.discount)}</dd>
                  </div>
                )}

                <div className="flex justify-between text-pf-ink/75">
                  <dt>Pan-India Delivery:</dt>
                  <dd className="font-bold text-pf-ink">
                    {pricing?.shipping === 0 ? (
                      <span className="text-emerald-700">FREE</span>
                    ) : (
                      formatINR(pricing?.shipping || 150)
                    )}
                  </dd>
                </div>

                <div className="flex justify-between text-pf-ink/60 border-t border-pf-ink/10 pt-2">
                  <dt>GST Included (18%):</dt>
                  <dd>{formatINR(pricing?.gst || 0)}</dd>
                </div>

                <div className="flex justify-between items-baseline border-t-2 border-pf-ink pt-3 text-base font-black text-pf-ink">
                  <dt>Total Payable:</dt>
                  <dd className="text-2xl text-pf-ink font-mono">
                    {formatINR(pricing?.total || 0)}
                  </dd>
                </div>
              </dl>

              {/* Primary Stamp Checkout CTA */}
              {pricing?.hasUnavailableItems ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex items-center justify-center gap-3 border-2 border-pf-ink bg-rose-600 text-white font-mono text-sm font-bold uppercase tracking-wider py-4 opacity-75 cursor-not-allowed"
                  >
                    <span>Items unavailable — remove to checkout</span>
                  </button>
                  <p className="text-[11px] font-mono text-rose-600 text-center font-bold">
                    One or more items in your cart are no longer available. Please remove them to proceed.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toast.info("Checkout payment gateway opens in Part 3.")}
                  className="w-full inline-flex items-center justify-center gap-3 border-2 border-pf-ink bg-pf-violet text-white font-mono text-sm font-bold uppercase tracking-wider py-4 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              <p className="text-[11px] font-mono text-pf-ink/60 text-center">
                Official Indian 18% GST invoice provided upon order confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
