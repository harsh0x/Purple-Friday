"use client";

import React from "react";
import { Minus, Plus, CheckCircle2, AlertCircle } from "lucide-react";

export interface SizeConfig {
  id: string;
  name: string;
  chest: string;
}

export const APPAREL_SIZES: SizeConfig[] = [
  { id: "S", name: "S", chest: "36" },
  { id: "M", name: "M", chest: "38" },
  { id: "L", name: "L", chest: "40" },
  { id: "XL", name: "XL", chest: "42" },
  { id: "2XL", name: "2XL", chest: "44" },
  { id: "3XL", name: "3XL", chest: "46" },
  { id: "4XL", name: "4XL", chest: "48" },
];

interface ApparelSizePickerProps {
  targetQuantity: number;
  sizeSplit: Record<string, number>;
  onChange: (newSplit: Record<string, number>) => void;
}

export function ApparelSizePicker({
  targetQuantity,
  sizeSplit,
  onChange,
}: ApparelSizePickerProps) {
  const totalSelected = Object.values(sizeSplit).reduce((sum, n) => sum + (n || 0), 0);
  const remaining = targetQuantity - totalSelected;
  const isMatch = totalSelected === targetQuantity;
  const progressPercent = Math.min(100, Math.round((totalSelected / Math.max(1, targetQuantity)) * 100));

  const updateSize = (sizeId: string, delta: number) => {
    const current = sizeSplit[sizeId] || 0;
    const nextVal = Math.max(0, current + delta);
    onChange({
      ...sizeSplit,
      [sizeId]: nextVal,
    });
  };

  return (
    <div className="space-y-3 p-4 bg-paper-pure border-2 border-ink rounded-sm shadow-stamp-sm">
      {/* Header with Title & Selected Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black uppercase text-ink">
            Size-Wise Distribution
          </span>
          <span className="font-mono text-[10px] text-ink/60 bg-paper px-2 py-0.5 rounded-full border border-ink/20">
            Chest In.
          </span>
        </div>
        <div
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs border ${
            isMatch
              ? "bg-spot-lime text-ink border-ink"
              : remaining > 0
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : "bg-rose-100 text-rose-900 border-rose-300"
          }`}
        >
          {totalSelected}/{targetQuantity} Selected
        </div>
      </div>

      {/* Grid of Size Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {APPAREL_SIZES.map((size) => {
          const qty = sizeSplit[size.id] || 0;
          return (
            <div
              key={size.id}
              className={`p-2 border-2 rounded-xs flex flex-col justify-between transition-all ${
                qty > 0 ? "border-violet bg-violet/5 shadow-xs" : "border-ink/20 bg-paper hover:border-ink/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="font-bold text-xs text-ink">{size.name}</span>
                <span className="text-[10px] text-ink/60">({size.chest})</span>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-between bg-white border border-ink/20 rounded-xs">
                <button
                  type="button"
                  onClick={() => updateSize(size.id, -1)}
                  disabled={qty <= 0}
                  aria-label={`Decrease ${size.name}`}
                  className="h-7 w-7 flex items-center justify-center text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper active:bg-paper-dark transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono text-xs font-black text-ink">{qty}</span>
                <button
                  type="button"
                  onClick={() => updateSize(size.id, 1)}
                  aria-label={`Increase ${size.name}`}
                  className="h-7 w-7 flex items-center justify-center text-ink/60 hover:text-ink hover:bg-paper active:bg-paper-dark transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 pt-1">
        <div className="h-2 w-full bg-paper rounded-full border border-ink/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isMatch
                ? "bg-spot-lime"
                : remaining > 0
                ? "bg-violet"
                : "bg-rose-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="flex items-center justify-between font-mono text-[11px] pt-1">
          {isMatch ? (
            <span className="flex items-center gap-1.5 text-ink font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-spot-lime" />
              All {targetQuantity} pieces allocated to sizes
            </span>
          ) : remaining > 0 ? (
            <span className="text-violet font-semibold">
              Choose sizes for {remaining} more piece{remaining > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              Reduce {Math.abs(remaining)} piece{Math.abs(remaining) > 1 ? "s" : ""} to match order quantity
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
