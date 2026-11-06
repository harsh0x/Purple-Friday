"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function ClosingCtaBand() {
  return (
    <section className="relative bg-pf-ink text-white py-24 px-4 md:px-8 overflow-hidden">
      {/* Halftone / Registration Mark Grid Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#CDB8FF 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Decorative Registration Marks on 4 Corners */}
      <div className="absolute top-4 left-4 font-mono text-xs text-white/40 flex items-center gap-1 select-none">
        <span>+</span>
        <span>REG_MARK_TL</span>
      </div>
      <div className="absolute top-4 right-4 font-mono text-xs text-white/40 flex items-center gap-1 select-none">
        <span>REG_MARK_TR</span>
        <span>+</span>
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-xs text-white/40 flex items-center gap-1 select-none">
        <span>+</span>
        <span>OFFSET_ALIGN_01</span>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-xs text-white/40 flex items-center gap-1 select-none">
        <span>COLOR_BAR: C•M•Y•K•V</span>
        <span>+</span>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Tiny top chip */}
        <div className="inline-flex items-center gap-2 border border-pf-lime/40 bg-pf-lime/10 px-4 py-1.5 text-xs font-mono font-bold text-pf-lime uppercase tracking-widest mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          The Direct-to-Floor Advantage
        </div>

        {/* Big Editorial Headline */}
        <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-white">
          Ready to put your logo on <br className="hidden sm:inline" />
          <span className="text-pf-lilac underline decoration-pf-lime decoration-4 underline-offset-8">
            merchandise you’re actually proud of?
          </span>
        </h2>

        <p className="mt-6 text-base sm:text-lg font-sans text-white/75 max-w-2xl mx-auto leading-relaxed">
          Upload your logo in 10 seconds, preview it across 10 custom product categories, and get calibrated proofs approved before a single thread is stitched or badge is pressed.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/collections/all"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 border-2 border-pf-lime bg-pf-lime text-pf-ink font-mono text-sm font-black uppercase tracking-wider px-8 py-4 shadow-[5px_5px_0_0_#6A2CFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#6A2CFF] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            <span>Explore All Products</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white/30 bg-transparent text-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-4 hover:border-white hover:bg-white/10 transition-all"
          >
            <span>Talk to Pre-Press Specialist</span>
          </Link>
        </div>

        {/* Reassurances row */}
        <div className="mt-12 pt-8 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-white/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pf-lime shrink-0" />
            <span>Zero Setup or Screen Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pf-lime shrink-0" />
            <span>100% Pre-Print WhatsApp Signoff</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pf-lime shrink-0" />
            <span>Pan-India Air Express Delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
}

