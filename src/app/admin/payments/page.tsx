"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  totalPaise: number;
  paymentMethod: string;
  paymentStatus: string;
  advancePaidPaise: number;
  balanceDuePaise: number;
  balanceCollectedAt?: string;
  balanceCollectedBy?: string;
  createdAt: string;
}

interface RefundItem {
  id: string;
  orderNumber: string;
  refundNumber: string;
  amountPaise: number;
  reason: string;
  type: string;
  reference?: string;
  status: string;
  processedBy: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "COD_DUE" | "REFUNDS">("ALL");
  const [search, setSearch] = useState("");

  // Modal 1: Collect Balance
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [collectNotes, setCollectNotes] = useState("Courier settlement verified");
  const [submittingCollect, setSubmittingCollect] = useState(false);

  // Modal 2: Refund
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmountRupees, setRefundAmountRupees] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setRefunds(data.refunds || []);
      }
    } catch {
      toast.error("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenCollect = (o: PaymentOrder) => {
    setSelectedOrder(o);
    setCollectNotes("Courier settlement cash received");
    setCollectModalOpen(true);
  };

  const handleConfirmCollect = async () => {
    if (!selectedOrder) return;
    setSubmittingCollect(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.orderNumber}/collect-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: collectNotes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record collection");
      }

      toast.success(`Balance for ${selectedOrder.orderNumber} marked as collected!`);
      setCollectModalOpen(false);
      fetchPayments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to mark balance collected";
      toast.error(msg);
    } finally {
      setSubmittingCollect(false);
    }
  };

  const handleOpenRefund = (o: PaymentOrder) => {
    setSelectedOrder(o);
    setRefundAmountRupees(o.total.toString());
    setRefundReason("Order cancellation requested by customer");
    setRefundModalOpen(true);
  };

  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;
    const amountVal = parseFloat(refundAmountRupees);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    setSubmittingRefund(true);
    try {
      const idempotencyKey = `ref_req_${selectedOrder.orderNumber}_${Date.now()}`;
      const res = await fetch(`/api/admin/orders/${selectedOrder.orderNumber}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise: Math.round(amountVal * 100),
          reason: refundReason,
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process refund");
      }

      toast.success(`Refund of Rs ${amountVal} processed successfully!`);
      setRefundModalOpen(false);
      fetchPayments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process refund";
      toast.error(msg);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const totalCollectedRupees = orders
    .filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "ADVANCE_PAID")
    .reduce((sum, o) => sum + (o.advancePaidPaise ? o.advancePaidPaise / 100 : o.total), 0);

  const totalCodDueRupees = orders
    .filter((o) => o.balanceDuePaise > 0 && o.paymentStatus !== "PAID")
    .reduce((sum, o) => sum + o.balanceDuePaise / 100, 0);

  const totalRefundedRupees = refunds.reduce((sum, r) => sum + r.amountPaise / 100, 0);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "COD_DUE") {
      return matchesSearch && o.balanceDuePaise > 0 && o.paymentStatus !== "PAID";
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-paper dark:bg-ink/40 border border-ink/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-bricolage text-ink dark:text-paper">
              Payments & Settlement Ledger
            </h1>
          </div>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Monitor partial COD advances, courier delivery settlements, Razorpay payouts, and role-guarded refunds.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="p-2 rounded-xl border border-ink/15 hover:bg-ink/5 text-ink transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-paper dark:bg-ink/40 border border-ink/10 shadow-sm space-y-1">
          <div className="text-xs font-mono uppercase text-ink/60">Total Advance & Online Paid</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
            ₹{totalCollectedRupees.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-ink/50">Verified via Razorpay UPI & Cards</div>
        </div>

        <div className="p-5 rounded-2xl bg-paper dark:bg-ink/40 border border-ink/10 shadow-sm space-y-1">
          <div className="text-xs font-mono uppercase text-ink/60">COD Balance Due on Delivery</div>
          <div className="text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-400">
            ₹{totalCodDueRupees.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-ink/50">Collectable by couriers upon dispatch</div>
        </div>

        <div className="p-5 rounded-2xl bg-paper dark:bg-ink/40 border border-ink/10 shadow-sm space-y-1">
          <div className="text-xs font-mono uppercase text-ink/60">Total Refunds Processed</div>
          <div className="text-2xl font-extrabold font-mono text-rose-700 dark:text-rose-400">
            ₹{totalRefundedRupees.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-ink/50">Audited with role limits</div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-ink/5 border border-ink/10">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "ALL" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("COD_DUE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "COD_DUE" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            COD Due ({orders.filter((o) => o.balanceDuePaise > 0 && o.paymentStatus !== "PAID").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REFUNDS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "REFUNDS" ? "bg-white text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            Refunds Ledger ({refunds.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-ink/15 bg-paper dark:bg-ink/20 focus:outline-none focus:ring-2 focus:ring-violet/30"
          />
        </div>
      </div>

      {/* Data Table */}
      {activeTab === "REFUNDS" ? (
        <div className="rounded-2xl border border-ink/10 bg-paper dark:bg-ink/30 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink/5 dark:bg-ink/40 border-b border-ink/10 font-mono text-[11px] text-ink/60">
              <tr>
                <th className="py-3 px-4">REFUND REF</th>
                <th className="py-3 px-4">ORDER NUMBER</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">TYPE & GATEWAY ID</th>
                <th className="py-3 px-4">REASON</th>
                <th className="py-3 px-4">PROCESSED BY</th>
                <th className="py-3 px-4">DATE (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/40">
                    Loading refunds data...
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/40">
                    No refunds processed.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-ink/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink dark:text-paper">{r.refundNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-violet font-semibold">{r.orderNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      ₹{Math.round(r.amountPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-ink">{r.type}</span>
                      <div className="text-[10px] font-mono text-ink/50">{r.reference || "N/A"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-ink/70 max-w-xs truncate">{r.reason}</td>
                    <td className="py-3.5 px-4 text-ink/80">{r.processedBy}</td>
                    <td className="py-3.5 px-4 text-ink/60 font-mono">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/10 bg-paper dark:bg-ink/30 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink/5 dark:bg-ink/40 border-b border-ink/10 font-mono text-[11px] text-ink/60">
              <tr>
                <th className="py-3 px-4">ORDER REF</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">METHOD</th>
                <th className="py-3 px-4">TOTAL</th>
                <th className="py-3 px-4">ADVANCE ONLINE</th>
                <th className="py-3 px-4">BALANCE DUE (COD)</th>
                <th className="py-3 px-4">PAYMENT STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink/40">
                    No matching payment records.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const advance = o.advancePaidPaise ? Math.round(o.advancePaidPaise / 100) : 0;
                  const balanceDue = o.balanceDuePaise ? Math.round(o.balanceDuePaise / 100) : 0;

                  return (
                    <tr key={o.id} className="hover:bg-ink/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <Link
                          href={`/admin/orders/${o.orderNumber}`}
                          className="text-violet hover:underline inline-flex items-center gap-1"
                        >
                          {o.orderNumber}
                          <ExternalLink className="w-3 h-3 text-ink/40" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-ink dark:text-paper">{o.customerName}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-ink/5 border border-ink/10">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-ink dark:text-paper">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700">
                        {advance > 0 ? `₹${advance.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {balanceDue > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                            COLLECT ₹{balanceDue.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-ink/40">₹0 (Paid)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : o.paymentStatus === "ADVANCE_PAID"
                                ? "bg-violet/10 text-violet border border-violet/20"
                                : o.paymentStatus === "REFUNDED"
                                  ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                  : "bg-ink/5 text-ink/60 border border-ink/10"
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {balanceDue > 0 && o.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => handleOpenCollect(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Collected</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenRefund(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          <span>Refund</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Mark Balance Collected */}
      {collectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-paper dark:bg-ink p-6 border border-ink/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-bold font-bricolage text-base text-ink dark:text-paper">
                Mark Balance Collected • {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setCollectModalOpen(false)} className="text-ink/40 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 space-y-1">
                <div className="font-bold">COD Balance Due: ₹{Math.round(selectedOrder.balanceDuePaise / 100)}</div>
                <div>Confirming this action marks the order as fully PAID and records an immutable audit trail.</div>
              </div>

              <div>
                <label className="block text-ink/60 mb-1 font-mono uppercase text-[10px]">
                  Settlement Verification Note
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-white dark:bg-ink/40 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-ink/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCollectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-ink/15 text-xs text-ink/70 hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollect}
                disabled={submittingCollect}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {submittingCollect ? "Saving..." : "Confirm Settlement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Process Refund */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-paper dark:bg-ink p-6 border border-ink/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-bold font-bricolage text-base text-ink dark:text-paper">
                Process Refund • {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-ink/40 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink/60 mb-1 font-mono uppercase text-[10px]">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  value={refundAmountRupees}
                  onChange={(e) => setRefundAmountRupees(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-white dark:bg-ink/40 font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-ink/50">Maximum refundable: ₹{selectedOrder.total}</span>
              </div>

              <div>
                <label className="block text-ink/60 mb-1 font-mono uppercase text-[10px]">
                  Refund Justification Reason (Required)
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="State the customer request or cancellation justification..."
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-white dark:bg-ink/40 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-ink/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-ink/15 text-xs text-ink/70 hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={submittingRefund}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {submittingRefund ? "Processing..." : "Authorize Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
