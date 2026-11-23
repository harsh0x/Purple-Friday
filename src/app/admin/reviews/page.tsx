"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  Star,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Trash2,
  MessageSquare,
  Search,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { StoredReview } from "@/server/reviews/review-service";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Bulk selection
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);

    // Reply Modal
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyTargetReview, setReplyTargetReview] = useState<StoredReview | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    // Delete Confirmation Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchReviews = useCallback(async () => {
      setLoading(true);
      try {
        const url = new URL("/api/admin/reviews", window.location.origin);
        if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
        if (ratingFilter !== "ALL") url.searchParams.set("rating", ratingFilter);
        if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());

        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          setReviews(json.reviews || []);
          if (json.counts) setCounts(json.counts);
        }
      } catch {
        toast.error("Failed to load customer reviews");
      } finally {
        setLoading(false);
      }
    }, [selectedStatus, ratingFilter, searchQuery]);

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
          toast.success(`Review ${action === "APPROVE" ? "approved" : "rejected"} and rating recalculated`);
          fetchReviews();
        } else {
          const err = await res.json();
          toast.error(err.error || "Moderation failed");
        }
      } catch {
        toast.error("Moderation request failed");
      } finally {
        setActionLoading(null);
      }
    };

  const handleBulkApprove = async () => {
    if (selectedReviewIds.length === 0) return;
          setBulkApproving(true);
          try {
      const res = await fetch("/api/admin/reviews", {
            method: "POST",
          headers: {"Content-Type": "application/json" },
          body: JSON.stringify({action: "BULK_APPROVE", reviewIds: selectedReviewIds }),
      });
          if (res.ok) {
            toast.success(`${selectedReviewIds.length} review(s) approved and catalogue recalculated`);
          setSelectedReviewIds([]);
          fetchReviews();
      } else {
            toast.error("Bulk approve failed");
      }
    } catch {
            toast.error("Bulk approve request failed");
    } finally {
            setBulkApproving(false);
    }
  };

  const openReplyModal = (r: StoredReview) => {
              setReplyTargetReview(r);
            setReplyText(r.adminReply || "");
            setReplyModalOpen(true);
  };

  const submitReply = async (e: React.FormEvent) => {
              e.preventDefault();
            if (!replyTargetReview || !replyText.trim()) return;

            setSubmittingReply(true);
            try {
      const res = await fetch("/api/admin/reviews", {
              method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({
              action: "REPLY",
            reviewId: replyTargetReview.id,
            replyText: replyText.trim(),
        }),
      });
            if (res.ok) {
              toast.success("Official reply published under review");
            setReplyModalOpen(false);
            fetchReviews();
      } else {
        const err = await res.json();
            toast.error(err.error || "Failed to publish reply");
      }
    } catch {
              toast.error("Reply failed");
    } finally {
              setSubmittingReply(false);
    }
  };

  const openDeleteModal = (id: string) => {
              setDeleteTargetId(id);
            setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
            setDeleting(true);
            try {
      const res = await fetch(`/api/admin/reviews?id=${deleteTargetId}`, {
              method: "DELETE",
      });
            if (res.ok) {
              toast.success("Review deleted and rating recalculated");
            setDeleteModalOpen(false);
            setDeleteTargetId(null);
            fetchReviews();
      } else {
              toast.error("Failed to delete review");
      }
    } catch {
              toast.error("Delete request failed");
    } finally {
              setDeleting(false);
    }
  };

  const toggleSelectReview = (id: string) => {
              setSelectedReviewIds((prev) =>
                prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
              );
  };

  const toggleSelectAll = () => {
    if (selectedReviewIds.length === reviews.length) {
              setSelectedReviewIds([]);
    } else {
              setSelectedReviewIds(reviews.map((r) => r.id));
    }
  };

            return (
            <PageTransition>
              <div className="space-y-6 pb-16">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-[#15101F] dark:text-[#F5F0E8]">
                        Customer Reviews & Moderation
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                        Feedback Loop
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#8A829E] font-mono">
                      Verified review moderation, rating recalculation, and official brand responses.
                    </p>
                  </div>

                  {selectedReviewIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkApprove}
                        disabled={bulkApproving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bulk Approve ({selectedReviewIds.length})</span>
                      </button>
                    </div>
                  )}
                </div>

                      {/* Filter Controls Bar */ }
                      <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                          {/* Search */}
                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              placeholder="Search reviews by customer, product, title..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                            />
                          </div>

                                  {/* Status Tabs & Star Filter */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
                                      {[
                                        { id: "ALL", label: `All (${counts.all})` },
                                        { id: "PENDING", label: `Pending (${counts.pending})` },
                                        { id: "APPROVED", label: `Approved (${counts.approved})` },
                                        { id: "REJECTED", label: `Rejected (${counts.rejected})` },
                                      ].map((tab) => (
                                        <button
                                          key={tab.id}
                                          onClick={() => setSelectedStatus(tab.id)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${selectedStatus === tab.id
                                              ? "bg-white dark:bg-[#15101F] text-[#15101F] dark:text-white font-bold shadow-sm"
                                              : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                            }`}
                                        >
                                          {tab.label}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Star Rating Dropdown */}
                                    <select
                                      value={ratingFilter}
                                      onChange={(e) => setRatingFilter(e.target.value)}
                                      className="px-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none"
                                    >
                                      <option value="ALL">All Ratings</option>
                                      <option value="5">5 Stars only</option>
                                      <option value="4">4 Stars only</option>
                                      <option value="3">3 Stars only</option>
                                      <option value="2">2 Stars only</option>
                                      <option value="1">1 Star only</option>
                                    </select>

                                    {reviews.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="px-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                                      >
                                        {selectedReviewIds.length === reviews.length ? "Deselect All" : "Select All"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                            {/* Reviews List */}
                            <div className="space-y-4">
                              {loading ? (
                                <div className="p-16 text-center text-xs font-mono text-zinc-400">
                                  Loading customer reviews...
                                </div>
                              ) : reviews.length === 0 ? (
                                <div className="bg-white dark:bg-white/5 rounded-2xl p-12 text-center border border-zinc-200 dark:border-white/10 shadow-sm">
                                  <p className="text-xs font-mono text-zinc-400">No reviews found matching the selected filters.</p>
                                </div>
                              ) : (
                                reviews.map((r) => {
                                  const isSelected = selectedReviewIds.includes(r.id);
                                  const isLowRating = r.rating <= 3;

                                  return (
                                    <div
                                      key={r.id}
                                      className={`bg-white dark:bg-white/5 rounded-2xl p-5 border shadow-sm transition-all ${isLowRating && r.status === "PENDING"
                                          ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                                          : r.status === "APPROVED"
                                            ? "border-emerald-200 dark:border-emerald-900/40"
                                            : "border-zinc-200 dark:border-white/10"
                                        }`}
                                    >
                                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        {/* Checkbox and Review Content */}
                                        <div className="flex items-start gap-3 flex-1">
                                          <button
                                            onClick={() => toggleSelectReview(r.id)}
                                            className="mt-1 text-zinc-400 hover:text-[#6A2CFF] transition-colors"
                                          >
                                            {isSelected ? (
                                              <CheckSquare className="w-4 h-4 text-[#6A2CFF]" />
                                            ) : (
                                              <Square className="w-4 h-4" />
                                            )}
                                          </button>

                                          <div className="space-y-2 flex-1">
                                            {/* Rating, Badges & Needs Attention Flag */}
                                            <div className="flex flex-wrap items-center gap-2">
                                              <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                  <Star
                                                    key={s}
                                                    className={`w-4 h-4 ${r.rating >= s ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-700"
                                                      }`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="font-bold font-mono text-xs text-[#15101F] dark:text-[#F5F0E8]">
                                                {r.rating}.0 / 5.0
                                              </span>

                                              {/* Low Rating Needs Attention Chip */}
                                              {isLowRating && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  <span>Needs attention</span>
                                                </span>
                                              )}

                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${r.status === "APPROVED"
                                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                                  : r.status === "REJECTED"
                                                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                                                    : "bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300"
                                                }`}
                                            >
                                              {r.status}
                                            </span>

                                              {r.verified && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6A2CFF] bg-[#6A2CFF]/10 px-2 py-0.5 rounded font-bold">
                                                  <ShieldCheck className="w-3 h-3" />
                                                  <span>Verified Buyer</span>
                                                </span>
                                              )}

                                              {r.orderNumber && (
                                                <span className="text-[11px] font-mono text-zinc-400">Order #{r.orderNumber}</span>
                                              )}
                                            </div>

                                            {/* Title & Body (Read-only for Admin) */}
                                            <h3 className="font-bold text-sm text-[#15101F] dark:text-[#F5F0E8]">{r.title}</h3>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                              {r.body}
                                            </p>

                                            {/* Metadata */}
                                            <div className="text-[11px] font-mono text-zinc-500 flex flex-wrap items-center gap-2 pt-1">
                                              <span>By {r.authorName}</span>
                                              <span>•</span>
                                              <span>Product: {r.productTitle || r.productId}</span>
                                              <span>•</span>
                                              <span>{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                                            </div>

                                            {/* Photos */}
                                            {r.photoUrls && r.photoUrls.length > 0 && (
                                              <div className="pt-2 flex items-center gap-2">
                                                {r.photoUrls.map((url, idx) => (
                                                  <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-14 h-14 rounded-xl border border-zinc-200 dark:border-white/10 overflow-hidden bg-cover bg-center flex items-center justify-center hover:opacity-90"
                                                    style={{ backgroundImage: `url(${url})` }}
                                                  >
                                                    <span className="sr-only">Photo {idx + 1}</span>
                                                  </a>
                                                ))}
                                              </div>
                                            )}

                                            {/* Public Reply from Purple Friday */}
                                            {r.adminReply && (
                                              <div className="mt-3 p-3 rounded-xl bg-[#6A2CFF]/5 border border-[#6A2CFF]/20 space-y-1">
                                                <div className="flex items-center justify-between text-[10px] font-mono text-[#6A2CFF] font-bold uppercase">
                                                  <span>Official Response from Purple Friday</span>
                                                  {r.repliedAt && <span>{new Date(r.repliedAt).toLocaleDateString("en-IN")}</span>}
                                                </div>
                                                <p className="text-xs text-[#15101F] dark:text-[#F5F0E8] leading-relaxed">
                                                  {r.adminReply}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                      {/* Action Buttons: Approve, Reject, Reply, Delete */}
                                      <div className="flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0">
                                        {r.status !== "APPROVED" && (
                                          <button
                                            onClick={() => handleModerate(r.id, "APPROVE")}
                                            disabled={actionLoading === r.id}
                                            className="w-full px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Approve</span>
                                          </button>
                                        )}

                                        {r.status !== "REJECTED" && (
                                          <button
                                            onClick={() => handleModerate(r.id, "REJECT")}
                                            disabled={actionLoading === r.id}
                                            className="w-full px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-400 font-mono text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center gap-1.5"
                                          >
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Reject</span>
                                          </button>
                                        )}

                                        <button
                                          onClick={() => openReplyModal(r)}
                                          className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:border-[#6A2CFF]/40 text-[#6A2CFF] dark:text-[#CDB8FF] font-mono text-xs font-semibold hover:bg-[#6A2CFF]/5 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          <span>{r.adminReply ? "Edit Reply" : "Public Reply"}</span>
                                        </button>

                                        <button
                                          onClick={() => openDeleteModal(r.id)}
                                          className="w-full px-3 py-1.5 rounded-xl text-zinc-400 hover:text-rose-600 font-mono text-xs transition-colors flex items-center justify-center gap-1"
                                          title="Delete Review"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </div>
                </div>
                            );
            })
          )}
                      </div>

                      {/* Public Reply Modal */ }
                      {
                        replyModalOpen && replyTargetReview && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                            <form
                              onSubmit={submitReply}
                              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15101F] border border-zinc-200 dark:border-white/15 p-6 shadow-2xl space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-[#6A2CFF]" />
                                  <span>Public Reply from Purple Friday</span>
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setReplyModalOpen(false)}
                                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs space-y-1">
                                <span className="font-bold text-[#15101F] dark:text-[#F5F0E8]">
                                  Replying to: {replyTargetReview.authorName} ({replyTargetReview.rating}★)
                                </span>
                                <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 italic">
                                  &ldquo;{replyTargetReview.body}&rdquo;
                                </p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-mono uppercase text-zinc-500">Official Brand Response *</label>
                                <textarea
                                  rows={4}
                                  required
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Thank you for your feedback! Our quality assurance team has noted this..."
                                  className="w-full p-3 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyModalOpen(false)}
                                  className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={submittingReply || !replyText.trim()}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{submittingReply ? "Publishing..." : "Publish Reply"}</span>
                                </button>
                              </div>
                            </form>
                          </div>
                        )
                      }

                      {/* Delete Confirmation Modal */ }
                      {
                        deleteModalOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#15101F] border border-zinc-200 dark:border-white/15 p-6 shadow-2xl space-y-4">
                              <h3 className="text-base font-bold text-rose-600">Delete Review</h3>
                              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                Are you sure you want to delete this customer review? This action cannot be undone and will automatically recalculate the product&apos;s rating average and count.
                              </p>
                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteModalOpen(false);
                                    setDeleteTargetId(null);
                                  }}
                                  className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={confirmDelete}
                                  disabled={deleting}
                                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                  {deleting ? "Deleting..." : "Confirm Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      }
      </div>
            </PageTransition>
            );
}