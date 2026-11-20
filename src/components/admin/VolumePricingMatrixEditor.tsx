"use client";

import React from "react";
import { Plus, Trash2, AlertCircle, TrendingUp, Check } from "lucide-react";
import { validatePriceTiers } from "@/lib/admin/tier-validator";

export interface SlabItem {
  minQty: number;
  maxQty: number | null;
  unitPrice: number; // in rupees
}

interface VolumePricingMatrixEditorProps {
  slabs: SlabItem[];
  costPricePaise: number; // in paise
  moq: number;
  onChange: (slabs: SlabItem[], isValid: boolean) => void;
}

export function VolumePricingMatrixEditor({
  slabs,
  costPricePaise,
  moq,
  onChange,
}: VolumePricingMatrixEditorProps) {
  const costRupees = costPricePaise / 100;

  // Run live validation
  const validation = validatePriceTiers(slabs);
  const moqMatch = slabs[0]?.minQty === moq;
  const allErrors = [...validation.errors];
  if (!moqMatch && slabs.length > 0) {
    allErrors.unshift(`First tier minimum quantity (${slabs[0].minQty}) must match product MOQ (${moq}).`);
  }

  const handleUpdate = (
    index: number,
    field: "minQty" | "maxQty" | "unitPrice",
    value: string
  ) => {
    const updated = slabs.map((s, idx) => {
      if (idx !== index) return { ...s };
      if (field === "maxQty") {
        return {
          ...s,
          maxQty: value === "" || value === "null" ? null : Math.max(1, parseInt(value, 10) || 1),
        };
      }
      return {
        ...s,
        [field]: Math.max(1, parseInt(value, 10) || 1),
      };
    });

    const valResult = validatePriceTiers(updated);
    onChange(updated, valResult.valid && (updated[0]?.minQty === moq));
  };

  const handleAddSlab = () => {
    const last = slabs[slabs.length - 1];
    let newMin = 100;
    let newPrice = 100;

    if (last) {
      newMin = (last.maxQty || last.minQty) + 1;
      newPrice = Math.max(10, last.unitPrice - 20);
      last.maxQty = newMin - 1;
    }

    const updated: SlabItem[] = [
      ...slabs,
      { minQty: newMin, maxQty: null, unitPrice: newPrice },
    ];

    const valResult = validatePriceTiers(updated);
    onChange(updated, valResult.valid && (updated[0]?.minQty === moq));
  };

  const handleRemoveSlab = (index: number) => {
    if (slabs.length <= 1) return;
    const updated = slabs.filter((_, idx) => idx !== index);
    // If last slab has a maxQty, make it open-ended (null)
    if (updated.length > 0 && updated[updated.length - 1].maxQty !== null) {
      updated[updated.length - 1].maxQty = null;
    }

    const valResult = validatePriceTiers(updated);
    onChange(updated, valResult.valid && (updated[0]?.minQty === moq));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Volume Pricing Slabs (Tier Matrix)
          </h3>
          <p className="text-[11px] text-ink/60 mt-0.5">
            Prices strictly decrease as volume scales. Margin calculates live against COGS (₹{costRupees.toFixed(2)}/pc).
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSlab}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-violet text-white rounded-lg hover:bg-violet-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Slab
        </button>
      </div>

      {/* Validation Banner */}
      {allErrors.length > 0 ? (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Pricing Matrix Validation Errors:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px]">
            {allErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Matrix valid: No gaps, no overlaps, and descending unit rates.</span>
        </div>
      )}

      {/* Slabs Grid */}
      <div className="space-y-2">
        {slabs.map((slab, index) => {
          const margin =
            slab.unitPrice > 0
              ? Math.round(((slab.unitPrice - costRupees) / slab.unitPrice) * 1000) / 10
              : 0;
          const isHealthyMargin = margin >= 25;

          return (
            <div
              key={index}
              className="p-3 bg-white rounded-xl border border-ink/10 shadow-sm flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-violet/10 text-violet font-mono text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink/40">From (Qty)</span>
                    <input
                      type="number"
                      min={1}
                      value={slab.minQty}
                      onChange={(e) => handleUpdate(index, "minQty", e.target.value)}
                      className="w-20 px-2.5 py-1 text-xs font-mono border border-ink/10 rounded-lg focus:outline-none focus:border-violet"
                    />
                  </div>

                  <span className="text-ink/30 mt-4">-</span>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink/40">To (Qty)</span>
                    <input
                      type="text"
                      placeholder="Open-ended"
                      value={slab.maxQty ?? ""}
                      disabled={index === slabs.length - 1}
                      onChange={(e) => handleUpdate(index, "maxQty", e.target.value)}
                      className="w-24 px-2.5 py-1 text-xs font-mono border border-ink/10 rounded-lg focus:outline-none focus:border-violet disabled:bg-paper disabled:text-ink/40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-ink/40">Unit Rate (₹)</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-ink/40">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={slab.unitPrice}
                      onChange={(e) => handleUpdate(index, "unitPrice", e.target.value)}
                      className="w-28 pl-6 pr-2.5 py-1 text-xs font-mono font-bold border border-ink/10 rounded-lg focus:outline-none focus:border-violet"
                    />
                  </div>
                </div>

                <div className="flex flex-col min-w-[90px]">
                  <span className="text-[10px] font-mono uppercase text-ink/40">Gross Margin</span>
                  <div
                    className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-md ${
                      isHealthyMargin
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>{margin}%</span>
                  </div>
                </div>

                {slabs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlab(index)}
                    aria-label={`Remove slab ${index + 1}`}
                    className="p-1.5 text-ink/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
