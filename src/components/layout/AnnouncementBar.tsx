"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { RegistrationMark } from "../ui/decorative";

const announcements = [
  {
    id: 1,
    text: "Free express air courier across all India PIN codes on orders above ₹2,500",
    code: null,
  },
  {
    id: 2,
    text: "Extra 12% off your first corporate merchandise run with code",
    code: "FIRSTORDER",
  },
  {
    id: 3,
    text: "Free 3D digital press proof approval before your merchandise hits the press",
    code: null,
  },
];

  export function AnnouncementBar({
    cmsAnnouncements,
  }: {
    cmsAnnouncements?: Array<{ id: string | number; text: string; code?: string | null; link?: string | null }>;
  } = {}) {
    const pathname = usePathname();

    const activeAnnouncements =
      cmsAnnouncements && cmsAnnouncements.length > 0
        ? cmsAnnouncements
        : announcements;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (isPaused) return;

      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
      }, 4500);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [isPaused, activeAnnouncements.length]);

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];

  // Pure Admin Layout: Never render announcement bar on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className="bg-ink text-paper text-xs font-mono select-none border-b border-ink/40 relative z-40 transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Announcements"
    >
      <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          aria-label="Previous announcement"
          className="p-1 text-paper/60 hover:text-spot-lime transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spot-lime"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Central Rotating Message with Fixed Height (Zero Layout Shift) */}
        <div className="flex-1 flex items-center justify-center gap-2 text-center overflow-hidden px-2 h-full">
          <RegistrationMark size={10} variant="paper" className="shrink-0 hidden sm:inline-block opacity-40" />
          <span className="truncate tracking-wide text-[11px] sm:text-xs">
            {current.text}
          </span>

          {current.code && (
            <button
              onClick={(e) => copyCode(current.code!, e)}
              className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-xs bg-spot-lime text-ink font-bold hover:bg-spot-lime-hover transition-colors"
              title="Click to copy code"
            >
              <span>{current.code}</span>
              {copied ? (
                <Check className="h-3 w-3 stroke-[3]" />
              ) : (
                <Copy className="h-2.5 w-2.5 stroke-[2.5]" />
              )}
            </button>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          aria-label="Next announcement"
          className="p-1 text-paper/60 hover:text-spot-lime transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spot-lime"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

