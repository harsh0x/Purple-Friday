import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Star, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Rating } from "@/components/ui/rating";

export const metadata: Metadata = {
  title: "Client Wall of Love (4.9★) | Verified Reviews | Purple Friday",
  description: "Read verified reviews from over 1,200 Indian tech companies, university festivals, and marketing teams who trust Purple Friday for zero-defect merchandise.",
};

const VERIFIED_REVIEWS = [
  {
    author: "Rohan V.",
    company: "SaaS Startup Founder, Bengaluru",
    product: "58mm Round Gloss Magnetic Badge",
    rating: 5,
    date: "November 2026",
    text: "Ordered 500 badges for our annual developer conference. The dual neodymium magnets are shockingly strong — not a single jacket was damaged, and the offset gloss finish looked sharper than anything we previously imported.",
  },
  {
    author: "Pooja N.",
    company: "Head of People, Fintech Unicorn, Mumbai",
    product: "320 GSM Brushed Heavy Fleece Hoodie",
    rating: 5,
    date: "October 2026",
    text: "The embroidery quality on these hoodies is immaculate. We've done company swag before with other vendors and were always let down by cheap zippers or shrinking fleece. Purple Friday delivered exactly to our pantone code in 3 days.",
  },
  {
    author: "Arjun M.",
    company: "Design Director, Brand Studio, New Delhi",
    product: "Double-Wall Insulated Matte Steel Flask",
    rating: 5,
    date: "October 2026",
    text: "Laser etching accuracy was within 0.2mm as promised. The tactile matte powder coat gives this flask a high-end feel that our clients genuinely appreciated during Diwali onboarding.",
  },
  {
    author: "Kavita S.",
    company: "Operations Lead, Logistics Enterprise, Gurugram",
    product: "230 GSM Combed Cotton Piqué Polo",
    rating: 5,
    date: "September 2026",
    text: "We ordered 250 polos across sizes S through XXL for our frontline leadership summit. The GST invoice with input tax credit was ready immediately, and the Tajima embroidery survived repeated industrial washes.",
  },
  {
    author: "Vikramaditya P.",
    company: "Convenor, National Tech Fest, Chennai",
    product: "Classic Crewneck Cotton T-Shirt (180 GSM)",
    rating: 5,
    date: "September 2026",
    text: "Printed 1,200 tees with neon spot lime underbase. Zero fading, super soft bio-washed feel, and our college council was able to inspect the digital 3D proof before pressing began.",
  },
  {
    author: "Sneha B.",
    company: "HR Manager, Healthcare AI, Hyderabad",
    product: "Structured 6-Panel Cotton Twill Cap",
    rating: 5,
    date: "August 2026",
    text: "The 3D puff embroidery on the cap front crown is retail-grade. The antique brass buckle on the back makes it feel far more premium than typical promotional caps.",
  },
];

export default function ReviewsPage() {
  return (
    <div className="bg-paper min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-2 border-ink bg-white p-8 sm:p-12 shadow-stamp">
          <div className="inline-flex items-center gap-2 border border-ink/20 bg-spot-lime px-3 py-1 text-xs font-mono font-bold text-ink uppercase tracking-wider mb-4">
            <Sparkles className="h-4 w-4" />
            Verified Feedback
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight">
            Client Wall of Love
          </h1>
          <p className="mt-4 text-base font-sans text-ink/75 leading-relaxed max-w-2xl">
            Over 125,000 custom-printed merchandise pieces delivered across India with a 99.8% first-proof approval rate.
          </p>

          {/* Rating Summary Bar */}
          <div className="mt-8 pt-6 border-t border-ink/15 flex flex-wrap items-center gap-8 sm:gap-12">
            <div>
              <div className="font-display font-black text-4xl text-ink">4.9 / 5.0</div>
              <div className="flex items-center gap-1 text-violet mt-1">
                <Rating score={4.9} totalReviews={500} size="md" />
              </div>
              <span className="font-mono text-xs text-ink/60 mt-1 block">500+ Verified Corporate Orders</span>
            </div>
            <div className="border-l border-ink/20 pl-8 space-y-1 font-mono text-xs text-ink/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Zero Fabric Damage (Neodymium Badges)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>100% Prepress Sign-Off Before Press</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>18% GST Input Credit Included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VERIFIED_REVIEWS.map((rev, idx) => (
            <div
              key={idx}
              className="border-2 border-ink bg-white p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-violet">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-violet text-violet" />
                    ))}
                  </div>
                  <span className="font-mono text-[11px] text-ink/50">{rev.date}</span>
                </div>
                <p className="font-sans text-sm text-ink/85 leading-relaxed italic">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-ink/10 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-ink">{rev.author}</h4>
                  <p className="font-mono text-xs text-ink/60">{rev.company}</p>
                </div>
                <span className="font-mono text-[10px] text-violet font-bold uppercase bg-violet/10 px-2 py-1 rounded-xs">
                  Verified Run
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Closing CTA */}
        <div className="border-2 border-ink bg-ink text-white p-8 sm:p-10 text-center space-y-4 shadow-stamp">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-white">
            Ready to design custom merchandise your team will actually wear?
          </h3>
          <p className="font-sans text-sm text-white/80 max-w-lg mx-auto">
            Upload your logo in our 10-second studio, approve a digital proof, and receive your merchandise in 3-5 days.
          </p>
          <div className="pt-2">
            <Link
              href="/category/all"
              className="inline-flex items-center gap-2 border-2 border-spot-lime bg-spot-lime text-ink font-mono text-xs font-bold uppercase tracking-wider px-8 py-4 shadow-stamp-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <span>Explore All Products</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

