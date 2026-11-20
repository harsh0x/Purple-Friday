"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  AlertTriangle,
  Search,
  Filter,
  History,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BlankSkuData, StockMovementData } from "@/server/inventory/inventory-service";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<BlankSkuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Quick Adjust Modal State
  const [selectedSku, setSelectedSku] = useState<BlankSkuData | null>(null);
  const [adjustReason, setAdjustReason] = useState<"PURCHASE" | "ADJUSTMENT" | "RETURN">("PURCHASE");
  const [adjustType, setAdjustType] = useState<"delta" | "absolute">("delta");
  const [adjustValue, setAdjustValue] = useState("50");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // History Drawer State
  const [historySku, setHistorySku] = useState<BlankSkuData | null>(null);
  const [movements, setMovements] = useState<StockMovementData[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (lowStockOnly) params.set("lowStockOnly", "true");

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.inventory) {
        setInventory(data.inventory);
      }
    } catch {
      toast.error("Failed to load blank inventory");
    } finally {
      setLoading(false);
    }
  }, [search, category, lowStockOnly]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const openAdjustModal = (sku: BlankSkuData) => {
    setSelectedSku(sku);
    setAdjustType("delta");
    setAdjustValue("50");
    setAdjustReason("PURCHASE");
    setAdjustNotes("");
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku) return;

    setAdjusting(true);
    try {
      const num = parseInt(adjustValue, 10);
      if (isNaN(num)) {
        toast.error("Please enter a valid number");
        return;
      }

      const payload = {
        skuId: selectedSku.id,
        reason: adjustReason,
        notes: adjustNotes,
        expectedVersion: selectedSku.version,
        ...(adjustType === "absolute" ? { newStockOnHand: num } : { delta: num }),
      };

      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Inventory updated for ${selectedSku.sku}`);
        setSelectedSku(null);
        loadInventory();
      } else {
        toast.error(data.error || "Failed to adjust inventory");
      }
    } catch {
      toast.error("Network error while adjusting inventory");
    } finally {
      setAdjusting(false);
    }
  };

  const openHistoryModal = async (sku: BlankSkuData) => {
    setHistorySku(sku);
    try {
      setLoadingMovements(true);
      const res = await fetch(`/api/admin/inventory/${sku.id}/movements`);
      const data = await res.json();
      if (data.movements) {
        setMovements(data.movements);
      }
    } catch {
      toast.error("Failed to load stock movements");
    } finally {
      setLoadingMovements(false);
    }
  };

  // KPI Calculations
  const totalSkus = inventory.length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const totalStockOnHand = inventory.reduce((acc, i) => acc + i.stockOnHand, 0);
  const totalReserved = inventory.reduce((acc, i) => acc + i.reservedQty, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              Raw Blanks Inventory
            </h1>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-1">
            Real-time warehouse blanks tracking, automated order reservations, and audited stock movement ledger
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-sm">
          <span className="text-[11px] font-mono uppercase text-ink/50">Total Blank SKUs</span>
          <p className="font-display font-bold text-2xl text-ink mt-1">{totalSkus}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-sm">
          <span className="text-[11px] font-mono uppercase text-ink/50">Low-Stock Alerts</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-display font-bold text-2xl text-rose-600">{lowStockCount}</p>
            {lowStockCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 font-bold border border-rose-500/20">
                Action Req.
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-sm">
          <span className="text-[11px] font-mono uppercase text-ink/50">Total Blanks On Hand</span>
          <p className="font-display font-bold text-2xl text-ink mt-1">{totalStockOnHand.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-ink/10 shadow-sm">
          <span className="text-[11px] font-mono uppercase text-ink/50">Reserved in Production</span>
          <p className="font-display font-bold text-2xl text-violet mt-1">{totalReserved.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
          <input
            type="text"
            placeholder="Search SKU code, name, or mill supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-paper/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-ink/60">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
          >
            <option value="all">All Categories</option>
            <option value="polo-shirts">Polo Shirts</option>
            <option value="t-shirts">T-Shirts</option>
            <option value="hoodies">Hoodies</option>
            <option value="magnetic-badges">Magnetic Badges</option>
            <option value="caps">Caps</option>
            <option value="corporate-gifts">Corporate Gifts</option>
          </select>

          <label
            className={`flex items-center gap-2 cursor-pointer text-xs font-mono px-3 py-1.5 rounded-xl border transition-colors ${
              lowStockOnly
                ? "bg-rose-500/10 border-rose-500/30 text-rose-800 font-bold"
                : "border-ink/10 text-ink/70 hover:bg-paper/50"
            }`}
          >
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10 bg-paper/40 text-[11px] font-mono uppercase tracking-wider text-ink/60">
                <th className="py-3 px-4">Blank SKU</th>
                <th className="py-3 px-3">Category & Spec</th>
                <th className="py-3 px-3 text-right">On Hand</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-right">Available</th>
                <th className="py-3 px-3">Reorder Point</th>
                <th className="py-3 px-3">Supplier & Lead</th>
                <th className="py-3 px-3 text-right">Cost (INR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink/40">
                    Loading warehouse inventory...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink/40">
                    No blank SKUs match current filters.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-paper/20 transition-colors ${
                      item.isLowStock ? "bg-rose-500/5" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-ink">{item.sku}</span>
                        <span className="text-[11px] text-ink/60 truncate max-w-[200px]">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-ink/80">{item.category}</span>
                        <span className="text-ink/50">
                          {item.color} {item.size ? `• Size ${item.size}` : ""}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold">
                      <span
                        className={
                          item.isLowStock
                            ? "px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20"
                            : "text-ink"
                        }
                      >
                        {item.stockOnHand}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right text-violet">
                      {item.reservedQty}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-ink">
                      {item.availableQty}
                    </td>

                    <td className="py-3.5 px-3 text-ink/70">
                      ≤ {item.reorderLevel} pcs
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-ink/80">{item.supplierName}</span>
                        <span className="text-ink/50">{item.leadTimeDays} days lead</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right text-ink/80">
                      ₹{(item.unitCostPaise / 100).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAdjustModal(item)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-violet text-white rounded-lg hover:bg-violet-hover transition-colors"
                        >
                          Quick Adjust
                        </button>

                        <button
                          type="button"
                          onClick={() => openHistoryModal(item)}
                          title="View Stock Movement Ledger"
                          className="p-1.5 text-ink/50 hover:text-ink hover:bg-paper rounded-lg transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Adjust Modal */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-ink/10 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Adjust Inventory
                </h3>
                <p className="text-xs font-mono text-ink/50 mt-0.5">
                  {selectedSku.sku} • Current: {selectedSku.stockOnHand} pcs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSku(null)}
                className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-ink/70 mb-1">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as "PURCHASE" | "ADJUSTMENT" | "RETURN")}
                  className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                >
                  <option value="PURCHASE">Purchase Receipt (Supplier delivery)</option>
                  <option value="ADJUSTMENT">Physical Count Adjustment (Audit discrepancy)</option>
                  <option value="RETURN">Customer Return / Restock</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("delta")}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                    adjustType === "delta"
                      ? "bg-violet/10 border-violet text-violet font-bold"
                      : "border-ink/10 text-ink/60 hover:bg-paper"
                  }`}
                >
                  Relative (+/- Change)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("absolute")}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                    adjustType === "absolute"
                      ? "bg-violet/10 border-violet text-violet font-bold"
                      : "border-ink/10 text-ink/60 hover:bg-paper"
                  }`}
                >
                  Exact New Count
                </button>
              </div>

              <div>
                <label className="block text-ink/70 mb-1">
                  {adjustType === "delta" ? "Quantity to Add / Deduct" : "Exact Physical Stock On Hand"}
                </label>
                <input
                  type="number"
                  required
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  placeholder={adjustType === "delta" ? "+50 or -10" : "150"}
                  className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-ink/70 mb-1">Notes / PO Reference *</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. PO-8842 from Apex Merch Mills"
                  className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setSelectedSku(null)}
                  className="px-4 py-2 border border-ink/10 rounded-xl text-ink/60 hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 bg-violet text-white rounded-xl hover:bg-violet-hover disabled:opacity-50"
                >
                  {adjusting ? "Updating..." : "Confirm & Record Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Modal */}
      {historySku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-ink/10 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Stock Movements Ledger
                </h3>
                <p className="text-xs font-mono text-ink/50 mt-0.5">
                  Audit trail for {historySku.sku} ({historySku.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistorySku(null)}
                className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingMovements ? (
                <div className="p-8 text-center text-xs font-mono text-ink/40">
                  Loading movement ledger...
                </div>
              ) : movements.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-ink/40">
                  No stock movements recorded yet.
                </div>
              ) : (
                movements.map((m) => {
                  const isPositive = m.changeQty > 0;
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-ink/10 bg-paper/20 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`p-1.5 rounded-lg ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-rose-500/10 text-rose-700"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </span>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{m.reason}</span>
                            <span className="text-[10px] text-ink/40">
                              {new Date(m.createdAt).toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink/60 mt-0.5">
                            {m.notes} • By: {m.actor || "System"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            isPositive ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isPositive ? `+${m.changeQty}` : m.changeQty} pcs
                        </span>
                        <p className="text-[10px] text-ink/40">Bal: {m.balanceAfter}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
