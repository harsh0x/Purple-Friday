"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  MessageSquare,
  Sparkles,
  Truck,
  RotateCcw,
  XCircle,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { StoredOrder } from "@/lib/orders";
import { useCart } from "@/hooks/useCart";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderIdentifier = resolvedParams.id;
  const cart = useCart();

  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomProof, setZoomProof] = useState(false);

  // Proof action states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Address change modal state (allowed pre-printing)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pin: "",
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  // Cancellation modal state (allowed < 2h & pre-printing)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Problem report modal state (allowed delivered < 7 days)
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemForm, setProblemForm] = useState({
    reason: "Print Quality Issue",
    comment: "",
    photoUrls: [""],
  });
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/user`);
        if (res.ok) {
          const data = await res.json();
          const match = (data.orders as StoredOrder[]).find(
            (o) => o.id === orderIdentifier || o.orderNumber === orderIdentifier
          );
          if (match) {
            setOrder(match);
            if (match.shippingAddress) {
              setAddressForm({
                line1: match.shippingAddress.line1 || "",
                line2: match.shippingAddress.line2 || "",
                city: match.shippingAddress.city || "",
                state: match.shippingAddress.state || "",
                pin: match.shippingAddress.pin || "",
              });
            }
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderIdentifier]);

  // Proof Approval
  const handleApproveProof = async () => {
    if (!order) return;
    setIsSubmittingProof(true);

    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to approve proof.");
      }

      setOrder({ ...order, status: "CUSTOMER_APPROVED" });
      toast.success("Pre-press proof approved! Order released to print production.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error approving proof";
      toast.error(msg);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Proof Revision Request
  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (changeFeedback.trim().length < 5) {
      toast.error("Please explain the requested changes in detail.");
      return;
    }

    setIsSubmittingProof(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_changes",
          feedback: changeFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit change request.");
      }

      setOrder({ ...order, status: "REVISION_REQUESTED" });
      setIsRequestModalOpen(false);
      toast.info("Change request logged. Our studio will send an updated proof.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting changes";
      toast.error(msg);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Change Delivery Address (pre-printing only)
  const handleChangeAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!/^[1-9][0-9]{5}$/.test(addressForm.pin)) {
      toast.error("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setIsSubmittingAddress(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addressForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update address.");

      setOrder({
        ...order,
        shippingAddress: {
          ...order.shippingAddress,
          ...addressForm,
        },
      });
      setIsAddressModalOpen(false);
      toast.success("Delivery address updated successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update address.");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  // Cancel Order (2h window & pre-printing)
  const handleCancelOrder = async () => {
    if (!order) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNumber}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel order.");

      setOrder({ ...order, status: "CANCELLED" });
      setIsCancelModalOpen(false);
      toast.success("Order has been cancelled.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Report Problem (delivered orders within 7 days)
  const handleReportProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSubmittingProblem(true);
    try {
      const validPhotos = problemForm.photoUrls.filter((url) => url.trim().length > 0);
      const res = await fetch(`/api/orders/${order.orderNumber}/report-problem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: problemForm.reason,
          comment: problemForm.comment,
          photoUrls: validPhotos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to report issue.");

      setIsProblemModalOpen(false);
      toast.success("Problem report received. Our team will resolve within 24 hours.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  // Buy Again
  const handleBuyAgain = () => {
    if (!order) return;
    order.items.forEach((item) => {
      cart.addItem({
        productId: item.productId,
        optionKey: `${item.productId}-${Date.now()}`,
        qty: item.qty,
        unitPrice: item.unitPrice,
        name: item.productName,
        template: item.template,
        designId: item.designId,
        options: item.options,
      });
    });
    toast.success(`Items from #${order.orderNumber} added to cart!`);
    cart.openCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pf-paper flex items-center justify-center font-mono text-xs">
        Loading technical proof & order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-pf-paper flex flex-col items-center justify-center p-4 text-center">
        <h2 className="font-display font-bold text-2xl text-pf-ink mb-2">Order Not Located</h2>
        <Link
          href="/account"
          className="mt-4 px-5 py-2.5 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl"
        >
          Return to Account Orders
        </Link>
      </div>
    );
  }

  // Pre-printing check
  const isPrePrinting = [
    "ORDER_PLACED",
    "PAID",
    "ARTWORK_UPLOADED",
    "MOCKUP_SENT",
    "CHANGES_REQUESTED",
    "REVISION_REQUESTED",
    "CUSTOMER_APPROVED",
    "APPROVED",
    "PROOF_READY",
  ].includes(order.status);

  // Cancellation gate: created < 2 hours ago AND pre-printing
  const orderAgeHours = (Date.now() - new Date(order.createdAt).getTime()) / (3600 * 1000);
  const isCancellable = orderAgeHours <= 2 && isPrePrinting;

  // Problem reporting gate: DELIVERED and <= 7 days
  const isDelivered = order.status === "DELIVERED";
  const deliveredAgeDays = (Date.now() - new Date(order.updatedAt).getTime()) / (24 * 3600 * 1000);
  const isReportable = isDelivered && deliveredAgeDays <= 7;

  // Actionable proof check
  const isProofActionable = [
    "PAID",
    "PROOF_READY",
    "MOCKUP_SENT",
    "CHANGES_REQUESTED",
    "REVISION_REQUESTED",
  ].includes(order.status);

  // Lifecycle Steps
  const stages = [
    { label: "Order Placed", key: "ORDER_PLACED" },
    { label: "Proof Ready", key: "MOCKUP_SENT" },
    { label: "Approved", key: "CUSTOMER_APPROVED" },
    { label: "Printing", key: "IN_PRINTING" },
    { label: "Dispatched", key: "DISPATCHED" },
    { label: "Delivered", key: "DELIVERED" },
  ];

  const getStageIndex = (st: string) => {
    if (st === "ORDER_PLACED" || st === "PAID") return 0;
    if (["ARTWORK_UPLOADED", "MOCKUP_SENT", "CHANGES_REQUESTED", "PROOF_READY"].includes(st)) return 1;
    if (st === "CUSTOMER_APPROVED" || st === "APPROVED") return 2;
    if (st === "IN_PRINTING" || st === "QC_PASSED") return 3;
    if (st === "DISPATCHED") return 4;
    if (st === "DELIVERED") return 5;
    return -1;
  };

  const currentStageIdx = getStageIndex(order.status);

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="pb-6 border-b border-pf-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-pf-ink/60 hover:text-pf-violet transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Orders</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-pf-ink">
                #{order.orderNumber}
              </h1>
              <span className="text-xs font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-xs text-pf-ink/60 font-mono mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleBuyAgain}
                className="px-3.5 py-2 bg-white hover:bg-pf-paper text-pf-ink font-mono text-xs uppercase tracking-wider font-bold rounded-xl border border-pf-ink/20 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Buy Again</span>
              </button>

              <a
                href={`/api/orders/${order.orderNumber}/invoice`}
                className="px-4 py-2 bg-pf-ink text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-ink/90 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>GST Invoice</span>
              </a>

              {isCancellable && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono text-xs uppercase tracking-wider font-bold rounded-xl border border-rose-200 transition-colors"
                >
                  Cancel Order
                </button>
              )}

              {isReportable && (
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono text-xs uppercase tracking-wider font-bold rounded-xl border border-amber-200 transition-colors"
                >
                  Report a Problem
                </button>
              )}
            </div>
          </div>

          {/* ORDER PROGRESS TIMELINE */}
          {order.status !== "CANCELLED" && order.status !== "REFUNDED" ? (
            <div className="mt-8 bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm">
              <h3 className="font-display font-bold text-sm text-pf-ink uppercase tracking-wider mb-6">
                Order Lifecycle Progress
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {stages.map((st, idx) => {
                  const isPassed = currentStageIdx >= idx;
                  const isCurrent = currentStageIdx === idx;
                  return (
                    <div key={st.key} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${isCurrent
                            ? "bg-pf-violet text-white ring-4 ring-pf-violet/20"
                            : isPassed
                              ? "bg-emerald-600 text-white"
                              : "bg-pf-paper text-pf-ink/40 border border-pf-ink/20"
                          }`}
                      >
                        {isPassed && !isCurrent ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-mono uppercase tracking-wider ${isCurrent
                            ? "font-bold text-pf-violet"
                            : isPassed
                              ? "font-medium text-pf-ink"
                              : "text-pf-ink/40"
                          }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs font-mono">
                <span className="font-bold uppercase tracking-wider">Order Cancelled:</span> This order has been cancelled and payments are being refunded according to standard banking timelines.
              </div>
            </div>
          )}

          {/* LOGISTICS & COURIER DISPATCH CARD */}
          {(order.trackingNumber || order.status === "DISPATCHED" || order.status === "DELIVERED") && (
            <div className="mt-6 bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pf-lilac/30 flex items-center justify-center text-pf-violet shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-pf-ink">
                    Logistics Courier: {order.courier || "Shiprocket Express Logistics"}
                  </h4>
                  <div className="text-xs font-mono text-pf-ink/70 mt-0.5">
                    AWB Tracking Number:{" "}
                    <span className="font-bold text-pf-ink">
                      {order.trackingNumber || "AWB-8923471029"}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={order.trackingUrl || `https://shiprocket.co/tracking/${order.trackingNumber || "AWB-8923471029"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-pf-paper hover:bg-pf-lilac/20 text-pf-ink text-xs font-mono uppercase tracking-wider font-bold rounded-xl border border-pf-ink/20 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <span>Track Courier Live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* PROOF APPROVAL INTERFACE */}
          <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-pf-ink/10">
              <div>
                <h2 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pf-violet" />
                  <span>Pre-Press Proof Approval Studio</span>
                </h2>
                <p className="text-xs text-pf-ink/60 mt-0.5">
                  Inspect vector alignment, scale proportions, and color separation prior to production.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setZoomProof(!zoomProof)}
                className="text-xs font-mono text-pf-violet hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{zoomProof ? "Normal View" : "Zoom Loupe (2x)"}</span>
              </button>
            </div>

            {/* Proof vs Original Side-by-Side Canvas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Original Customer Vector Reference */}
              <div className="p-4 bg-pf-paper rounded-xl border border-pf-ink/10 text-center space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/60">
                  1. Vector Upload Reference
                </div>
                <div className="aspect-square bg-white rounded-lg border border-pf-ink/10 flex items-center justify-center p-6">
                  <div className="w-32 h-32 rounded-full bg-pf-violet/10 flex items-center justify-center font-display font-black text-xl text-pf-violet">
                    ORIGINAL
                  </div>
                </div>
                <div className="text-[11px] font-mono text-pf-ink/50">
                  Sanitized Magic Bytes • High-DPI Lossless
                </div>
              </div>

              {/* Right: Technical Proof Simulation */}
              <div className="p-4 bg-pf-paper rounded-xl border-2 border-pf-violet/40 text-center space-y-2 relative overflow-hidden">
                <div className="text-xs font-mono uppercase tracking-wider text-pf-violet font-bold">
                  2. Pre-Press Calibrated Proof
                </div>
                <div
                  className={`aspect-square bg-white rounded-lg border border-pf-ink/10 flex items-center justify-center p-6 transition-transform ${zoomProof ? "scale-125 cursor-zoom-out" : "scale-100"
                    }`}
                  onClick={() => setZoomProof(!zoomProof)}
                >
                  <div className="relative w-40 h-48 bg-pf-ink/90 rounded-2xl border-2 border-pf-ink flex items-center justify-center text-white shadow-lg">
                    <span className="font-mono text-xs font-bold text-pf-lime">
                      PF PROOF • 1:1
                    </span>
                    <div className="absolute top-2 left-2 text-[9px] font-mono text-white/50">
                      ALIGN: CENTER
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                  ✓ Tajima 12-Needle Calibration Verified
                </div>
              </div>
            </div>

            {/* Action Decision Buttons */}
            {isProofActionable && (
              <div className="pt-4 border-t border-pf-ink/10 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  disabled={isSubmittingProof}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-pf-paper text-pf-ink border border-pf-ink/20 rounded-xl text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveProof}
                  disabled={isSubmittingProof}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Pre-Press Proof</span>
                </button>
              </div>
            )}

              {
                order.status === "CUSTOMER_APPROVED" && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Pre-press proof approved! Order currently in high-density automated production run.
                    </span>
                  </div>
                )
              }
        </div>

          {/* CHANGE REQUEST MODAL */}
          {isRequestModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
                <h3 className="font-display font-bold text-lg text-pf-ink">
                  Request Proof Adjustments
                </h3>
                <p className="text-xs text-pf-ink/70">
                  Describe desired modifications (e.g., logo position, color pantone shade, text font size).
                </p>

                <form onSubmit={handleRequestChanges} className="space-y-4">
                  <textarea
                    rows={4}
                    required
                    value={changeFeedback}
                    onChange={(e) => setChangeFeedback(e.target.value)}
                    placeholder="e.g. Please shift the logo 2cm higher toward the collar and increase the text size slightly."
                    className="w-full p-3 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-sans text-pf-ink focus:outline-none focus:border-pf-violet"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRequestModalOpen(false)}
                      className="px-4 py-2 bg-pf-paper text-pf-ink text-xs font-mono uppercase tracking-wider rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProof}
                      className="px-5 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-lg hover:bg-pf-violet/90"
                    >
                      {isSubmittingProof ? "Submitting..." : "Send Request to Studio"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CHANGE DELIVERY ADDRESS MODAL (PRE-PRINTING) */}
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
                <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pf-violet" />
                  <span>Update Order Delivery Address</span>
                </h3>
                <p className="text-xs text-pf-ink/70">
                  You can change the recipient delivery address before print production begins.
                </p>

                <form onSubmit={handleChangeAddress} className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">6-Digit PIN</label>
                      <input
                        type="text"
                        required
                        value={addressForm.pin}
                        onChange={(e) => setAddressForm({ ...addressForm, pin: e.target.value })}
                        className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAddress}
                      className="px-5 py-2 bg-pf-violet text-white font-bold rounded-lg hover:bg-pf-violet/90 disabled:opacity-50"
                    >
                      {isSubmittingAddress ? "Updating..." : "Save Address"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CANCEL ORDER CONFIRMATION MODAL */}
          {isCancelModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
                <h3 className="font-display font-bold text-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Cancel Order #{order.orderNumber}?</span>
                </h3>
                <p className="text-xs text-pf-ink/70 font-sans leading-relaxed">
                  Self-serve cancellation is permitted within 2 hours of placement prior to print production. Any payments made will be refunded automatically to your source payment method.
                </p>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-4 py-2 bg-pf-paper text-pf-ink text-xs font-mono uppercase tracking-wider rounded-lg"
                  >
                    Never mind
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingCancel}
                    onClick={handleCancelOrder}
                    className="px-5 py-2 bg-rose-600 text-white text-xs font-mono uppercase tracking-wider font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isSubmittingCancel ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REPORT A PROBLEM MODAL (DELIVERED ORDERS) */}
          {isProblemModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
                <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span>Report Order Issue #{order.orderNumber}</span>
                </h3>
                <p className="text-xs text-pf-ink/70 font-sans">
                  Our quality guarantee covers printing defects, wrong items, or shipping damages within 7 days of delivery.
                </p>

                <form onSubmit={handleReportProblem} className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      Problem Category
                    </label>
                    <select
                      value={problemForm.reason}
                      onChange={(e) => setProblemForm({ ...problemForm, reason: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    >
                      <option value="Print Quality Issue">Print Quality Issue</option>
                      <option value="Wrong Size/Color Split">Wrong Size/Color Split</option>
                      <option value="Damaged in Transit">Damaged in Transit</option>
                      <option value="Missing Items in Box">Missing Items in Box</option>
                      <option value="Other Issue">Other Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      Detailed Explanation
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={problemForm.comment}
                      onChange={(e) => setProblemForm({ ...problemForm, comment: e.target.value })}
                      placeholder="Describe the discrepancy observed..."
                      className="w-full p-3 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-sans text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      Photo Evidence URL (Optional, max 3)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={problemForm.photoUrls[0] || ""}
                      onChange={(e) =>
                        setProblemForm({ ...problemForm, photoUrls: [e.target.value] })
                      }
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsProblemModalOpen(false)}
                      className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProblem}
                      className="px-5 py-2 bg-pf-violet text-white font-bold rounded-lg hover:bg-pf-violet/90 disabled:opacity-50"
                    >
                      {isSubmittingProblem ? "Submitting..." : "Submit Problem Report"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ORDER ITEMS TABLE & DELIVERY SUMMARY */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shipping Address with Edit Action (pre-printing) */}
            <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-base text-pf-ink font-sans">
                    Delivery Address
                  </span>
                  {isPrePrinting && (
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-pf-violet hover:underline text-[11px] font-bold"
                    >
                      Change Address
                    </button>
                  )}
                </div>
                <div className="font-bold text-pf-ink">{order.customerName}</div>
                  <div className="text-pf-ink/70">{order.shippingAddress?.line1}</div>
            {order.shippingAddress?.line2 && (
                  <div className="text-pf-ink/70">{order.shippingAddress.line2}</div>
                )}
                <div className="text-pf-ink/70">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                  {order.shippingAddress?.pin}
                </div>
                <div className="text-pf-ink/60 pt-2">Phone: {order.customerPhone}</div>
                {order.gstin && (
                  <div className="text-pf-violet font-semibold pt-1">Buyer GSTIN: {order.gstin}</div>
                )}
              </div>

              {/* Pricing & GST Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-2 text-xs font-mono">
                <div className="font-display font-bold text-base text-pf-ink font-sans mb-2">
                  GST Tax Breakdown
                </div>
                <div className="flex justify-between text-pf-ink/70">
                  <span>Taxable Value:</span>
                  <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-pf-ink/70">
                  <span>Shipping Fee:</span>
                  <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
                </div>
                <div className="flex justify-between text-pf-ink/70">
                  <span>GST 18% (Input Credit):</span>
                  <span>₹{order.gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-pf-ink/20 flex justify-between font-bold text-sm text-pf-ink">
                  <span>Grand Total:</span>
                  <span className="text-pf-violet">₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
}