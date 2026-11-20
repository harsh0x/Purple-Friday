"use client";

import React, { useState, useEffect } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  Download,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { BlankSkuForecast, MonthlySeasonalIndex } from "@/server/inventory/forecasting";

export default function AdminForecastingPage() {
  const [forecasts, setForecasts] = useState<BlankSkuForecast[]>([]);
  const [seasonalIndices, setSeasonalIndices] = useState<MonthlySeasonalIndex[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(10); // October (Diwali)
  const [selectedMultiplier, setSelectedMultiplier] = useState("2.2");
  const [savingMultiplier, setSavingMultiplier] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forecasting");
      if (res.ok) {
        const json = await res.json();
        setForecasts(json.forecasts);
        setAlertsCount(json.alertsCount);
        setSeasonalIndices(json.seasonalIndices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMultiplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMultiplier(true);
    try {
      const res = await fetch("/api/admin/forecasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          multiplier: parseFloat(selectedMultiplier),
        }),
      });
      if (res.ok) {
        setShowSeasonModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMultiplier(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-[#15101F]/60">
        Computing raw material consumption velocities & seasonal runouts...
      </div>
    );
  }

  const criticalSkus = forecasts.filter((f) => f.needsReorder);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                Raw Material Forecasting & Reorder Point
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                Supply Chain MRP
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Moving average consumption velocities (4w & 8w), lead time demand, safety stock & supplier purchase orders
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSeasonModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] font-mono text-xs font-semibold shadow-sm hover:bg-[#FAF7F2] transition-colors"
            >
              <Sliders className="w-4 h-4 text-[#6A2CFF]" />
              <span>Seasonal Indices</span>
            </button>

            <a
              href="/api/admin/forecasting?export=csv"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold shadow-sm hover:bg-[#221A31] transition-colors"
            >
              <Download className="w-4 h-4 text-[#D8FF3F]" />
              <span>Export Supplier PO (CSV)</span>
            </a>
          </div>
        </div>

        {/* Reorder Alerts Banner */}
        {criticalSkus.length > 0 && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-950">
                  Supply Alert: {criticalSkus.length} Blank Material SKUs Below Reorder Point
                </h4>
                <p className="text-xs text-rose-800/80 font-sans mt-0.5">
                  Available stock is insufficient for upcoming supplier lead times. Export PO or contact mill suppliers immediately.
                </p>
              </div>
            </div>
            <a
              href="/api/admin/forecasting?export=csv"
              download
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-mono text-xs font-bold hover:bg-rose-700 transition-colors shrink-0"
            >
              Download PO Now &rarr;
            </a>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              Tracked Material SKUs
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-[#15101F]">
              {forecasts.length}
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Garment blanks, hoodies, mugs & tote bags
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              Reorder Point Triggers
            </span>
            <div className={`mt-2 font-mono text-2xl font-black ${alertsCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {alertsCount}
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              SKUs where Available ≤ Lead Time Demand + Safety
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              Current Seasonal Index
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-[#6A2CFF] flex items-baseline gap-2">
              <span>{forecasts[0]?.currentSeasonalMultiplier || 1.0}x</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#6A2CFF]/10 text-[#6A2CFF]">
                Active Multiplier
              </span>
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Apparel & gifting peak demand weighting
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              Average Mill Lead Time
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-[#15101F]">
              7.5 <span className="text-sm font-normal">days</span>
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Tirupur & Surat textile mill dispatch SLA
            </div>
          </div>
        </div>

        {/* Forecast Table */}
        <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#15101F]/10 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#15101F]">
                Raw Blank Stock & Demand Forecast Matrix
              </h3>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Lead Time Demand = Daily Velocity × Supplier Lead Time Days. Reorder Trigger = Lead Time Demand + Safety Stock.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                <tr>
                  <th className="p-4">SKU / Item</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4 text-right">Available Stock</th>
                  <th className="p-4 text-right">Velocity (4w/8w)</th>
                  <th className="p-4 text-right">30d Demand</th>
                  <th className="p-4 text-right">Runout Days</th>
                  <th className="p-4 text-right">Reorder Point</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Suggested PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15101F]/10">
                {forecasts.map((f) => (
                  <tr
                    key={f.sku}
                    className={`hover:bg-[#FAF7F2]/50 transition-colors ${
                      f.needsReorder ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-sans font-bold text-sm text-[#15101F]">
                        {f.name}
                      </div>
                      <div className="text-[11px] text-[#15101F]/60">
                        {f.sku} • {f.category}
                      </div>
                    </td>
                    <td className="p-4 text-[#15101F]/70">
                      <div>{f.supplierName}</div>
                      <div className="text-[10px] text-[#15101F]/50">{f.leadTimeDays}d lead time</div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-base text-[#15101F]">{f.availableStock}</span>
                      <div className="text-[10px] text-[#15101F]/50">
                        {f.reservedQty > 0 ? `(${f.reservedQty} reserved)` : "0 reserved"}
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">
                      <div>{f.weeklyVelocity4w} /wk (4w)</div>
                      <div className="text-[10px] text-[#15101F]/50">{f.weeklyVelocity8w} /wk (8w)</div>
                    </td>
                    <td className="p-4 text-right font-bold text-[#6A2CFF]">
                      {Math.round(f.weeklyVelocity4w * 4.3 * f.currentSeasonalMultiplier)} pcs
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`font-bold ${
                          f.stockRunoutDays <= f.leadTimeDays
                            ? "text-rose-600"
                            : f.stockRunoutDays <= 30
                            ? "text-amber-700"
                            : "text-[#15101F]"
                        }`}
                      >
                        {f.stockRunoutDays} days
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-[#15101F]">{f.reorderPointUnits}</span>
                      <div className="text-[10px] text-[#15101F]/50">
                        ({f.leadTimeDemandUnits} lead + {f.safetyStockUnits} safety)
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          f.needsReorder
                            ? "bg-rose-100 text-rose-700"
                            : f.availableStock <= f.reorderLevel
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {f.needsReorder ? "REORDER NOW" : "HEALTHY"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {f.needsReorder ? (
                        <span className="font-mono font-black text-rose-700 text-sm">
                          +{f.suggestedReorderQty} pcs
                        </span>
                      ) : (
                        <span className="text-[#15101F]/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Edit Seasonal Multipliers */}
        {showSeasonModal && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#15101F]/15 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#15101F]/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#15101F]">
                    Monthly Seasonal Multipliers
                  </h3>
                  <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                    Tune corporate demand multipliers (e.g. 2.2x for Diwali, 2.0x for April hiring)
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {seasonalIndices.map((idx) => (
                  <div
                    key={idx.month}
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-[#15101F]">{idx.name}</span>
                      <div className="text-[10px] text-[#15101F]/60">{idx.notes}</div>
                    </div>
                    <span className="font-bold px-2.5 py-1 rounded-lg bg-white border border-[#15101F]/10 text-[#6A2CFF]">
                      {idx.multiplier}x
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveMultiplier} className="space-y-4 pt-3 border-t border-[#15101F]/10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                      Select Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        const m = parseInt(e.target.value, 10);
                        setSelectedMonth(m);
                        const found = seasonalIndices.find((idx) => idx.month === m);
                        if (found) setSelectedMultiplier(found.multiplier.toString());
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                    >
                      {seasonalIndices.map((idx) => (
                        <option key={idx.month} value={idx.month}>
                          {idx.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                      Demand Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="5.0"
                      value={selectedMultiplier}
                      onChange={(e) => setSelectedMultiplier(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSeasonModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-[#15101F]/60 hover:text-[#15101F]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingMultiplier}
                    className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors"
                  >
                    {savingMultiplier ? "Saving..." : "Update Multiplier"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}