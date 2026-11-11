"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Factory, ShieldCheck, Flame, Compass } from "lucide-react";

export function FactoryTeamSection() {
  return (
    <section className="relative border-b-2 border-ink bg-paper py-20 px-4 md:px-8 overflow-hidden">
      {/* Decorative Registration Marks */}
      <span className="absolute top-4 right-6 font-mono text-xs text-ink/30 select-none">
        ATELIER FLOOR // BENGALURU & TIRUPUR ⌖
      </span>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left / Editorial Image & Proof Area (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative border-2 border-ink bg-white p-4 shadow-[6px_6px_0_0_#15101F]">
              {/* Halftone / Technical Header */}
              <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4 font-mono text-xs text-ink/70">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet" />
                  <span className="font-bold uppercase tracking-wider text-ink">
                    Production Unit 01 • Heavy Textile & Metal Lab
                  </span>
                </div>
                <span>400 GSM TEST RUN #884</span>
              </div>

              {/* Graphic Factory Illustration / Showcase Frame */}
              <div className="relative aspect-[16/10] bg-ink text-white overflow-hidden border border-ink/20 flex flex-col justify-between p-6">
                {/* Technical blueprint overlay */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                  }}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <span className="font-mono text-xs text-spot-lime uppercase tracking-widest border border-spot-lime/40 px-2 py-1">
                    Direct-From-Floor
                  </span>
                  <Factory className="h-6 w-6 text-lilac opacity-80" />
                </div>

                <div className="relative z-10 space-y-2">
                  <span className="font-mono text-xs text-lilac tracking-wider uppercase">
                    No middlemen. No broker markups.
                  </span>
                  <h4 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    Every seam, cut, and print proofed by master pressmen.
                  </h4>
                  <p className="text-xs sm:text-sm font-sans text-white/80 max-w-lg">
                    We own our 8-color Tajima embroidery rigs and industrial direct-to-garment printers in Bengaluru and Tirupur. You deal straight with the craftspeople executing your order.
                  </p>
                </div>

                {/* Calibration Footer Strip */}
                <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] font-mono text-white/60">
                  <span>C • M • Y • K • SPOT VIOLET</span>
                  <span>100% IN-HOUSE CALIBRATION</span>
                </div>
              </div>

              {/* Caption */}
              <div className="mt-3 flex items-center justify-between text-xs font-mono text-ink/60">
                <span>PRESS SPEC: ISO 12647-2 CERTIFIED COLOUR PROFILES</span>
                <span>TOLERANCE: ±0.2MM</span>
              </div>
            </div>
          </div>

          {/* Right / Information & Stat Counters (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 border border-ink/20 bg-spot-lime px-3 py-1 text-xs font-mono font-bold text-ink uppercase tracking-wider mb-4 shadow-[2px_2px_0_0_#15101F]">
                The Workshop
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
                Built by makers, not drop-shippers.
              </h2>
              <p className="mt-4 text-base font-sans text-ink/75 leading-relaxed">
                Most custom merchandise websites are drop-ship middlemen routing orders to unverified vendors. Purple Friday operates our own print lines, embroidery heads, and laser cutters.
              </p>
            </div>

            {/* Micro stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-ink bg-white p-4 shadow-[3px_3px_0_0_#15101F]">
                <div className="flex items-center gap-2 text-violet mb-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-mono text-xs font-bold uppercase">Pre-Flight</span>
                </div>
                <div className="font-mono text-2xl font-black text-ink">99.8%</div>
                <p className="text-xs font-sans text-ink/65 mt-1">First-proof approval rate</p>
              </div>

              <div className="border-2 border-ink bg-white p-4 shadow-[3px_3px_0_0_#15101F]">
                <div className="flex items-center gap-2 text-violet mb-1">
                  <Flame className="h-4 w-4" />
                  <span className="font-mono text-xs font-bold uppercase">Apparel Rigs</span>
                </div>
                <div className="font-mono text-2xl font-black text-ink">14 Heads</div>
                <p className="text-xs font-sans text-ink/65 mt-1">High-density Tajima stitchers</p>
              </div>

              <div className="border-2 border-ink bg-white p-4 shadow-[3px_3px_0_0_#15101F]">
                <div className="flex items-center gap-2 text-violet mb-1">
                  <Factory className="h-4 w-4" />
                  <span className="font-mono text-xs font-bold uppercase">Daily Output</span>
                </div>
                <div className="font-mono text-2xl font-black text-ink">8,500+</div>
                <p className="text-xs font-sans text-ink/65 mt-1">Badges and shirts per day</p>
              </div>

              <div className="border-2 border-ink bg-white p-4 shadow-[3px_3px_0_0_#15101F]">
                <div className="flex items-center gap-2 text-violet mb-1">
                  <Compass className="h-4 w-4" />
                  <span className="font-mono text-xs font-bold uppercase">Dispatch</span>
                </div>
                <div className="font-mono text-2xl font-black text-ink">24-48h</div>
                <p className="text-xs font-sans text-ink/65 mt-1">Standard turnaround</p>
              </div>
            </div>

            {/* CTA Link */}
            <div>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 border-2 border-ink bg-violet text-white font-mono text-sm font-bold px-6 py-3.5 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                <span>Read Our Manufacturing Story</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

