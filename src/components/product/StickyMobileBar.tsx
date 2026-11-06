"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface StickyMobileBarProps {
  productName: string;
  unitPrice: number;
  productSlug: string;
  selectedColor?: string;
  quantity: number;
}

export function StickyMobileBar({
  productName,
  unitPrice,
  productSlug,
  selectedColor,
  quantity,
}: StickyMobileBarProps) {
  const customizerUrl = `/customize/${productSlug}?qty=${quantity}${
    selectedColor ? `&color=${encodeURIComponent(selectedColor)}` : ""
  }`;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-pf-ink bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex flex-col min-w-0">
          <span className="font-display text-xs font-bold text-pf-ink truncate">
            {productName}
          </span>
          <div className="flex items-baseline gap-1.5 font-mono text-xs">
            <span className="font-black text-pf-ink text-sm">
              {formatINR(unitPrice)}
            </span>
            <span className="text-[10px] text-pf-ink/60">/pc</span>
            <span className="text-[10px] text-pf-violet font-semibold">({quantity} pcs)</span>
          </div>
        </div>

        <Link
          href={customizerUrl}
          className="shrink-0 inline-flex items-center gap-1.5 border-2 border-pf-ink bg-pf-violet text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 shadow-[3px_3px_0_0_#15101F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-pf-lime" />
          <span>Design Now</span>
        </Link>
      </div>
    </div>
  );
}

