"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { StoredReview } from "@/server/reviews/review-service";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
      setLoading(true);
      try {
          const url = new URL("/api/admin/reviews", window.location.origin);
          if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
          const res = await fetch(url.toString());
          if (res.ok) {
            const json = await res.json();
            setReviews(json.reviews || []);
            if (json.counts) setCounts(json.counts);
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
    }, [selectedStatus]);

    useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

    const handleModerate = async (reviewId: string, action: "APPROVE" | "REJECT") => {
      setActionLoading(reviewId);
      try {
        const res = await fetch("/api/admin/reviews", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId, action }),
        });
          if (res.ok) {
            fetchReviews();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setActionLoading(null);
        }
      };

      return (
              <PageTransition>
                <div className="space-y-8">
                  {/* Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                          Customer Reviews & Moderation
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                          Quality Feedback Loop
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-mono text-[#15101F]/60">
                        Automated review invitations (3 days post-delivery), smart triage (4-5★ approved, 1-3★ quarantined to Support)
                      </p>
                    </div>
                  </div>

                      {/* Filter Tabs */ }
                      < div className = "flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#15101F]/10" >
                      {
                        [
                        { id: "ALL", label: `All Reviews (${counts.all})` },
                        { id: "PENDING", label: `Pending Queue (${counts.pending})` },
                        { id: "APPROVED", label: `Approved Public (${counts.approved})` },
                        { id: "REJECTED", label: `Quarantined (1-3★) (${counts.rejected})` },
          ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedStatus(tab.id)}
                            className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all ${selectedStatus === tab.id
                                ? "bg-[#15101F] text-white shadow-sm"
                                : "bg-white text-[#15101F]/70 hover:bg-[#FAF7F2] border border-[#15101F]/10"
                              }`}
                          >
                            {tab.label}
                          </button>
                        ))
                      }
        </div>

                              {/* Reviews List */}
                              <div className="space-y-4">
                                {loading ? (
                                  <div className="p-12 text-center text-xs font-mono text-[#15101F]/60">
                                    Loading verified review feedback...
                                  </div>
                                ) : reviews.length === 0 ? (
                                  <div className="bg-white rounded-3xl p-12 text-center border border-[#15101F]/10 shadow-sm">
                                    <p className="text-xs font-mono text-[#15101F]/60">
                                      No reviews found for this status.
                                    </p>
                                  </div>
                                ) : (
                                  reviews.map((r) => {
                                    const isQuarantined = r.status === "REJECTED";

                                    return (
                                      <div
                                        key={r.id}
                                        className={`bg-white rounded-3xl p-6 border shadow-sm transition-all ${isQuarantined
                                            ? "border-rose-200 bg-rose-50/20"
                                            : r.status === "APPROVED"
                                              ? "border-emerald-200"
                                              : "border-[#15101F]/10"
                                          }`}
                                      >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                          <div className="space-y-2 flex-1">
                                            {/* Rating & Status Badges */}
                                            <div className="flex flex-wrap items-center gap-2">
                                              <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                  <Star
                                                    key={s}
                                                    className={`w-4 h-4 ${r.rating >= s
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-[#15101F]/15"
                                                      }`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="font-bold font-mono text-sm text-[#15101F]">
                                                {r.rating}.0 / 5.0
                                              </span>

                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${r.status === "APPROVED"
                                                  ? "bg-emerald-100 text-emerald-800"
                                                  : r.status === "REJECTED"
                                                    ? "bg-rose-100 text-rose-800"
                                                    : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                              {r.status === "REJECTED" ? "QUARANTINED (1-3★)" : r.status}
                                            </span>

                                          {r.verified && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6A2CFF] bg-[#6A2CFF]/10 px-2 py-0.5 rounded font-bold">
                                              <ShieldCheck className="w-3 h-3" />
                                              <span>Verified Buyer</span>
                                            </span>
                                          )}

                                        {r.orderNumber && (
                                          <span className="text-[11px] font-mono text-[#15101F]/50">
                                            Order #{r.orderNumber}
                                          </span>
                                        )}
                                      </div>

                                    {/* Title & Body */ }
                      <h3 className="font-sans font-bold text-base text-[#15101F]">
                        {r.title}
                      </h3>
                      <p className="text-xs text-[#15101F]/80 font-sans whitespace-pre-wrap leading-relaxed">
                        {r.body}
                      </p>

                                                {/* Author & Product Info */}
                                                <div className="text-[11px] font-mono text-[#15101F]/60 flex items-center gap-3 pt-1">
                                                  <span>By {r.authorName}</span>
                                                  <span>•</span>
                                                  <span>Product: {r.productTitle || r.productId}</span>
                                                  <span>•</span>
                                                  <span>{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                                                </div>

                                                {/* Support Ticket Link if Quarantined */}
                                                {r.supportTicketId && (
                                                  <div className="pt-2">
                                                    <Link
                                                      href="/admin/support"
                                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-mono font-bold hover:bg-rose-200 transition-colors"
                                                    >
                                                      <AlertCircle className="w-3.5 h-3.5" />
                                                      <span>Linked Support Ticket #{r.supportTicketId} &rarr;</span>
                                                    </Link>
                                                  </div>
                                                )}

                                                {/* Photo Thumbnail if uploaded */}
                                                {r.photoUrls && r.photoUrls.length > 0 && (
                                                  <div className="pt-2 flex items-center gap-2">
                                                    {r.photoUrls.map((url, idx) => (
                                                      <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="w-16 h-16 rounded-xl border border-[#15101F]/10 overflow-hidden bg-cover bg-center flex items-center justify-center hover:opacity-90"
                                                        style={{ backgroundImage: `url(${url})` }}
                                                      >
                                                        <span className="sr-only">Review image {idx + 1}</span>
                                                      </a>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                    {/* Moderation Actions */ }
                                              < div className = "flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0" >
                                              {
                                                r.status !== "APPROVED" && (
                                                  <button
                                                    onClick={() => handleModerate(r.id, "APPROVE")}
                                                    disabled={actionLoading === r.id}
                                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                                  >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Approve</span>
                                                  </button>
                                                )
                                              }

                      {
                                                r.status !== "REJECTED" && (
                                                  <button
                                                    onClick={() => handleModerate(r.id, "REJECT")}
                                                    disabled={actionLoading === r.id}
                                                    className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 font-mono text-xs font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                                                  >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Reject</span>
                                                  </button>
                                                )
                                              }
                    </div>
                                        </div>
                </div>
                            );
            })
          )}
                          </div>
                        </div>
    </PageTransition>
              );
}