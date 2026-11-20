"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { KitData } from "@/server/kits/kits-service";

export default function AdminKitsPage() {
  const [kits, setKits] = useState<KitData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/kits");
      const data = await res.json();
      if (data.kits) {
        setKits(data.kits);
      }
    } catch {
      toast.error("Failed to load joining kits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              Bundles & Joining Kits
            </h1>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-1">
            Parent-child SKU bundles, multi-component stock reservations, and automated shortage detection with substitutes
          </p>
        </div>

        <button
          type="button"
          onClick={loadKits}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-ink/10 text-xs font-mono font-medium rounded-xl hover:bg-paper text-ink/70 hover:text-ink transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock Checks</span>
        </button>
      </div>

      {/* Kits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs font-mono text-ink/40">
            Checking component stock levels...
          </div>
        ) : kits.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-mono text-ink/40">
            No joining kits configured.
          </div>
        ) : (
          kits.map((kit) => {
            const hasShortage = kit.isOutOfStock || kit.shortageComponents.length > 0;

            return (
              <div
                key={kit.id}
                className={`p-5 rounded-3xl border shadow-sm transition-all flex flex-col justify-between ${
                  hasShortage
                    ? "bg-rose-500/5 border-rose-500/20"
                    : "bg-white border-ink/10"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display font-bold text-base text-ink">
                        {kit.name}
                      </h2>
                      <span className="font-mono text-[11px] text-ink/50">
                        /{kit.slug}
                      </span>
                    </div>

                    {hasShortage ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20 shrink-0">
                        <XCircle className="w-3.5 h-3.5" />
                        Out of Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock ({kit.maxFulfillableKits} avail)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink/70 leading-relaxed">
                    {kit.description}
                  </p>

                  {/* Components Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-ink/5">
                    <span className="block font-mono text-[10px] uppercase font-bold text-ink/50 tracking-wider">
                      Bundle Components ({kit.components.length})
                    </span>
                    <div className="space-y-1.5">
                      {kit.components.map((comp) => {
                        const isShort = kit.shortageComponents.some(
                          (s) => s.componentId === comp.id
                        );

                        return (
                          <div
                            key={comp.id}
                            className={`p-2 rounded-xl text-xs font-mono flex items-center justify-between ${
                              isShort
                                ? "bg-rose-500/10 border border-rose-500/20 text-rose-800"
                                : "bg-paper/40 border border-ink/5 text-ink/80"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-violet">
                                {comp.quantity}x
                              </span>
                              <span className="truncate">{comp.name}</span>
                            </div>

                            {isShort && (
                              <span className="text-[10px] font-bold text-rose-600 bg-white/60 px-1.5 py-0.5 rounded">
                                Short
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shortage & Substitute Details */}
                  {hasShortage && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs font-mono text-amber-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Component Stock Bottleneck:</span>
                      </div>
                      {kit.shortageComponents.map((short, i) => (
                        <div key={i} className="text-[11px] pl-4 space-y-0.5">
                          <p>
                            • <span className="font-bold">{short.sku}</span>: Only {short.availableQty} available ({short.shortageQty} short).
                          </p>
                          {short.substituteSku && (
                            <p className="text-violet font-semibold">
                              ↳ Configured Substitute: {short.substituteName || short.substituteSku}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer of Card */}
                <div className="mt-5 pt-3 border-t border-ink/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink/50">Bundle Price</span>
                    <span className="font-mono font-bold text-lg text-ink">
                      ₹{kit.kitPrice.toFixed(2)}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-ink/40">
                    Version {kit.version}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
