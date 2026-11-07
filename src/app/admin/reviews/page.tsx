"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminReview } from "@/lib/admin/admin-store";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch {
      toast.error("Failed to load customer reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleModerate = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Review ${status.toLowerCase()} successfully!`);
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      } else {
        toast.error(data.error || "Failed to moderate review");
      }
    } catch {
      toast.error("Network error updating review");
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-tight">
            Review Moderation Queue
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Audit customer feedback, inspect print proof photos, verify genuine buyers before publication
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-[#181324] p-1.5 rounded-xl border border-white/10">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${filter === st
                  ? "bg-pf-violet text-white font-bold"
                  : "text-white/60 hover:text-white"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs text-white/50">
            Loading reviews...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#181324] p-12 text-center rounded-2xl border border-white/10 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-display font-bold text-white text-base">
              No Reviews in this queue
            </h3>
            <p className="text-xs font-mono text-white/50">
              All submitted testimonials are currently moderated and processed.
            </p>
          </div>
        ) : (
          filtered.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#181324] p-6 rounded-2xl border border-white/10 space-y-4 transition-colors"
            >
              {/* Review Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-base text-white">
                      {rev.authorName}
                    </span>

                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${rev.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : rev.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-white/50">
                    Product: <span className="text-white/80">{rev.productName}</span> • Submitted:{" "}
                    {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rev.rating ? "fill-amber-400" : "text-white/20"
                        }`}
                    />
                  ))}
                  <span className="text-xs font-mono font-bold text-white ml-1">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {/* Review Title & Body */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-white">
                  &ldquo;{rev.title}&rdquo;
                </h4>
                <p className="text-xs font-mono text-white/70 leading-relaxed">
                  {rev.body}
                </p>
              </div>

              {/* Attached Photos if present */}
              {rev.photoUrls.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-[11px] font-mono text-white/40 uppercase">
                    Customer Photos:
                  </span>
                  <div className="flex gap-2">
                    {rev.photoUrls.map((url, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 rounded-lg bg-[#110D1A] border border-white/10 overflow-hidden relative"
                      >
                        <Image
                          src={url}
                          alt="Customer verification photo"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                {rev.status !== "REJECTED" && (
                  <button
                    onClick={() => handleModerate(rev.id, "REJECTED")}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                {rev.status !== "APPROVED" && (
                  <button
                    onClick={() => handleModerate(rev.id, "APPROVED")}
                    className="px-4 py-1.5 rounded-xl bg-pf-violet hover:bg-pf-violet/90 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}