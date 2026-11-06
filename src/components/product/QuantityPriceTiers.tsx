"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
import { Minus, Plus, TrendingDown, ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

interface QuantityPriceTiersProps {
  tiers: PriceTier[];
  quantity: number;
  minQty: number;
  qtyStep?: number;
  basePrice: number;
  mrp: number;
  onQuantityChange: (qty: number) => void;
}

export function QuantityPriceTiers({
  tiers,
  quantity,
  minQty,
  qtyStep = 1,
  basePrice,
  mrp,
  onQuantityChange,
}: QuantityPriceTiersProps) {
  const layoutId = useId();

  // Find active tier index
  const activeTierIndex = tiers.findIndex((t) => {
    if (t.maxQty === null) return quantity >= t.minQty;
    return quantity >= t.minQty && quantity <= t.maxQty;
  });

  const effectiveActiveIndex = activeTierIndex !== -1 ? activeTierIndex : 0;
  const currentTier = tiers[effectiveActiveIndex];
  const currentUnitPrice = currentTier ? currentTier.unitPrice : basePrice;

  // Next tier upsell computation
  const nextTierIndex = effectiveActiveIndex < tiers.length - 1 ? effectiveActiveIndex + 1 : null;
  const nextTier = nextTierIndex !== null ? tiers[nextTierIndex] : null;

  const piecesToNextTier = nextTier ? nextTier.minQty - quantity : 0;
  const savingPerPiece = nextTier ? currentUnitPrice - nextTier.unitPrice : 0;

  // Quantity stepper handlers
  const handleDecrement = () => {
    const newQty = Math.max(quantity - qtyStep, minQty);
    onQuantityChange(newQty);
  };

  const handleIncrement = () => {
    onQuantityChange(quantity + qtyStep);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onQuantityChange(val);
    }
  };

  const handleInputBlur = () => {
    if (quantity < minQty) {
      onQuantityChange(minQty);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Quantity Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block font-mono text-xs font-bold text-pf-ink uppercase tracking-wider">
            Order Quantity
          </label>
          <span className="font-mono text-xs text-pf-ink/60">
            Min. {minQty} pcs (Step: {qtyStep})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border-2 border-pf-ink bg-white shadow-[3px_3px_0_0_#15101F]">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= minQty}
              aria-label="Decrease quantity"
              className="h-11 w-11 flex items-center justify-center text-pf-ink hover:bg-pf-paper disabled:opacity-30 disabled:cursor-not-allowed border-r-2 border-pf-ink transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              min={minQty}
              step={qtyStep}
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              aria-label="Target quantity"
              className="h-11 w-20 text-center font-mono text-base font-bold text-pf-ink focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              className="h-11 w-11 flex items-center justify-center text-pf-ink hover:bg-pf-paper border-l-2 border-pf-ink transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-xs text-pf-ink/60">Total Estimated Line</span>
            <span className="font-mono text-lg font-black text-pf-ink">
              {formatINR(quantity * currentUnitPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Upsell Nudge (Make it N chip) */}
      {nextTier && piecesToNextTier > 0 && savingPerPiece > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-pf-ink bg-pf-lilac/30 p-3.5 shadow-[3px_3px_0_0_#15101F] transition-all">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-pf-violet text-white flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
            <p className="font-sans text-xs text-pf-ink font-medium leading-tight">
              Add{" "}
              <strong className="font-mono font-bold text-pf-violet">
                {piecesToNextTier} more pieces
              </strong>
              , pay{" "}
              <strong className="font-mono font-bold text-pf-ink">
                {formatINR(nextTier.unitPrice)}
              </strong>{" "}
              per piece and save{" "}
              <strong className="font-mono font-bold text-pf-ink">
                {formatINR(savingPerPiece)}
              </strong>{" "}
              on every piece.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onQuantityChange(nextTier.minQty)}
            className="shrink-0 inline-flex items-center gap-1.5 border-2 border-pf-ink bg-pf-lime px-3.5 py-1.5 font-mono text-xs font-black uppercase text-pf-ink shadow-[2px_2px_0_0_#15101F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            <span>Make it {nextTier.minQty}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. Quantity-Wise Price Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-pf-ink uppercase tracking-wider">
            Volume Pricing Brackets
          </span>
          <span className="font-mono text-[11px] text-pf-ink/60">Per Piece Rate</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative">
          {tiers.map((tier, idx) => {
            const isActive = idx === effectiveActiveIndex;
            const savingsPercent = Math.round(((mrp - tier.unitPrice) / mrp) * 100);

            return (
              <button
                key={tier.minQty}
                type="button"
                onClick={() => onQuantityChange(tier.minQty)}
                className={`relative flex flex-col p-3 border-2 text-left transition-all bg-white ${
                  isActive
                    ? "border-pf-violet shadow-[3px_3px_0_0_#6A2CFF] ring-2 ring-pf-violet"
                    : "border-pf-ink/20 hover:border-pf-ink"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={`active-tier-glow-${layoutId}`}
                    className="absolute inset-0 bg-pf-lilac/15 pointer-events-none -z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-pf-ink">
                    {tier.maxQty ? `${tier.minQty}–${tier.maxQty} pcs` : `${tier.minQty}+ pcs`}
                  </span>
                  {savingsPercent > 0 && (
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                      -{savingsPercent}%
                    </span>
                  )}
                </div>

                <div className="relative z-10 font-mono text-base font-extrabold text-pf-ink">
                  {formatINR(tier.unitPrice)}
                  <span className="text-[10px] font-normal text-pf-ink/60"> /pc</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

