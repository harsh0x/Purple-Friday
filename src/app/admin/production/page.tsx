"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Factory,
  Printer,
  ShieldCheck,
  CheckSquare,
  Square,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderSlaBadge } from "@/components/admin/OrderSlaBadge";

interface ProductionOrderItem {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  city: string;
  productName: string;
  printMethod: string;
  qty: number;
  sizeBreakdown?: Record<string, number> | null;
  pantone?: string;
  slaDueAt?: string | null;
  isOverdue: boolean;
  hoursRemaining?: number | null;
  isPaused: boolean;
  version: number;
}

export default function FactoryProductionQueuePage() {
  const [orders, setOrders] = useState<ProductionOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderNums, setSelectedOrderNums] = useState<string[]>([]);
  const [batchActionRunning, setBatchActionRunning] = useState(false);

  const fetchProductionQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders in production workflow: CUSTOMER_APPROVED, IN_PRINTING, QC_PASSED
      const res = await fetch("/api/admin/orders?pageSize=100");
      const data = await res.json();

      const productionStatuses = ["CUSTOMER_APPROVED", "IN_PRINTING", "QC_PASSED"];
      const active = (data.orders || []).filter((o: { status: string }) =>
        productionStatuses.includes(o.status)
      );

      // Fetch detail for each to extract print methods and sizes
      const detailed = await Promise.all(
        active.map(async (o: { orderNumber: string; isOverdue: boolean; hoursRemaining?: number | null; isPaused: boolean }) => {
          try {
            const detailRes = await fetch(`/api/admin/orders/${o.orderNumber}`);
            const detailData = await detailRes.json();
            const ord = detailData.order;
            const it = ord.items[0] || {};
            const opts = (it.options || {}) as Record<string, unknown>;

            return {
              id: ord.id,
              orderNumber: ord.orderNumber,
              status: ord.status,
              customerName: ord.customerName,
              city: ord.shippingAddress?.city || "India",
              productName: it.productId?.replace(/-/g, " ")?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Merchandise",
              printMethod: it.printMethod || "DTF",
              qty: it.qty || ord.itemCount || 0,
              sizeBreakdown: opts.sizeBreakdown as Record<string, number> | null,
              pantone: it.placement?.pantone as string | undefined,
              slaDueAt: ord.slaDueAt,
              isOverdue: o.isOverdue,
              hoursRemaining: o.hoursRemaining,
              isPaused: o.isPaused,
              version: ord.version,
            };
          } catch {
            return null;
          }
        })
      );

      setOrders(detailed.filter(Boolean) as ProductionOrderItem[]);
    } catch {
      toast.error("Failed to load production queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductionQueue();
  }, [fetchProductionQueue]);

  // Group orders by print method
  const groupedByMethod = orders.reduce<Record<string, ProductionOrderItem[]>>((acc, ord) => {
    const method = ord.printMethod || "DTF";
    if (!acc[method]) acc[method] = [];
    acc[method].push(ord);
    return acc;
  }, {});

  const toggleSelect = (num: string) => {
    setSelectedOrderNums((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const handleBatchTransition = async (targetStatus: "IN_PRINTING" | "QC_PASSED") => {
    if (selectedOrderNums.length === 0) return;

    setBatchActionRunning(true);
    let successCount = 0;

    for (const num of selectedOrderNums) {
      const order = orders.find((o) => o.orderNumber === num);
      if (!order) continue;

      try {
        const res = await fetch(`/api/admin/orders/${num}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: targetStatus,
            expectedVersion: order.version,
          }),
        });

        if (res.ok) successCount++;
      } catch {
        // Continue loop
      }
    }

    setBatchActionRunning(false);
    setSelectedOrderNums([]);
    toast.success(`Updated ${successCount} order(s) to ${targetStatus}`);
    fetchProductionQueue();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Global Batch Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2.5">
            <Factory className="w-6 h-6 text-[#6A2CFF]" />
            <span>Factory Production Queue</span>
          </h1>
          <p className="text-sm text-[#4A4358] dark:text-[#CDB8FF]/70 mt-1">
            Grouped by print method for high-efficiency batch printing runs and QC sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrderNums.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <button
                type="button"
                onClick={() => handleBatchTransition("IN_PRINTING")}
                disabled={batchActionRunning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Mark Selected IN_PRINTING ({selectedOrderNums.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchTransition("QC_PASSED")}
                disabled={batchActionRunning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mark Selected QC_PASSED ({selectedOrderNums.length})</span>
              </button>
            </div>
          )}

          <button
            onClick={fetchProductionQueue}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white text-zinc-700 dark:text-zinc-200 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#6A2CFF] mb-2" />
          <p className="text-sm">Aggregating factory production batches...</p>
        </div>
      ) : Object.keys(groupedByMethod).length === 0 ? (
        <div className="p-12 rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md text-center space-y-3">
          <Factory className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8]">Production Floor Idle</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No approved customer orders are waiting for printing or QC inspection.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMethod).map(([methodName, methodOrders]) => {
            const batchUnits = methodOrders.reduce((sum, o) => sum + o.qty, 0);
            return (
              <div
                key={methodName}
                className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-sm"
              >
                {/* Method Batch Header */}
                <div className="px-5 py-3.5 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#6A2CFF]" />
                    <h2 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] uppercase font-mono tracking-wider">
                      {methodName} Batch Run
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                    <span>{methodOrders.length} Order(s)</span>
                    <span>•</span>
                    <span className="font-bold text-[#6A2CFF] dark:text-[#CDB8FF]">{batchUnits} Units Total</span>
                  </div>
                </div>

                {/* Orders List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-200/60 dark:border-white/5 bg-zinc-50/30 dark:bg-white/5 text-[#8A829E] uppercase font-mono tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 w-10 text-center">Select</th>
                        <th className="py-2.5 px-4">Order #</th>
                        <th className="py-2.5 px-4">Customer</th>
                        <th className="py-2.5 px-4">Product / Breakdown</th>
                        <th className="py-2.5 px-4">Qty</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Dispatch SLA</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 text-[#15101F] dark:text-[#F5F0E8]">
                      {methodOrders.map((o) => {
                        const isSelected = selectedOrderNums.includes(o.orderNumber);
                        return (
                          <tr
                            key={o.id}
                            className={`hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors ${
                              isSelected ? "bg-[#6A2CFF]/5 dark:bg-[#6A2CFF]/10" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => toggleSelect(o.orderNumber)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#6A2CFF]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold">
                              <Link
                                href={`/admin/orders/${o.orderNumber}`}
                                className="text-[#6A2CFF] dark:text-[#CDB8FF] hover:underline"
                              >
                                {o.orderNumber}
                              </Link>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold">{o.customerName}</div>
                              <div className="text-[11px] text-[#8A829E]">{o.city}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{o.productName}</div>
                              {o.sizeBreakdown && (
                                <div className="text-[11px] font-mono text-[#8A829E] mt-0.5">
                                  {Object.entries(o.sizeBreakdown)
                                    .map(([sz, q]) => `${sz}:${q}`)
                                    .join(" • ")}
                                </div>
                              )}
                              {o.pantone && (
                                <div className="text-[10px] font-mono text-[#6A2CFF] mt-0.5">
                                  PMS: {o.pantone}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold">{o.qty} pcs</td>
                            <td className="py-3 px-4">
                              <OrderStatusBadge status={o.status} size="sm" />
                            </td>
                            <td className="py-3 px-4">
                              <OrderSlaBadge
                                status={o.status}
                                isOverdue={o.isOverdue}
                                hoursRemaining={o.hoursRemaining}
                                isPaused={o.isPaused}
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`/api/admin/orders/${o.orderNumber}/jobsheet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-white/10 hover:border-[#6A2CFF]/40 text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                  title="Download Job Sheet PDF"
                                >
                                  <Printer className="w-3 h-3 text-[#6A2CFF]" />
                                  <span>Job Sheet</span>
                                </a>

                                <Link
                                  href={`/admin/orders/${o.orderNumber}`}
                                  className="p-1 rounded-lg border border-zinc-200 dark:border-white/10 hover:border-[#6A2CFF]/40 text-zinc-400 hover:text-[#6A2CFF] transition-all"
                                  title="View Order"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
