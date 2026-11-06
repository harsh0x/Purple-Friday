"use client";

import React, { useState } from "react";
import { Star, ShieldCheck } from "lucide-react";
import { SectionHeading } from "../ui/section-heading";
import { CropCorners } from "../ui/decorative";

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  company: string;
  title: string;
  body: string;
  rating: number;
  product: string;
}

const REVIEWS_ROW_1: ReviewItem[] = [
  {
    id: "r1",
    name: "Rohit Deshmukh",
    role: "VP Engineering",
    company: "Fintech Scaleup Bengaluru",
    title: "Neodymium magnets are remarkably strong",
    body: "We ordered 200 magnetic badges for our annual summit. The offset print was razor-sharp and the magnets held firmly through heavy winter blazers without tearing a single thread.",
    rating: 5,
    product: "58mm Round Magnetic Badge",
  },
  {
    id: "r2",
    name: "Ananya Sen",
    role: "People Operations Lead",
    company: "SaaS Enterprise Gurugram",
    title: "Colors matched our brand guidelines 1:1",
    body: "Our brand purple is notoriously difficult to reproduce in textile dyes. Purple Friday's prepress team sent a digital proof with pantone calibrations that matched our Figma tokens perfectly.",
    rating: 5,
    product: "Classic 180 GSM Crewneck Tee",
  },
  {
    id: "r3",
    name: "Karthik Raja",
    role: "Founder",
    company: "AI Studio Mumbai",
    title: "Proof approval before print saved our run",
    body: "We had a slight 2mm misalignment in our uploaded SVG. Their prepress team flagged it in the 3D proof before printing 150 hoodies. Extraordinary attention to detail.",
    rating: 5,
    product: "320 GSM Pullover Fleece Hoodie",
  },
];

const REVIEWS_ROW_2: ReviewItem[] = [
  {
    id: "r4",
    name: "Meera Nair",
    role: "Events Convenor",
    company: "IIT Madras Alumni Association",
    title: "3D Puff embroidery on caps was immaculate",
    body: "Ordered 300 structured twill caps for our reunion. The high-density puff stitching on the front crown is dense, crisp, and feels indestructible.",
    rating: 5,
    product: "Structured 6-Panel Twill Cap",
  },
  {
    id: "r5",
    name: "Siddharth Jain",
    role: "Campus Ambassador",
    company: "BITS Pilani Tech Fest",
    title: "Arrived 2 days ahead of schedule",
    body: "Express air courier to Rajasthan arrived 48 hours early. Zero defective units across a massive bulk drop. Will exclusively procure from Purple Friday going forward.",
    rating: 5,
    product: "Athletic Quick-Dry Poly Tee",
  },
  {
    id: "r6",
    name: "Divya Krishnan",
    role: "Design Lead",
    company: "Creative Studio Hyderabad",
    title: "Laser engraving on pens is jewelry grade",
    body: "Weighted brass pens in custom debossed boxes made the finest onboarding kits for our new executive hires. Solid tactile feedback and German Schmidt ink refills.",
    rating: 5,
    product: "Executive Brass Twist Pen",
  },
];

export function CustomerReviewMarquee() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="w-full bg-paper border-b border-ink/20 py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <SectionHeading
          eyebrow="Wall of Love"
          title="Verified Corporate Procurement Reviews"
          description="Real feedback from HR leaders, event directors, and startup founders across India."
        />
      </div>

      {/* Marquee Wrapper (Pauses on hover; Static grid on reduced motion) */}
      <div
        className="space-y-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Row 1 */}
        <div className="flex gap-6 overflow-hidden motion-reduce:flex-wrap motion-reduce:justify-center">
          <div
            className={`flex gap-6 shrink-0 transition-transform ${
              isPaused ? "" : "animate-[marquee_35s_linear_infinite]"
            } motion-reduce:animate-none`}
          >
            {[...REVIEWS_ROW_1, ...REVIEWS_ROW_1].map((rev, i) => (
              <ReviewCard key={`r1-${i}`} review={rev} />
            ))}
          </div>
        </div>

        {/* Row 2 (Reverse direction) */}
        <div className="flex gap-6 overflow-hidden motion-reduce:hidden">
          <div
            className={`flex gap-6 shrink-0 transition-transform ${
              isPaused ? "" : "animate-[marquee-reverse_38s_linear_infinite]"
            }`}
          >
            {[...REVIEWS_ROW_2, ...REVIEWS_ROW_2].map((rev, i) => (
              <ReviewCard key={`r2-${i}`} review={rev} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div className="w-[340px] sm:w-[380px] p-5 border border-ink/20 bg-paper-pure rounded-sm shadow-card shrink-0 flex flex-col justify-between relative select-none">
      <CropCorners offset={4} length={8} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex text-violet">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-violet stroke-violet" />
            ))}
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-spot-lime-dark bg-spot-lime/30 px-2 py-0.5 rounded-full border border-ink/20 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Verified Order
          </span>
        </div>

        <h4 className="font-display font-bold text-sm text-ink leading-snug">
          &ldquo;{review.title}&rdquo;
        </h4>

        <p className="font-sans text-xs text-ink/75 leading-relaxed">
          {review.body}
        </p>
      </div>

      <div className="pt-3 mt-3 border-t border-ink/10 flex items-center justify-between text-[11px] font-mono">
        <div>
          <p className="font-bold text-ink">{review.name}</p>
          <p className="text-ink/60">{review.role}, {review.company}</p>
        </div>
        <span className="text-[10px] text-violet font-semibold">
          {review.product}
        </span>
      </div>
    </div>
  );
}

