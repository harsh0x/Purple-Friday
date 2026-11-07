"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { StoredOrder } from "@/lib/orders";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Order for Modal Actions
  const [activeOrder, setActiveOrder] = useState<StoredOrder | null>(null);
  const [modalMode, setModalMode] = useState<"STATUS" | "PROOF" | "TRACKING" | null>(null);

  // Form states for modals
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusReason, setStatusReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierService, setCourierService] = useState("DELHIVERY");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      // We can fetch via an internal helper or api
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      // Memory fallback from seed if API is pending
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Handle Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !newStatus) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${activeOrder.orderNumber}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${activeOrder.orderNumber} updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === activeOrder.orderNumber
              ? { ...o, status: newStatus as StoredOrder["status"] }
              : o
          )
        );
        setModalMode(null);
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Tracking Update
  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !trackingNumber) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${activeOrder.orderNumber}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DISPATCHED",
          trackingNumber: `${courierService}:${trackingNumber}`,
          reason: `Dispatched via ${courierService}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Tracking waybill attached for ${activeOrder.orderNumber}`);
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === activeOrder.orderNumber ? { ...o, status: "DISPATCHED" } : o
          )
        );
        setModalMode(null);
      } else {
        toast.error(data.error || "Failed to update tracking");
      }
    } catch {
      toast.error("Network error saving tracking");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Proof Upload
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !proofFile) {
      toast.error("Please select a high-resolution pre-press proof file");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("purpose", "proof");

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.upload?.url) {
        throw new Error(uploadData.error || "Proof file upload failed");
      }

      // Attach proof to order
      const proofRes = await fetch(`/api/admin/orders/${activeOrder.orderNumber}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofUrl: uploadData.upload.url,
        }),
      });

      const proofData = await proofRes.json();
      if (proofData.success) {
        toast.success(`Pre-press proof attached! Order flipped to PROOF_READY`);
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === activeOrder.orderNumber ? { ...o, status: "PROOF_READY" } : o
          )
        );
        setModalMode(null);
        setProofFile(null);
      } else {
        toast.error(proofData.error || "Failed to attach proof");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error attaching proof";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Status Styling Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "PROOF_READY":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "APPROVED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "IN_PRODUCTION":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "DISPATCHED":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "DELIVERED":
        return "bg-green-600/20 text-green-300 border-green-600/30";
      case "CHANGES_REQUESTED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-tight">
            Orders & Production Dispatch
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Track batches, generate pre-press proofs, advance shopfloor stages
          </p>
        </div>

        <a
          href="/api/admin/orders/export"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders CSV (DDE Protected)</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#181324] p-4 rounded-2xl border border-white/10">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search order number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#110D1A] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-pf-violet"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-white/40 shrink-0" />
          {[
            "ALL",
            "PAID",
            "PROOF_READY",
            "CHANGES_REQUESTED",
            "APPROVED",
            "IN_PRODUCTION",
            "DISPATCHED",
            "DELIVERED",
          ].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors shrink-0 ${statusFilter === st
                  ? "bg-pf-violet text-white font-bold"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#181324] rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#110D1A] text-white/40 uppercase border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total (INR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-white/40 font-mono">
                    {loading ? "Loading shopfloor orders..." : "No orders matching current filter."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{o.orderNumber}</div>
                      <div className="text-[10px] text-white/40 font-normal">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{o.customerName}</div>
                      <div className="text-[10px] text-white/50">{o.customerEmail}</div>
                      {o.gstin && (
                        <span className="text-[9px] text-pf-lime">GST: {o.gstin}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white/80">
                        {o.items.map((it) => `${it.qty}x ${it.productName}`).join(", ")}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {o.items.reduce((acc, it) => acc + it.qty, 0)} total pieces
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ₹{o.total.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setActiveOrder(o);
                          setNewStatus(o.status);
                          setModalMode("STATUS");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono transition-colors"
                      >
                        Advance
                      </button>

                      <button
                        onClick={() => {
                          setActiveOrder(o);
                          setModalMode("PROOF");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-pf-violet/20 hover:bg-pf-violet text-pf-violet hover:text-white border border-pf-violet/40 text-[11px] font-mono transition-colors"
                      >
                        Proof
                      </button>

                      <button
                        onClick={() => {
                          setActiveOrder(o);
                          setModalMode("TRACKING");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono transition-colors"
                      >
                        Waybill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Advance Status */}
      {modalMode === "STATUS" && activeOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181324] border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Advance Production Status
              </h3>
              <p className="text-xs font-mono text-white/50 mt-1">
                Updating order <span className="text-pf-lime">{activeOrder.orderNumber}</span>
              </p>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                >
                  <option value="PAID">PAID</option>
                  <option value="PROOF_PENDING">PROOF_PENDING</option>
                  <option value="PROOF_READY">PROOF_READY</option>
                  <option value="CHANGES_REQUESTED">CHANGES_REQUESTED</option>
                  <option value="APPROVED">APPROVED (Print Queue)</option>
                  <option value="IN_PRODUCTION">IN_PRODUCTION (Press Active)</option>
                  <option value="PACKED">PACKED (QC Passed)</option>
                  <option value="DISPATCHED">DISPATCHED (In Courier Transit)</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Audit / Shift Reason Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch completed curing, transferred to finishing"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-mono hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet/90 disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Commit Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Pre-Press Proof */}
      {modalMode === "PROOF" && activeOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181324] border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Upload Pre-Press Proof
              </h3>
              <p className="text-xs font-mono text-white/50 mt-1">
                Attaching vector proof for <span className="text-pf-lime">{activeOrder.orderNumber}</span>. Customer will receive instant notification and order flips to PROOF_READY.
              </p>
            </div>

            <form onSubmit={handleProofSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Proof File (PNG / JPG / WebP up to 5MB)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProofFile(e.target.files[0]);
                    }
                  }}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl p-2 text-xs font-mono text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-pf-violet file:text-white"
                />
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] font-mono text-white/70 space-y-1">
                <div className="flex items-center gap-1.5 text-pf-lime font-bold">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Prepress Quality Checklist</span>
                </div>
                <div>• CMYK color profile simulation</div>
                <div>• Bleed & safety margins respected</div>
                <div>• Watermark overlay will be rendered for customer preview</div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-mono hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !proofFile}
                  className="px-4 py-2 rounded-xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet/90 disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Publish Proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Courier Waybill Tracking */}
      {modalMode === "TRACKING" && activeOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181324] border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Dispatch & Waybill Tracking
              </h3>
              <p className="text-xs font-mono text-white/50 mt-1">
                Attach tracking details for <span className="text-pf-lime">{activeOrder.orderNumber}</span>.
              </p>
            </div>

            <form onSubmit={handleTrackingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Courier Partner
                </label>
                <select
                  value={courierService}
                  onChange={(e) => setCourierService(e.target.value)}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                >
                  <option value="DELHIVERY">Delhivery Express</option>
                  <option value="BLUEDART">BlueDart Apex</option>
                  <option value="DTDC">DTDC Premier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  AWB / Waybill Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEL789123456IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-mono hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !trackingNumber}
                  className="px-4 py-2 rounded-xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet/90 disabled:opacity-50"
                >
                  {submitting ? "Attaching..." : "Confirm Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}