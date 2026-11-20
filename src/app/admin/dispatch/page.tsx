"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  Download,
  Upload,
  Split,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { RtoRiskBadge } from "@/components/admin/RtoRiskBadge";

interface QcOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  city: string;
  state: string;
  pin: string;
  totalQty: number;
  paymentMethod: string;
  paymentStatus: string;
  balanceDuePaise?: number;
  rtoRiskScore?: number;
  shipmentCount: number;
  items: Array<{ name: string; qty: number; template: string }>;
  version: number;
}

interface SplitPreviewRow {
  rowNumber: number;
  data: {
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    quantity: number;
    notes?: string;
  };
  valid: boolean;
  errors: string[];
}

export default function AdminDispatchPage() {
  const [orders, setOrders] = useState<QcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<QcOrder | null>(null);

  // Single Shipment Modal
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [courierName, setCourierName] = useState("DTDC Express");
  const [customAwb, setCustomAwb] = useState("");
  const [providerType, setProviderType] = useState<"MANUAL" | "SHIPROCKET">("MANUAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split Modal
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [validatingCsv, setValidatingCsv] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    totalRows: number;
    validRowsCount: number;
    invalidRowsCount: number;
    totalQuantityInCsv: number;
    expectedOrderQuantity: number;
    quantityMatches: boolean;
    canExecute: boolean;
    rows: SplitPreviewRow[];
  } | null>(null);
  const [executingSplit, setExecutingSplit] = useState(false);
  const [splitProgress, setSplitProgress] = useState<{ current: number; total: number } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders?status=QC_PASSED");
      if (res.ok) {
        const data = await res.json();
        const mapped: QcOrder[] = (data.orders || []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          orderNumber: o.orderNumber as string,
          customerName: o.customerName as string,
          customerPhone: o.customerPhone as string | undefined,
          city: ((o.shippingAddress as Record<string, unknown>)?.city as string) || "Bengaluru",
          state: ((o.shippingAddress as Record<string, unknown>)?.state as string) || "Karnataka",
          pin: ((o.shippingAddress as Record<string, unknown>)?.pin as string) || "560038",
          totalQty: (o.itemCount as number) || 10,
          paymentMethod: (o.paymentMethod as string) || "RAZORPAY",
          paymentStatus: (o.paymentStatus as string) || "PAID",
          balanceDuePaise: (o.balanceDuePaise as number) || 0,
          rtoRiskScore: (o.rtoRiskScore as number) || 0,
          shipmentCount: (o.shipmentCount as number) || 0,
          items: ((o.productNames as string[]) || []).map((n: string) => ({ name: n, qty: 10, template: "tee" })),
          version: (o.version as number) || 1,
        }));
        setOrders(mapped);
      }
    } catch {
      toast.error("Failed to load dispatch queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenSingleModal = (order: QcOrder) => {
    setSelectedOrder(order);
    setCourierName("BlueDart Air");
    setCustomAwb(`BLU-${order.pin}-${Math.floor(100000 + Math.random() * 900000)}`);
    setSingleModalOpen(true);
  };

  const handleCreateSingleShipment = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.orderNumber}/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: selectedOrder.customerName,
          recipientPhone: selectedOrder.customerPhone || "9876543210",
          addressLine: `Consignee Address in ${selectedOrder.city}`,
          city: selectedOrder.city,
          state: selectedOrder.state,
          pincode: selectedOrder.pin,
          items: [{ name: "Order Merchandise Batch", qty: selectedOrder.totalQty }],
          courierName,
          awb: customAwb,
          providerName: providerType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create shipment");
      }

      const data = await res.json();
      toast.success(`Shipment manifested: AWB ${data.shipment.awb}`);
      setSingleModalOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create shipment";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSplitModal = (order: QcOrder) => {
    setSelectedOrder(order);
    setValidationResult(null);
    setSplitProgress(null);
    setSplitModalOpen(true);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      await validateCsvContent(content);
    };
    reader.readAsText(file);
  };

  const validateCsvContent = async (text: string) => {
    if (!selectedOrder) return;
    setValidatingCsv(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.orderNumber}/split-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "CSV validation failed");
      }

      const data = await res.json();
      setValidationResult(data.validation);
      if (data.validation.canExecute) {
        toast.success(`CSV valid! ${data.validation.validRowsCount} recipients match order quantity.`);
      } else {
        toast.warning(`CSV has validation issues: ${data.validation.invalidRowsCount} error(s).`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CSV validation failed";
      toast.error(msg);
      setValidationResult(null);
    } finally {
      setValidatingCsv(false);
    }
  };

  const handleExecuteSplit = async () => {
    if (!selectedOrder || !validationResult || !validationResult.canExecute) return;
    setExecutingSplit(true);
    setSplitProgress({ current: 0, total: validationResult.validRowsCount });

    try {
      const validRows = validationResult.rows.map((r) => r.data);
      const res = await fetch(`/api/admin/orders/${selectedOrder.orderNumber}/split-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows,
          providerName: providerType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Split execution failed");
      }

      const data = await res.json();
      toast.success(`Successfully dispatched ${data.data.createdCount} recipient shipments!`);
      setSplitModalOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Split execution failed";
      toast.error(msg);
    } finally {
      setExecutingSplit(false);
      setSplitProgress(null);
    }
  };

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.city.toLowerCase().includes(search.toLowerCase()) ||
    o.pin.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-paper dark:bg-ink/40 border border-ink/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-bricolage text-ink dark:text-paper">
              Fulfillment & Dispatch Queue
            </h1>
          </div>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Orders that passed Quality Control (QC_PASSED) ready for packaging, label printing, and courier dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/dispatch/template"
            download="purple-friday-split-dispatch-template.csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-ink/60 border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
          >
            <Download className="w-4 h-4 text-violet" />
            <span>Download CSV Template</span>
          </a>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-ink/15 hover:bg-ink/5 text-ink transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search by order #, customer, city, or PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-ink/15 bg-paper dark:bg-ink/20 focus:outline-none focus:ring-2 focus:ring-violet/30"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-ink/60">
          <span>Ready to Dispatch: <strong className="text-ink font-bold">{orders.length}</strong> orders</span>
          <span>•</span>
          <span>Total Units: <strong className="text-ink font-bold">{orders.reduce((acc, o) => acc + o.totalQty, 0)}</strong> pcs</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-ink/10 bg-paper dark:bg-ink/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink/5 dark:bg-ink/40 border-b border-ink/10 font-mono text-[11px] text-ink/60">
              <tr>
                <th className="py-3 px-4">ORDER REF</th>
                <th className="py-3 px-4">CONSIGNEE & DESTINATION</th>
                <th className="py-3 px-4">ITEMS / RUN</th>
                <th className="py-3 px-4">PAYMENT / COD</th>
                <th className="py-3 px-4">RTO RISK</th>
                <th className="py-3 px-4 text-right">DISPATCH ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink/40">
                    Loading QC queue...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink/40">
                    No orders currently waiting in QC_PASSED.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCod = order.paymentMethod === "COD" || (order.balanceDuePaise || 0) > 0;
                  const balanceDue = order.balanceDuePaise ? Math.round(order.balanceDuePaise / 100) : 0;

                  return (
                    <tr key={order.id} className="hover:bg-ink/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="text-violet hover:underline inline-flex items-center gap-1"
                        >
                          {order.orderNumber}
                          <ExternalLink className="w-3 h-3 text-ink/40" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink dark:text-paper">{order.customerName}</div>
                        <div className="text-[11px] text-ink/60">
                          {order.city}, {order.state} - <span className="font-mono">{order.pin}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-ink dark:text-paper">{order.totalQty} units</div>
                        <div className="text-[11px] text-ink/60 truncate max-w-xs">
                          {order.items.map((it) => it.name).join(", ") || "Custom Apparel"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isCod && balanceDue > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                            COLLECT Rs {balanceDue}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            Prepaid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <RtoRiskBadge score={order.rtoRiskScore} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSingleModal(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet text-white hover:bg-violet/90 transition-colors shadow-sm"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Dispatch Single</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenSplitModal(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-ink/60 border border-ink/20 text-ink hover:bg-ink/5 transition-colors"
                          title="Multi-address split dispatch via CSV"
                        >
                          <Split className="w-3.5 h-3.5 text-violet" />
                          <span>Split CSV</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Single Shipment Creation */}
      {singleModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-paper dark:bg-ink p-6 border border-ink/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-violet" />
                <h3 className="font-bold font-bricolage text-lg text-ink dark:text-paper">
                  Create Shipment • {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSingleModalOpen(false)}
                className="text-ink/40 hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink/60 mb-1 font-mono uppercase text-[10px]">
                  Shipping Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProviderType("MANUAL")}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      providerType === "MANUAL"
                        ? "bg-violet/10 border-violet text-violet"
                        : "border-ink/15 text-ink/60 hover:bg-ink/5"
                    }`}
                  >
                    <div>Manual Provider</div>
                    <div className="text-[10px] font-normal opacity-80">Local / DTDC / Self Courier</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderType("SHIPROCKET")}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      providerType === "SHIPROCKET"
                        ? "bg-violet/10 border-violet text-violet"
                        : "border-ink/15 text-ink/60 hover:bg-ink/5"
                    }`}
                  >
                    <div>Shiprocket API</div>
                    <div className="text-[10px] font-normal opacity-80">Automated AWB & Pickup</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-ink/60 mb-1 font-mono uppercase text-[10px]">
                  Courier Name
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-white dark:bg-ink/40 text-xs"
                />
              </div>

              <div>
                <label className="block text-ink/60 mb-1 font-mono uppercase text-[10px]">
                  Air Waybill (AWB) Number
                </label>
                <input
                  type="text"
                  value={customAwb}
                  onChange={(e) => setCustomAwb(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-white dark:bg-ink/40 font-mono text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-ink/5 border border-ink/10 space-y-1">
                <div className="font-semibold text-ink">Recipient Destination:</div>
                <div className="text-ink/70">
                  {selectedOrder.customerName} • {selectedOrder.city}, {selectedOrder.state} ({selectedOrder.pin})
                </div>
                {selectedOrder.balanceDuePaise && selectedOrder.balanceDuePaise > 0 ? (
                  <div className="font-bold text-amber-700 pt-1">
                    ⚠️ Collect on Delivery: Rs {Math.round(selectedOrder.balanceDuePaise / 100)}
                  </div>
                ) : (
                  <div className="font-medium text-emerald-700 pt-1">✓ Order is fully Prepaid</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setSingleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-ink/15 text-xs text-ink/70 hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSingleShipment}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-violet text-white text-xs font-semibold hover:bg-violet/90 disabled:opacity-50"
              >
                {isSubmitting ? "Generating..." : "Generate Shipment & Label"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Split / Multi-Address CSV Dispatch */}
      {splitModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-paper dark:bg-ink p-6 border border-ink/10 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <Split className="w-5 h-5 text-violet" />
                <h3 className="font-bold font-bricolage text-lg text-ink dark:text-paper">
                  Multi-Address Split Dispatch • {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSplitModalOpen(false)}
                className="text-ink/40 hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-violet/5 border border-violet/15 flex items-center justify-between">
                <div>
                  <div className="font-bold text-violet">Total Order Quantity: {selectedOrder.totalQty} Units</div>
                  <div className="text-ink/60 text-[11px]">
                    Upload a CSV file containing up to 500 employee/client home addresses. Quantities must sum to exactly {selectedOrder.totalQty}.
                  </div>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet text-white text-xs font-semibold hover:bg-violet/90 shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Validation Status Cards */}
              {validatingCsv && (
                <div className="text-center py-3 text-xs text-violet font-medium animate-pulse">
                  Validating CSV rows, phone numbers, and PIN codes...
                </div>
              )}
              {validationResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-ink/5 border border-ink/10">
                      <div className="text-[10px] font-mono text-ink/60 uppercase">Total Rows</div>
                      <div className="text-base font-bold text-ink">{validationResult.totalRows}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[10px] font-mono text-emerald-700 uppercase">Valid Rows</div>
                      <div className="text-base font-bold text-emerald-700">{validationResult.validRowsCount}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-[10px] font-mono text-rose-700 uppercase">Errors</div>
                      <div className="text-base font-bold text-rose-700">{validationResult.invalidRowsCount}</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${
                      validationResult.quantityMatches
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-700"
                    }`}>
                      <div className="text-[10px] font-mono uppercase">Quantity Sum</div>
                      <div className="text-base font-bold">
                        {validationResult.totalQuantityInCsv} / {validationResult.expectedOrderQuantity}
                      </div>
                    </div>
                  </div>

                  {/* Row by row table preview */}
                  <div className="border border-ink/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-ink/5 sticky top-0 font-mono text-ink/60">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Recipient</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">PIN</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3">Status / Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/5">
                        {validationResult.rows.map((r) => (
                          <tr
                            key={r.rowNumber}
                            className={r.valid ? "hover:bg-ink/5" : "bg-rose-500/5 text-rose-700"}
                          >
                            <td className="py-1.5 px-3 font-mono">{r.rowNumber}</td>
                            <td className="py-1.5 px-3 font-semibold">{r.data.recipientName}</td>
                            <td className="py-1.5 px-3 font-mono">{r.data.phone}</td>
                            <td className="py-1.5 px-3 font-mono">{r.data.pincode}</td>
                            <td className="py-1.5 px-3 font-bold">{r.data.quantity}</td>
                            <td className="py-1.5 px-3">
                              {r.valid ? (
                                <span className="text-emerald-600 font-medium">✓ Valid</span>
                              ) : (
                                <span className="text-rose-600 font-semibold">{r.errors.join(", ")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-ink/10">
              <div className="text-xs text-ink/60">
                {executingSplit && splitProgress && (
                  <span>Executing row {splitProgress.current} of {splitProgress.total}...</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSplitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-ink/15 text-xs text-ink/70 hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSplit}
                  disabled={!validationResult?.canExecute || executingSplit}
                  className="px-5 py-2 rounded-xl bg-violet text-white text-xs font-semibold hover:bg-violet/90 disabled:opacity-40 transition-colors shadow-sm"
                >
                  {executingSplit ? "Dispatching..." : "Confirm & Create All Shipments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
