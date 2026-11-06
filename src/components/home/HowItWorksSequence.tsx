"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "../ui/section-heading";
import { RegistrationMark, CropCorners } from "../ui/decorative";
import { UploadCloud, CheckCircle, Truck } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Upload Vector Logo & Select Blank",
    description: "Drop your brand SVG, PNG, or PDF file. Choose from bio-washed cotton, magnetic fasteners, or executive stainless steel. Our studio automatically positions your artwork within safe print margins.",
    icon: UploadCloud,
    tag: "Vector Ingestion",
  },
  {
    step: "02",
    title: "Sign-Off on 3D Digital Prepress Proof",
    description: "Our prepress engineers check resolution, pantone alignment, and underbase opacity. You inspect and approve an interactive 3D digital proof before any machine begins production.",
    icon: CheckCircle,
    tag: "100% Quality Gate",
  },
  {
    step: "03",
    title: "Precision Pressing & Air Dispatch",
    description: "Direct-to-garment, spot screen printing, or laser etching executes in our Bengaluru atelier. Carefully packed with individual protective sleeves and air-couriered to your office doorstep.",
    icon: Truck,
    tag: "Express Delivery",
  },
];

export function HowItWorksSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run pinned scroll sequence on desktop pointer devices
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isDesktop || prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Step panels timeline
      const cards = gsap.utils.toArray<HTMLElement>(".how-it-works-card");

      if (cards.length > 0 && pinSectionRef.current) {
        gsap.to(cards, {
          yPercent: -100 * (cards.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: pinSectionRef.current,
            pin: true,
            scrub: 1,
            snap: 1 / (cards.length - 1),
            start: "top top+=80",
            end: () => `+=${pinSectionRef.current?.offsetHeight || 600 * 2}`,
            invalidateOnRefresh: true,
          },
        });
      }
    }, containerRef);

    // Refresh after fonts are loaded to avoid layout jumps
    document.fonts?.ready?.then(() => {
      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-paper border-b border-ink/20 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Prepress Protocol"
          title="From Vector to Pressed Merchandise"
          description="A deterministic 3-step quality pipeline ensuring every single piece matches your exact brand guidelines."
        />

        {/* Desktop Pinned Scroll Container / Mobile Stacked */}
        <div ref={pinSectionRef} className="relative overflow-hidden rounded-sm border-2 border-ink bg-paper-pure shadow-stamp-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Static Indicator Column */}
            <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-ink/20 flex flex-col justify-between bg-paper">
              <div>
                <div className="flex items-center gap-2 text-violet mb-3">
                  <RegistrationMark size={16} variant="violet" />
                  <span className="font-mono text-xs uppercase font-bold tracking-widest">
                    Three-Stage Verification
                  </span>
                </div>
                <h3 className="heading-sub font-black text-ink">
                  How Purple Friday Works
                </h3>
                <p className="text-xs sm:text-sm font-sans text-ink/70 mt-2 leading-relaxed">
                  Every order is checked by human prepress technicians before hitting physical production lines.
                </p>
              </div>

              <div className="pt-8 font-mono text-xs text-ink/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet" />
                  <span>Stage 1: Artwork resolution verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-spot-lime-dark" />
                  <span>Stage 2: Customer digital proof sign-off</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ink" />
                  <span>Stage 3: Automated courier tracking update</span>
                </div>
              </div>
            </div>

            {/* Right Sliding Steps Column */}
            <div className="lg:col-span-7 h-[500px] overflow-hidden relative">
              <div className="h-full flex flex-col">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.step}
                      className="how-it-works-card h-[500px] p-8 sm:p-12 flex flex-col justify-center space-y-6 shrink-0 bg-paper-pure relative"
                    >
                      <CropCorners offset={6} length={12} />
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-5xl text-violet">
                          {step.step}
                        </span>
                        <span className="font-mono text-xs uppercase font-bold text-ink bg-spot-lime px-3 py-1 rounded-full border border-ink/20 flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{step.tag}</span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="heading-sub font-extrabold text-ink">
                          {step.title}
                        </h4>
                        <p className="text-sm sm:text-base font-sans text-ink/75 leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-ink/10 flex items-center justify-between text-xs font-mono text-ink/50">
                        <span>Quality Checked Step {idx + 1} of 3</span>
                        <span>Stage Verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

