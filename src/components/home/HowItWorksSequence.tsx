"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "../ui/section-heading";
import { RegistrationMark, CropCorners } from "../ui/decorative";
import { UploadCloud, CheckCircle, Truck, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    stage: "Stage 1: Artwork resolution verification",
    title: "Upload Vector Logo & Select Blank",
    description: "Drop your brand SVG, PNG, or PDF file. Choose from bio-washed cotton, magnetic fasteners, or executive stainless steel. Our studio automatically positions your artwork within safe print margins.",
    icon: UploadCloud,
    tag: "Vector Ingestion",
  },
  {
    step: "02",
    stage: "Stage 2: Customer digital proof sign-off",
    title: "Sign-Off on 3D Digital Prepress Proof",
    description: "Our prepress engineers check resolution, pantone alignment, and underbase opacity. You inspect and approve an interactive 3D digital proof before any machine begins production.",
    icon: CheckCircle,
    tag: "100% Quality Gate",
  },
  {
    step: "03",
    stage: "Stage 3: Automated courier tracking update",
    title: "Precision Pressing & Air Dispatch",
    description: "Direct-to-garment, spot screen printing, or laser etching executes in our Bengaluru atelier. Carefully packed with individual protective sleeves and air-couriered to your office doorstep.",
    icon: Truck,
    tag: "Express Delivery",
  },
];

export function HowItWorksSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinSectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const stRef = useRef<ScrollTrigger | null>(null);

  // Swipe detection for mobile touchscreens
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goToStep = (index: number) => {
    const targetIndex = Math.max(0, Math.min(STEPS.length - 1, index));
    setActiveStep(targetIndex);

    const st = stRef.current;
    if (st && st.pin) {
      const totalDist = st.end - st.start;
      const targetScroll = st.start + (targetIndex / (STEPS.length - 1)) * totalDist;
      window.scrollTo({
        top: targetScroll + 2,
        behavior: "smooth",
      });
    } else {
      const cards = containerRef.current?.querySelectorAll<HTMLElement>(".how-it-works-card");
      if (cards && cards.length > 0) {
        gsap.to(cards, {
          yPercent: -100 * targetIndex,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger when horizontal swipe exceeds vertical delta and minimum distance
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0 && activeStep < STEPS.length - 1) {
        goToStep(activeStep + 1);
      } else if (deltaX > 0 && activeStep > 0) {
        goToStep(activeStep - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    // 1. Desktop Breakpoint (>= 1024px): Pinned scroll scrubbing timeline
    mm.add("(min-width: 1024px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(".how-it-works-card");
      if (cards.length > 0 && pinSectionRef.current) {
        const tween = gsap.to(cards, {
          yPercent: -100 * (cards.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: pinSectionRef.current,
            pin: true,
            scrub: 1,
            snap: 1 / (cards.length - 1),
            start: "top top+=80",
            end: () => `+=${pinSectionRef.current?.offsetHeight ? pinSectionRef.current.offsetHeight * 1.5 : 850}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const step = Math.min(STEPS.length - 1, Math.max(0, Math.round(self.progress * (STEPS.length - 1))));
              setActiveStep(step);
            },
          },
        });
        stRef.current = tween.scrollTrigger || null;
      }
      return () => {
        stRef.current = null;
      };
    });

    // 2. Mobile & Tablet Portrait with adequate height: Compact pinned scroll scrubbing
    mm.add("(max-width: 1023px) and (min-height: 560px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(".how-it-works-card");
      if (cards.length > 0 && pinSectionRef.current) {
        const tween = gsap.to(cards, {
          yPercent: -100 * (cards.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: pinSectionRef.current,
            pin: true,
            scrub: 0.6,
            snap: 1 / (cards.length - 1),
            start: "top top+=65",
            end: () => "+=480",
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const step = Math.min(STEPS.length - 1, Math.max(0, Math.round(self.progress * (STEPS.length - 1))));
              setActiveStep(step);
            },
          },
        });
        stRef.current = tween.scrollTrigger || null;
      }
      return () => {
        stRef.current = null;
      };
    });

    // 3. Short screens / landscape: Unpinned scroll trigger to avoid screen overflow clipping
    mm.add("(max-width: 1023px) and (max-height: 559px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(".how-it-works-card");
      if (cards.length > 0 && pinSectionRef.current) {
        const trigger = ScrollTrigger.create({
          trigger: pinSectionRef.current,
          start: "top 70%",
          end: "bottom 30%",
          onUpdate: (self) => {
            const step = Math.min(STEPS.length - 1, Math.max(0, Math.floor(self.progress * STEPS.length)));
            setActiveStep(step);
            gsap.to(cards, {
              yPercent: -100 * step,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          },
        });
        stRef.current = trigger;
      }
      return () => {
        stRef.current = null;
      };
    });

    // Refresh after fonts are loaded to avoid layout shifts
    document.fonts?.ready?.then(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-paper border-b border-ink/20 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Prepress Protocol"
          title="From Vector to Pressed Merchandise"
          description="A deterministic 3-step quality pipeline ensuring every single piece matches your exact brand guidelines."
        />

        {/* Responsive Pinned Scroll Container with Zero Trailing Spacer Gap */}
        <div
          ref={pinSectionRef}
          className="relative overflow-hidden rounded-sm border-2 border-ink bg-paper-pure shadow-stamp-lg"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mobile Interactive Step Tabs */}
          <div className="lg:hidden flex border-b border-ink/20 bg-paper divide-x divide-ink/20">
            {STEPS.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={`flex-1 py-2 px-2 text-center font-mono text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-violet text-paper-pure shadow-inner"
                      : "text-ink/70 hover:bg-paper-pure/60"
                  }`}
                  aria-label={`Switch to Step ${idx + 1}: ${s.title}`}
                >
                  <span className="font-extrabold">{s.step}</span>
                  <span className="truncate max-w-[90px] sm:max-w-none">{s.tag}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[500px]">
            {/* Left Static Indicator Column */}
            <div className="lg:col-span-5 p-5 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-ink/20 flex flex-col justify-between bg-paper">
              <div>
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <div className="flex items-center gap-2 text-violet">
                    <RegistrationMark size={16} variant="violet" />
                    <span className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest">
                      Three-Stage Verification
                    </span>
                  </div>
                  <span className="lg:hidden font-mono text-[11px] font-bold text-violet bg-violet/10 px-2 py-0.5 rounded border border-violet/20">
                    Step {activeStep + 1} of 3
                  </span>
                </div>

                <h3 className="heading-sub font-black text-ink text-xl sm:text-2xl lg:text-3xl">
                  How Purple Friday Works
                </h3>
                <p className="text-xs sm:text-sm font-sans text-ink/70 mt-1.5 lg:mt-2 leading-relaxed">
                  Every order is checked by human prepress technicians before hitting physical production lines.
                </p>
              </div>

              {/* Dynamic Interactive Stage Bullets */}
              <div className="pt-4 lg:pt-8 font-mono text-xs space-y-2">
                {STEPS.map((s, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => goToStep(idx)}
                      className={`w-full text-left flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                        isActive ? "font-bold text-violet translate-x-1" : "text-ink/65 hover:text-ink"
                      }`}
                      aria-label={`Jump to ${s.stage}`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 transition-all duration-200 ${
                          isActive
                            ? "bg-violet ring-2 ring-violet/30 scale-125"
                            : "bg-ink/30"
                        }`}
                      />
                      <span className="truncate">{s.stage}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Sliding Steps Column — Strict Single-Card Bounded Frame */}
            <div className="lg:col-span-7 h-[330px] sm:h-[370px] lg:h-[500px] overflow-hidden relative bg-paper-pure touch-pan-y">
              <div className="cards-slider flex flex-col h-full">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.step}
                      className="how-it-works-card h-[330px] sm:h-[370px] lg:h-[500px] p-5 sm:p-8 lg:p-12 flex flex-col justify-between shrink-0 bg-paper-pure relative select-none"
                    >
                      <CropCorners offset={6} length={12} />

                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-violet">
                          {step.step}
                        </span>
                        <span className="font-mono text-[11px] sm:text-xs uppercase font-bold text-ink bg-spot-lime px-3 py-1 rounded-full border border-ink/20 flex items-center gap-1.5 shadow-sm">
                          <Icon className="h-3.5 w-3.5 text-ink" />
                          <span>{step.tag}</span>
                        </span>
                      </div>

                      <div className="space-y-2 sm:space-y-3 my-auto">
                        <h4 className="heading-sub font-extrabold text-ink text-base sm:text-xl lg:text-2xl">
                          {step.title}
                        </h4>
                        <p className="text-xs sm:text-sm lg:text-base font-sans text-ink/80 leading-relaxed font-normal line-clamp-4 sm:line-clamp-none">
                          {step.description}
                        </p>
                      </div>

                      <div className="pt-3 lg:pt-4 border-t border-ink/20 flex items-center justify-between text-xs font-mono font-bold text-ink/80">
                        <div className="flex items-center gap-2">
                          <span className="text-ink/90">Quality Checked, Step {idx + 1} of 3</span>
                          {/* Mobile Prev/Next Quick Controls */}
                          <div className="flex lg:hidden items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToStep(activeStep - 1);
                              }}
                              disabled={activeStep === 0}
                              className="p-1 rounded hover:bg-paper border border-ink/20 disabled:opacity-30 disabled:pointer-events-none"
                              aria-label="Previous step"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToStep(activeStep + 1);
                              }}
                              disabled={activeStep === STEPS.length - 1}
                              className="p-1 rounded hover:bg-paper border border-ink/20 disabled:opacity-30 disabled:pointer-events-none"
                              aria-label="Next step"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <span className="text-violet flex items-center gap-1 font-semibold">
                          Stage Verified <span className="font-sans">✓</span>
                        </span>
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
