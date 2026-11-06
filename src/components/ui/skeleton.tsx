import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-pf-ink/10 rounded-sm", className)}
      {...props}
    />
  );
}

export function SectionSkeleton({
  height = "h-96",
  title = "Loading section...",
}: {
  height?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-7xl mx-auto px-4 sm:px-6 my-12 flex flex-col justify-center items-center gap-4 border-2 border-dashed border-pf-ink/15 p-8",
        height
      )}
    >
      <div className="h-6 w-48 bg-pf-ink/10 animate-pulse rounded" />
      <div className="h-4 w-72 bg-pf-ink/5 animate-pulse rounded" />
      <span className="font-mono text-xs text-pf-ink/40 uppercase tracking-widest mt-2">
        {title}
      </span>
    </div>
  );
}

