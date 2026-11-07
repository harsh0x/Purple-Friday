"use client";

import React, { useState } from "react";
import {
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TrackedOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
  expectedDispatchDate: string;
  trackingNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  state: string;
  itemsCount: number;
  itemsSummary: string[];
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setOrder(null);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contact }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No matching order found.");
      }

      setOrder(data.order);
      toast.success("Order status retrieved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error tracking order";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING_PAYMENT") return 0;
    if (s === "PAID" || s === "PROOF_PENDING") return 1;
    if (s === "PROOF_READY" || s === "CHANGES_REQUESTED") return 2;
    if (s === "APPROVED" || s === "IN_PRODUCTION") return 3;
    if (s === "PACKED" || s === "DISPATCHED") return 4;
    if (s === "DELIVERED") return 5;
    return 1;
  };

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 pb-8 border-b border-pf-ink/10">
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-pf-ink/40 uppercase tracking-widest">
            <span>⊕ DISPATCH OPS</span>
            <span>•</span>
            <span>REAL-TIME TRACKING</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-pf-ink tracking-tight">
            Track Production & Shipment
          </h1>
          <p className="text-sm text-pf-ink/70 max-w-xl mx-auto">
            Inspect pre-press technical proof approvals, production machine status, and express courier tracking.
          </p>
        </div>

        {/* Lookup Form */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm max-w-2xl mx-auto">
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Order Reference Number
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. PF-2611-48291"
                className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm font-mono text-pf-ink uppercase placeholder:normal-case focus:outline-none focus:border-pf-violet"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Registered Mobile Number or Email
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="9876543210 or vikram@enterprise.in"
                className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Locating Order..." : "Check Order Status"}</span>
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-pf-ink/50 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Constant-time privacy lookup • Personal data masked</span>
          </div>
        </div>

        {/* Tracking Results Card */}
        {order && (
          <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pf-ink/10 gap-2">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-pf-ink/60">
                  Tracking Reference
                </span>
                <h3 className="font-display font-bold text-2xl text-pf-ink">
                  {order.orderNumber}
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono uppercase tracking-wider text-pf-ink/60">
                  Target Dispatch Date
                </span>
                <div className="font-mono font-bold text-base text-pf-violet">
                  {order.expectedDispatchDate}
                </div>
              </div>
            </div>

            {/* Public Masked Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-pf-paper p-4 rounded-xl border border-pf-ink/10 text-xs font-mono">
              <div>
                <div className="text-pf-ink/60">Recipient:</div>
                <div className="font-bold text-pf-ink">{order.customerName}</div>
              </div>
              <div>
                <div className="text-pf-ink/60">Destination:</div>
                <div className="font-bold text-pf-ink">{order.city}, {order.state}</div>
              </div>
              <div>
                <div className="text-pf-ink/60">Items:</div>
                <div className="font-bold text-pf-ink">{order.itemsCount} Customized Lines</div>
              </div>
              <div>
                <div className="text-pf-ink/60">Status:</div>
                <div className="font-bold text-emerald-600 uppercase">{order.status.replace("_", " ")}</div>
              </div>
            </div>

            {/* Interactive Timeline */}
            <div className="space-y-4 pt-2">
              <h4 className="font-display font-bold text-lg text-pf-ink">
                Production & Fulfilment Steps
              </h4>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { step: 1, label: "Order Received & Vectors Sanitized", desc: "Pre-press rasterization complete." },
                  { step: 2, label: "Pre-Press Technical Proof Preparation", desc: "Studio team generates color-calibrated proof." },
                  { step: 3, label: "Client Proof Approval", desc: "Customer approves alignment and color." },
                  { step: 4, label: "Press Production & Tajima Runs", desc: "Offset/DTG or high-density embroidery in progress." },
                  { step: 5, label: "Inspection & Express Dispatch", desc: "Packed in moisture-proof cartons with tracking." },
                ].map((s) => {
                  const currentIdx = getStepIndex(order.status);
                  const isDone = s.step <= currentIdx;
                  const isCurrent = s.step === currentIdx + 1;

                  return (
                    <div
                      key={s.step}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isDone
                          ? "bg-emerald-50/60 border-emerald-200"
                          : isCurrent
                            ? "bg-pf-lilac/20 border-pf-violet"
                            : "bg-pf-paper/40 border-pf-ink/10 opacity-50"
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold ${isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                              ? "bg-pf-violet text-white animate-pulse"
                              : "bg-pf-ink/10 text-pf-ink/60"
                          }`}
                      >
                        {isDone ? "✓" : s.step}
                      </div>

                      <div className="flex-1">
                        <div className={`font-bold ${isCurrent ? "text-pf-violet" : "text-pf-ink"}`}>
                          {s.label}
                        </div>
                        <div className="text-pf-ink/70 font-sans text-xs mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier Tracking ID if Dispatched */}
            {order.trackingNumber && (
              <div className="p-4 bg-pf-lilac/20 border border-pf-violet/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70">
                    Express Waybill Tracking ID
                  </div>
                  <div className="font-mono font-bold text-sm text-pf-violet">
                    {order.trackingNumber}
                  </div>
                </div>

                <a
                  href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pf-ink text-white rounded-lg text-xs font-mono font-bold hover:bg-pf-ink/90 transition-colors"
                >
                  <span>Delhivery Track</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}