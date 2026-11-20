"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, CheckCircle2, ShieldCheck } from "lucide-react";

export default function CustomerReviewPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<{ orderNumber: string; productId: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [printClarity, setPrintClarity] = useState(5);
  const [fabricFeel, setFabricFeel] = useState(5);
  const [colourMatch, setColourMatch] = useState(5);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyToken() {
      if (!token) return;
      try {
        const res = await fetch(`/api/reviews?token=${token}`);
        if (res.ok) {
          const json = await res.json();
          setTokenInfo(json);
        } else {
          // Token may be demo or invalid, allow general review
          setTokenInfo({ orderNumber: "PF-ORDER", productId: "prod_hoodie_01" });
        }
      } catch {
        setTokenInfo({ orderNumber: "PF-ORDER", productId: "prod_hoodie_01" });
      } finally {
        setLoading(false);
      }
    }
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fullBody = `${body}\n\n[Custom Print Feedback: Print Clarity: ${printClarity}/5, Fabric Feel: ${fabricFeel}/5, Colour Match: ${colourMatch}/5]`;
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: tokenInfo?.productId || "prod_hoodie_01",
          orderNumber: tokenInfo?.orderNumber,
          authorName,
          rating,
          title,
          body: fullBody,
          photoUrls: photoUrl ? [photoUrl] : [],
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Submission failed");
      }
      setSubmitted(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 text-xs font-mono text-[#15101F]/60">
        Verifying merchandise delivery invitation...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#15101F]/10 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-display font-black text-2xl text-[#15101F]">
            Review Received!
          </h2>
          <p className="text-sm font-sans text-[#15101F]/70">
            {submitted.message}
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-[#15101F] text-white text-xs font-mono font-bold hover:bg-[#221A31] transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#15101F]/10 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#6A2CFF] font-bold">
              Verified Order Review
            </span>
            <ShieldCheck className="w-4 h-4 text-[#6A2CFF]" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight mt-1">
            How was your custom merchandise?
          </h1>
          <p className="text-xs font-mono text-[#15101F]/60 mt-1">
            Order #{tokenInfo?.orderNumber} • Share your feedback to assist our atelier craftsmanship
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-[#15101F]/80 mb-2">
              Overall Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-[#15101F]/20"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-bold text-[#15101F] ml-2">
                {rating === 5 ? "Exceptional" : rating === 4 ? "Great Quality" : rating === 3 ? "Average" : "Needs Improvement"}
              </span>
            </div>
          </div>

          {/* Custom Print Feedback Parameters */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-3">
            <div className="text-xs font-mono font-bold text-[#15101F]">
              Custom Print Craftsmanship Ratings
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-[#15101F]/70 mb-1">
                <span>Print Clarity & Detail</span>
                <span className="font-bold">{printClarity}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={printClarity}
                onChange={(e) => setPrintClarity(parseInt(e.target.value, 10))}
                className="w-full accent-[#6A2CFF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-[#15101F]/70 mb-1">
                <span>Fabric Feel & GSM Weight</span>
                <span className="font-bold">{fabricFeel}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={fabricFeel}
                onChange={(e) => setFabricFeel(parseInt(e.target.value, 10))}
                className="w-full accent-[#6A2CFF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-[#15101F]/70 mb-1">
                <span>Pantone / Brand Colour Match</span>
                <span className="font-bold">{colourMatch}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={colourMatch}
                onChange={(e) => setColourMatch(parseInt(e.target.value, 10))}
                className="w-full accent-[#6A2CFF]"
              />
            </div>
          </div>

          {/* Author Name */}
          <div>
            <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
              Your Name / Title
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              placeholder="e.g. Priya Sharma (Operations Lead)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
              Review Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Flawless embroidery and delivered 2 days ahead of schedule"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
              Detailed Experience
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Share how the merchandise was received by your team or clients..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
            />
          </div>

          {/* Photo URL / Upload */}
          <div>
            <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Verified Review"}
          </button>
        </form>
      </div>
    </div>
  );
}