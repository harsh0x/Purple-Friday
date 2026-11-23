"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Star, ShieldCheck, Camera, X, CheckCircle2, ChevronDown, Filter } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  name: string;
  company: string;
  role: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  hasPhoto?: boolean;
  photoCaption?: string;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Arjun Venkataraman",
    company: "Postman API",
    role: "Community Lead",
    rating: 5,
    date: "14 Oct 2026",
    title: "Neodymium magnetic fasteners held firmly through 3 full conference days",
    comment:
      "We ordered 350 pieces for our API summit. The offset gloss lamination was spotless and the rare-earth dual magnets held onto heavy blazers without falling or damaging attendees' expensive suiting. Absolutely stellar prepress work.",
    verifiedBuyer: true,
    hasPhoto: true,
    photoCaption: "Proof sample on wool jacket",
  },
  {
    id: "rev-2",
    name: "Meera Krishnan",
    company: "Groww",
    role: "Brand Designer",
    rating: 5,
    date: "02 Oct 2026",
    title: "Pantone spot color matching was 100% true to our brand guidelines",
    comment:
      "Most digital printers shift our brand violet into muddy blue. Purple Friday's prepress team sent a digital color-split proof within 90 minutes and the delivered run was dead-accurate under daylight. Highly recommend.",
    verifiedBuyer: true,
    hasPhoto: true,
    photoCaption: "Pantone spot color proof verification",
  },
  {
    id: "rev-3",
    name: "Nikhil Bansal",
    company: "CRED",
    role: "Internal Comms",
    rating: 4,
    date: "21 Sep 2026",
    title: "Heavyweight 240 GSM tees have that premium streetwear drape",
    comment:
      "The collars are thick and don't bacon after washes. Printing is high-density puff and feels substantial. Took 4 days to deliver to Indiranagar, Bengaluru. Smooth process.",
    verifiedBuyer: true,
    hasPhoto: false,
  },
  {
    id: "rev-4",
    name: "Siddharth Rao",
    company: "Fintech Leader",
    role: "HR Operations",
    rating: 5,
    date: "08 Sep 2026",
    title: "Zero hassles with GST 18% invoicing and corporate purchase orders",
    comment:
      "We needed an official tax invoice with input tax credit for finance clearance. The invoice came with the package and on email with all SAC codes properly marked.",
    verifiedBuyer: true,
    hasPhoto: true,
    photoCaption: "Unboxing bulk carton with individual packaging",
  },
];

export function ProductReviewsSection({
  productName,
  overallRating = 4.9,
  totalReviews = 42,
}: {
  productName: string;
  overallRating?: number;
  totalReviews?: number;
}) {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "highest">("newest");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New review form state
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [photoAdded, setPhotoAdded] = useState(false);

  // Filter & sort
  const filteredReviews = reviews
    .filter((r) => (ratingFilter ? r.rating === ratingFilter : true))
    .sort((a, b) => {
      if (sortOrder === "highest") return b.rating - a.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newComment || !newName) {
      toast.error("Please fill in all required review fields.");
      return;
    }

    const createdReview: Review = {
      id: `rev-${Date.now()}`,
      name: newName,
      company: newCompany || "Verified Company",
      role: "Verified Client",
      rating: newRating,
      date: "Just now",
      title: newTitle,
      comment: newComment,
      verifiedBuyer: true,
      hasPhoto: photoAdded,
      photoCaption: photoAdded ? "Customer uploaded verification" : undefined,
    };

    setReviews([createdReview, ...reviews]);
    toast.success("Thank you! Your verified review has been published.");
    setDialogOpen(false);
    // Reset form
    setNewTitle("");
    setNewComment("");
    setNewName("");
    setNewCompany("");
    setPhotoAdded(false);
  };

  return (
    <section className="border-t-2 border-ink bg-white py-16 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 border border-ink/20 bg-lilac/30 px-3 py-1 text-xs font-mono font-bold text-ink uppercase tracking-wider mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-violet" />
              100% Verified Buyer Feedback
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Client proofs & reviews
            </h2>
            <p className="mt-2 text-sm text-ink/75 font-sans">
              Real Indian companies, real print runs. Read how {productName} performs in the field.
            </p>
          </div>

          <button
            onClick={() => setDialogOpen(true)}
            className="self-start md:self-end border-2 border-ink bg-violet text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 shadow-[3px_3px_0_0_#15101F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#15101F] transition-all"
          >
            Write a Review
          </button>
        </div>

        {/* Rating Breakdown Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 border-2 border-ink bg-paper mb-10 shadow-[4px_4px_0_0_#15101F]">
          {/* Overall Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-ink/15 pb-6 md:pb-0 md:pr-6">
            <span className="font-mono text-5xl font-black text-ink">
              {overallRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-violet my-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-violet text-violet" />
              ))}
            </div>
            <span className="font-mono text-xs text-ink/60">
              Based on {totalReviews} client runs
            </span>
          </div>

          {/* Breakdown Bars */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2">
            {[
              { stars: 5, pct: 88, count: 37 },
              { stars: 4, pct: 10, count: 4 },
              { stars: 3, pct: 2, count: 1 },
              { stars: 2, pct: 0, count: 0 },
              { stars: 1, pct: 0, count: 0 },
            ].map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-12 text-ink font-bold">{row.stars} Stars</span>
                <div className="flex-1 h-3 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
                  <div
                    className="h-full bg-violet"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-8 text-ink/60 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-ink mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-violet" />
            <span className="font-mono text-xs font-bold text-ink uppercase">Filter:</span>
            <div className="flex flex-wrap gap-1.5">
              {[null, 5, 4].map((star) => (
                <button
                  key={star ?? "all"}
                  onClick={() => setRatingFilter(star)}
                  className={`px-3 py-1 font-mono text-xs border transition-all ${ratingFilter === star
                      ? "border-ink bg-ink text-white font-bold"
                      : "border-ink/20 bg-white text-ink hover:border-ink"
                    }`}
                >
                  {star ? `${star} Stars` : "All Reviews"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink/60">Sort:</span>
            <div className="relative inline-flex items-center">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "highest")}
                aria-label="Sort reviews"
                className="appearance-none border-2 border-ink bg-white font-mono text-xs font-bold pl-3 pr-7 py-1 shadow-[2px_2px_0_0_#15101F] focus:outline-none cursor-pointer"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rated</option>
              </select>
              <ChevronDown className="h-3 w-3 absolute right-2 pointer-events-none text-ink" />
            </div>
          </div>
        </div>

        {/* Customer Photo Masonry & Review List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((rev) => (
            <article
              key={rev.id}
              className="border-2 border-ink bg-white p-6 shadow-[3px_3px_0_0_#15101F] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-violet">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-violet text-violet" />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-ink/50">{rev.date}</span>
                </div>

                <h3 className="font-display text-base font-bold text-ink leading-snug mb-2">
                  {rev.title}
                </h3>
                <p className="text-xs font-sans text-ink/75 leading-relaxed mb-4">
                  {rev.comment}
                </p>

                {/* Customer Photo Attachment */}
                {rev.hasPhoto && (
                  <div className="mb-4 p-3 border border-dashed border-ink/30 bg-paper flex items-center gap-3">
                    <div className="h-10 w-10 border border-ink bg-violet/10 flex items-center justify-center shrink-0">
                      <Camera className="h-5 w-5 text-violet" />
                    </div>
                    <div className="text-left font-mono text-[11px] text-ink">
                      <span className="font-bold block">Specimen Photo Verified</span>
                      <span className="text-ink/60">{rev.photoCaption}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-ink/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="font-bold text-ink block">{rev.name}</span>
                  <span className="text-[11px] text-ink/60">
                    {rev.role} • {rev.company}
                  </span>
                </div>
                {rev.verifiedBuyer && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Order
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Write a Review Modal (Radix Dialog) */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg bg-white border-2 border-ink p-6 shadow-[8px_8px_0_0_#15101F] focus:outline-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink mb-4">
              <Dialog.Title className="font-display text-lg font-bold text-ink">
                Review Your Run: {productName}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label="Close dialog"
                  className="p-1 rounded-full border border-ink hover:bg-paper"
                >
                  <X className="h-5 w-5 text-ink" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block font-mono text-xs font-bold text-ink uppercase mb-2">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRating(s)}
                      className="p-1 text-violet hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${s <= newRating ? "fill-violet text-violet" : "text-ink/30"
                          }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono text-xs font-bold ml-2 text-ink">
                    {newRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharp typography, solid magnets, arrived in 3 days"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none focus:ring-2 focus:ring-violet"
                />
              </div>

              {/* Review Body */}
              <div>
                <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                  Detailed Experience
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How was the print clarity? Did the colors match? How did the fabric or fasteners feel?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none focus:ring-2 focus:ring-violet resize-none"
                />
              </div>

              {/* Author & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Mehta"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-10 px-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zerodha"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full h-10 px-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Photo Attachment */}
              <div className="border border-dashed border-ink/40 p-3 bg-paper flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-violet" />
                  <span className="font-mono text-xs text-ink">
                    Attach specimen photo proof
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoAdded(!photoAdded)}
                  className={`font-mono text-xs px-2.5 py-1 border transition-all ${photoAdded
                      ? "border-emerald-600 bg-emerald-100 text-emerald-800 font-bold"
                      : "border-ink/30 bg-white text-ink hover:border-ink"
                    }`}
                >
                  {photoAdded ? "Photo Attached ✓" : "Upload Photo"}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full border-2 border-ink bg-violet text-white font-mono text-sm font-bold uppercase tracking-wider py-3 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] transition-all"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

