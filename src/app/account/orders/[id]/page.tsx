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
} from "lucide-react";
import { toast } from "sonner";
import { StoredOrder } from "@/lib/orders";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderIdentifier = resolvedParams.id;

  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomProof, setZoomProof] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/user`);
        if (res.ok) {
          const data = await res.json();
          const match = (data.orders as StoredOrder[]).find(
            (o) => o.id === orderIdentifier || o.orderNumber === orderIdentifier
          );
          if (match) setOrder(match);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderIdentifier]);

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

      setOrder({ ...order, status: "APPROVED" });
      toast.success("Pre-press proof approved! Order released to print production.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error approving proof";
      toast.error(msg);
    } finally {
      setIsSubmittingProof(false);
    }
  };

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

      setOrder({ ...order, status: "CHANGES_REQUESTED" });
      setIsRequestModalOpen(false);
      toast.info("Change request logged. Our studio will send an updated proof.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting changes";
      toast.error(msg);
    } finally {
      setIsSubmittingProof(false);
    }
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

  const isProofActionable =
    order.status === "PAID" ||
    order.status === "PROOF_READY" ||
    order.status === "CHANGES_REQUESTED";

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
                {order.orderNumber}
              </h1>
              <span className="text-xs font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {order.status.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/orders/${order.orderNumber}/invoice`}
              className="px-4 py-2 bg-pf-ink text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-ink/90 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download GST Invoice</span>
            </a>
          </div>
        </div>

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

          {order.status === "APPROVED" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Pre-press proof approved! Order currently in high-density automated production run.
              </span>
            </div>
          )}
        </div>

        {/* Change Request Modal */}
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

        {/* Order Items Table & Delivery Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-2 text-xs font-mono">
            <div className="font-display font-bold text-base text-pf-ink font-sans mb-2">
              Delivery & Billing Address
            </div>
            <div className="font-bold text-pf-ink">{order.customerName}</div>
            <div className="text-pf-ink/70">{order.shippingAddress.line1}</div>
            {order.shippingAddress.line2 && (
              <div className="text-pf-ink/70">{order.shippingAddress.line2}</div>
            )}
            <div className="text-pf-ink/70">
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pin}
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