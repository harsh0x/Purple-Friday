import React from "react";
import { cn, formatINR, calculateDiscountPercent } from "@/lib/utils";

export interface PriceProps {
  amount: number;
  mrp?: number;
  minQty?: number;
  tierPrefix?: string;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  showSaveBadge?: boolean;
}

export function Price({
  amount,
  mrp,
  minQty,
  tierPrefix,
  size = "md",
  className,
  showSaveBadge = true,
}: PriceProps) {
  const discountPercent = mrp ? calculateDiscountPercent(mrp, amount) : 0;

  const sizeStyles = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    hero: "text-3xl sm:text-4xl",
  }[size];

  return (
    <div className={cn("inline-flex flex-wrap items-baseline gap-2 font-mono", className)}>
      {tierPrefix && (
        <span className="text-xs text-ink/60 uppercase font-sans font-medium">
          {tierPrefix}
        </span>
      )}
      <span className={cn("font-bold text-ink tracking-tight", sizeStyles)}>
        {formatINR(amount)}
      </span>
      {minQty && minQty > 1 && (
        <span className="text-xs text-ink/60 lowercase">
          / pc (min {minQty})
        </span>
      )}
      {mrp && mrp > amount && (
        <span className="text-xs text-ink/40 line-through decoration-ink/40">
          {formatINR(mrp)}
        </span>
      )}
      {showSaveBadge && discountPercent > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-spot-lime text-ink border border-ink/30">
          Save {discountPercent}%
        </span>
      )}
    </div>
  );
}

