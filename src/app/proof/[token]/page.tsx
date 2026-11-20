"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  RotateCcw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  MessageSquare,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PublicProofDetails } from "@/server/orders/proof-service";

export default function CustomerProofApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [proof, setProof] = useState<PublicProofDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const [approving, setApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [changesSuccess, setChangesSuccess] = useState(false);

  const loadProof = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proof/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proof not found");
      setProof(data.proof);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load proof";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProof();
  }, [loadProof]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/proof/${token}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setApprovedSuccess(true);
      toast.success("Proof approved! Your order has entered factory production.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      toast.error(msg);
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim() || comments.trim().length < 5) {
      toast.error("Please provide specific feedback for requested changes.");
      return;
    }

    setSubmittingChanges(true);
    try {
      const res = await fetch(`/api/proof/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: comments.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit change request");

      setChangesSuccess(true);
      toast.success("Feedback submitted. Our design studio will revise and resend your mockup.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Change request failed";
      toast.error(msg);
    } finally {
      setSubmittingChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] dark:bg-[#15101F] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#6A2CFF] mx-auto" />
          <p className="text-sm font-semibold text-[#15101F] dark:text-[#F5F0E8]">
            Loading your custom design proof...
          </p>
        </div>
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] dark:bg-[#15101F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-white/5 rounded-3xl p-8 border border-zinc-200 dark:border-white/10 text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#15101F] dark:text-[#F5F0E8]">Proof Link Expired or Unavailable</h1>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {error || "This proof approval link is invalid or has expired after 14 days."}
          </p>
          <p className="text-xs text-zinc-400">
            Need assistance? Contact our team at support@purplefriday.in
          </p>
        </div>
      </div>
    );
  }

  const isAlreadyApproved = proof.status === "CUSTOMER_APPROVED" || approvedSuccess;
  const isRevisionRequested = proof.status === "REVISION_REQUESTED" || changesSuccess;

  return (
    <div className="min-h-screen bg-[#F5F0E8] dark:bg-[#15101F] py-8 px-4 sm:px-6 flex flex-col items-center font-sans antialiased">
      {/* Brand Header */}
      <div className="max-w-2xl w-full flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#6A2CFF] flex items-center justify-center text-white font-bold text-base shadow-sm">
            PF
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-base text-[#15101F] dark:text-[#F5F0E8]">
              PURPLE FRIDAY
            </span>
            <span className="block text-[10px] text-[#8A829E] tracking-widest uppercase">
              Digital Atelier Proof
            </span>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-[#6A2CFF] dark:text-[#CDB8FF] font-semibold">
          Order #{proof.orderNumber}
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl w-full bg-white/95 dark:bg-[#1c162b] rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Customer Greeting */}
        <div className="border-b border-zinc-100 dark:border-white/5 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#15101F] dark:text-[#F5F0E8]">
            Hi {proof.customerName}, please review your design proof
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Check the logo placement, print technique, and dimensions carefully before we print.
          </p>
        </div>

        {/* Status Callout if already approved or revision requested */}
        {isAlreadyApproved ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-sm block">Design Proof Approved!</span>
              Your custom apparel is scheduled on the factory printing floor. Dispatch SLA is active.
            </div>
          </div>
        ) : isRevisionRequested ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-sm block">Revision Feedback Received</span>
              Our lead designer has been assigned to adjust the proof according to your comments.
            </div>
          </div>
        ) : null}

        {/* Items List with Large Mockup */}
        <div className="space-y-6">
          {proof.items.map((item, i) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#15101F] dark:text-[#F5F0E8]">{item.productName}</h3>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    Quantity: {item.qty} units • Method: <span className="text-[#6A2CFF] font-semibold">{item.printMethod}</span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300">
                  Item #{i + 1}
                </span>
              </div>

              {/* Large Mockup Viewport */}
              <div className="relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-inner flex items-center justify-center">
                {item.mockupUrl ? (
                  <Image
                    src={item.mockupUrl}
                    alt={`${item.productName} Mockup Proof`}
                    fill
                    unoptimized
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="text-center p-6 text-zinc-400">
                    <Layers className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                    <span>Mockup proof rendering in atelier</span>
                  </div>
                )}
              </div>

              {/* Original Logo thumbnail + size breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {item.artworkUrl && (
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0 overflow-hidden">
                      <Image
                        src={item.artworkUrl}
                        alt="Original Logo"
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold block text-zinc-700 dark:text-zinc-300">Original Logo File</span>
                      <span className="text-[11px] text-[#8A829E]">Vector / High-res supplied</span>
                    </div>
                  </div>
                )}

                {item.sizeBreakdown && (
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[#8A829E] block">Sizes Ordered</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-xs font-semibold text-[#6A2CFF] dark:text-[#CDB8FF]">
                      {Object.entries(item.sizeBreakdown).map(([sz, qty]) => (
                        <span key={sz} className="px-2 py-0.5 rounded bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                          {sz}: {qty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons (when pending customer review) */}
        {!isAlreadyApproved && !isRevisionRequested && (
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#6A2CFF] hover:bg-[#5822db] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#6A2CFF]/20 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{approving ? "Approving..." : "Approve Design Proof"}</span>
              </button>

              <button
                type="button"
                onClick={() => setChangesOpen(!changesOpen)}
                className="py-3.5 px-6 rounded-2xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Request Changes</span>
              </button>
            </div>

            {/* Request Changes Comment Drawer */}
            {changesOpen && (
              <form
                onSubmit={handleRequestChanges}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-3 animate-in fade-in"
              >
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  What adjustments are needed? (e.g. scale, alignment, color)
                </label>
                <textarea
                  rows={3}
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="E.g., Please make the logo 10% smaller and center it slightly higher on the chest..."
                  className="w-full p-3 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setChangesOpen(false)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingChanges || !comments.trim()}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {submittingChanges ? "Submitting..." : "Send Revision Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Quality & Wash Resistance Guarantee</span>
          </span>
          <span>Purple Friday Custom Merch</span>
        </div>
      </div>
    </div>
  );
}
