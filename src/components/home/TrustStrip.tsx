"use client";

import React, { useEffect, useRef, useState } from "react";
import { RegistrationMark } from "../ui/decorative";

interface StatItem {
  target: number;
  suffix: string;
  label: string;
  sub: string;
}

const STATS: StatItem[] = [
  { target: 125000, suffix: "+", label: "Custom Merch Items Delivered", sub: "Zero-defect quality standard" },
  { target: 100, suffix: "%", label: "In-House Prepress & Production", sub: "Tajima embroidery & DTG printing" },
  { target: 28000, suffix: "+", label: "PIN Codes Covered Pan-India", sub: "Express air courier logistics" },
  { target: 4, suffix: ".9★", label: "Average Client Review Score", sub: "Across 500+ verified corporate orders" },
];

export function TrustStrip() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCounts(STATS.map((s) => s.target));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1500;
          const steps = 40;
          const intervalTime = duration / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts(STATS.map((s) => Math.round(s.target * ease)));

            if (currentStep >= steps) {
              setCounts(STATS.map((s) => s.target));
              clearInterval(timer);
            }
          }, intervalTime);
        }
      },
      { threshold: 0.2 }
    );

    const currentEl = containerRef.current;
    if (currentEl) observer.observe(currentEl);

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, [hasAnimated]);

  return (
        <section ref={containerRef} suppressHydrationWarning className="border-b border-ink/20 bg-ink text-paper py-12 relative overflow-hidden">
          <div suppressHydrationWarning className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, idx) => (
                <div key={idx} suppressHydrationWarning className="space-y-1 relative">
                  <div className="flex items-center gap-1.5 text-spot-lime mb-2">
                    <RegistrationMark size={12} variant="paper" className="opacity-40" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-spot-lime">
                      Metric 0{idx + 1}
                    </span>
                  </div>
                  <div className="font-display font-black text-3xl sm:text-4xl text-paper tracking-tight">
                    {counts[idx].toLocaleString("en-IN")}
                    <span className="text-violet-light">{stat.suffix}</span>
                  </div>
                  <p className="font-display font-bold text-sm text-paper mt-1">
                    {stat.label}
                  </p>
                  <p className="font-sans text-xs text-paper/60">
                    {stat.sub}
                  </p>
                </div>
        ))}
              </div>
    </section>
        );
}

