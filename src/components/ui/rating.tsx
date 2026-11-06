import React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingProps {
  score: number;
  totalReviews?: number;
  showScore?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function Rating({
  score,
  totalReviews,
  showScore = true,
  size = "md",
  className,
}: RatingProps) {
  // Clamp score between 0 and 5
  const clampedScore = Math.min(Math.max(score, 0), 5);
  const fullStars = Math.floor(clampedScore);
  const hasHalfStar = clampedScore - fullStars >= 0.3 && clampedScore - fullStars <= 0.8;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("inline-flex items-center gap-1.5 select-none", className)}>
      <div className="flex items-center gap-0.5 text-violet" aria-label={`Rating: ${clampedScore} out of 5 stars`}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(starSizeClass, "fill-violet stroke-violet")}
          />
        ))}
        {hasHalfStar && (
          <StarHalf
            className={cn(starSizeClass, "fill-violet stroke-violet")}
          />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(starSizeClass, "stroke-ink/30 fill-transparent")}
          />
        ))}
      </div>

      {showScore && (
        <span className="text-xs font-mono font-bold text-ink">
          {clampedScore.toFixed(1)}
        </span>
      )}

      {totalReviews !== undefined && (
        <span className="text-xs font-mono text-ink/60">
          ({totalReviews})
        </span>
      )}
    </div>
  );
}

