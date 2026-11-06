"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

/**
 * Base Skeleton primitive.
 * Uses GPU-accelerated transform shimmer rather than background-position to prevent jank.
 * Respects prefers-reduced-motion.
 */
export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xs bg-ink/10 select-none",
        shimmer &&
          "after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-paper-pure/40 after:to-transparent after:animate-[shimmer_1.8s_infinite] motion-reduce:after:hidden",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Product Card Skeleton (matches catalog product cards)
 */
export function ProductCardSkeleton() {
  return (
    <div className="p-4 border border-ink/20 bg-paper-pure rounded-sm space-y-4">
      {/* Product Image Box */}
      <Skeleton className="w-full aspect-square rounded-xs" />
      {/* Badges / Chips */}
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      {/* Title */}
      <Skeleton className="h-5 w-4/5" />
      {/* Tier Price & Min Qty */}
      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20 rounded-sm" />
      </div>
    </div>
  );
}

/**
 * Product Detail Page Skeleton
 */
export function ProductPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left Column: Mockup Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <Skeleton className="w-full aspect-[4/3] rounded-sm" />
        <div className="grid grid-cols-4 gap-3">
          <Skeleton className="h-20 rounded-xs" />
          <Skeleton className="h-20 rounded-xs" />
          <Skeleton className="h-20 rounded-xs" />
          <Skeleton className="h-20 rounded-xs" />
        </div>
      </div>

      {/* Right Column: Customizer & Tier Pricing */}
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        {/* Tier Price Table */}
        <Skeleton className="h-32 w-full rounded-sm" />
        {/* Options */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-12 w-full rounded-sm" />
          <Skeleton className="h-12 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Line Item Skeleton
 */
export function CartLineSkeleton() {
  return (
    <div className="p-4 border border-ink/20 bg-paper-pure rounded-sm flex gap-3">
      <Skeleton className="h-20 w-20 rounded-xs shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-7 w-20 rounded-sm" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Review Card Skeleton
 */
export function ReviewCardSkeleton() {
  return (
    <div className="p-6 border border-ink/20 bg-paper-pure rounded-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-xs" />
          ))}
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-3 w-1/3 pt-2" />
    </div>
  );
}

/**
 * Blog Card Skeleton
 */
export function BlogCardSkeleton() {
  return (
    <div className="p-6 border border-ink/20 bg-paper-pure rounded-sm space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * List Row Skeleton
 */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-ink/10">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xs shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

