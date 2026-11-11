"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye, Cpu, PackageCheck, Truck } from "lucide-react";

interface Step {
  id: string;
  stepNumber: string;
  title: string;
  duration: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    id: "step-1",
    stepNumber: "01",
    title: "Order Received",
    duration: "Instant",
    description: "Vector artwork & specs are checked automatically by our pre-flight engine.",
    icon: CheckCircle2,
  },
  {
    id: "step-2",
    stepNumber: "02",
    title: "Order Preview",
    duration: "Within 2 Hours",
    description: "You receive an exact 1:1 digital proof via WhatsApp and email for sign-off.",
    icon: Eye,
  },
  {
    id: "step-3",
    stepNumber: "03",
    title: "Processing 24-48 Hours",
    duration: "24-48 hrs",
    description: "Laser cut, screen printed or embroidered in our own Tirupur & Bengaluru ateliers.",
    icon: Cpu,
  },
  {
    id: "step-4",
    stepNumber: "04",
    title: "Packed with Care",
    duration: "Day 3",
    description: "Every item passes 4-point QC, individually barcoded, and packed in moisture-proof craft boxes.",
    icon: PackageCheck,
  },
  {
    id: "step-5",
    stepNumber: "05",
    title: "Dispatch in 4-5 Days",
    duration: "4-5 working days",
    description: "Air express via Bluedart / Delhivery with end-to-end tracking to your doorstep.",
    icon: Truck,
  },
];

export function OrderProcessTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalDist = rect.height + windowHeight * 0.5;
      const currentDist = windowHeight - rect.top;
      const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative border-b-2 border-ink bg-paper py-20 px-4 md:px-8 overflow-hidden"
    >
      {/* Decorative Registration Marks */}
      <span className="absolute top-4 left-4 font-mono text-xs text-ink/30 select-none">
        ⌖ 5-STAGE PIPELINE // CALIBRATED
      </span>
      <span className="absolute top-4 right-4 font-mono text-xs text-ink/30 select-none">
        SPEC: PROOF-TO-DOOR ⌖
      </span>

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 border border-ink/20 bg-violet/10 px-3 py-1 text-xs font-mono font-medium text-violet uppercase tracking-wider mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-violet animate-pulse" />
            Clear Delivery Guarantee
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
            From your proof to your door
          </h2>
          <p className="mt-3 text-base text-ink/70 max-w-2xl mx-auto font-sans">
            No guessing games. Track every stage of your run in real time with our calibrated 5-point production pipeline.
          </p>
        </div>

        {/* Desktop / Horizontal Timeline */}
        <div className="relative hidden md:block pt-8 pb-12">
          {/* Background Track Line */}
          <div className="absolute top-14 left-[10%] right-[10%] h-[3px] bg-ink/15 -z-0" />

          {/* Animated SVG Progress Line */}
          <svg
            className="absolute top-14 left-[10%] right-[10%] w-[80%] h-[3px] overflow-visible -z-0 pointer-events-none"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="#6A2CFF"
              strokeWidth="4"
              strokeDasharray="1000"
              strokeDashoffset={1000 - scrollProgress * 1000}
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          {/* 5 Steps Grid */}
          <div className="grid grid-cols-5 gap-4 relative z-10">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const stepRatio = idx / (STEPS.length - 1);
              const isPassed = scrollProgress >= stepRatio;

              return (
                <div key={step.id} className="flex flex-col items-center text-center px-2 group">
                  {/* Step node icon */}
                  <div
                    className={`h-12 w-12 rounded-full border-2 border-ink flex items-center justify-center transition-all duration-300 ${
                      isPassed
                        ? "bg-violet text-white shadow-[3px_3px_0_0_#15101F]"
                        : "bg-white text-ink shadow-[2px_2px_0_0_#15101F]"
                    }`}
                  >
                    <Icon className="h-5 w-5 stroke-[2.2]" />
                  </div>

                  <span className="mt-4 font-mono text-xs font-bold text-violet tracking-wider">
                    STAGE {step.stepNumber}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold text-ink leading-snug">
                    {step.title}
                  </h3>
                  <span className="mt-1 inline-block font-mono text-[11px] font-bold text-ink bg-ink/10 px-2.5 py-0.5 border border-ink/20 rounded-xs">
                    {step.duration}
                  </span>
                  <p className="mt-2 text-xs font-sans text-ink leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

          {/* Mobile / Vertical Timeline */}
          <div className="relative md:hidden pl-6 border-l-2 border-ink/20 space-y-8 my-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative pl-6">
                  {/* Node icon on line */}
                  <div className="absolute -left-[31px] top-0 h-9 w-9 rounded-full border-2 border-ink bg-violet text-white flex items-center justify-center shadow-[2px_2px_0_0_#15101F]">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-violet">
                        STAGE {step.stepNumber}
                      </span>
                      <span className="font-mono text-[10px] text-ink/60 bg-ink/5 px-1.5 py-0.5 border border-ink/10">
                        {step.duration}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-base font-bold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink/75 leading-relaxed font-sans">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </section>
  );
}

