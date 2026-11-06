import React from "react";
import { cn } from "@/lib/utils";

interface RegistrationMarkProps {
  className?: string;
  size?: number;
  variant?: "ink" | "violet" | "paper" | "lilac";
}

export function RegistrationMark({
  className,
  size = 20,
  variant = "ink",
}: RegistrationMarkProps) {
  const colorMap = {
    ink: "text-ink stroke-ink",
    violet: "text-violet stroke-violet",
    paper: "text-paper stroke-paper",
    lilac: "text-lilac stroke-lilac",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", colorMap[variant], className)}
      aria-hidden="true"
    >
      {/* Outer target ring */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.2" strokeDasharray="2 2" />
      {/* Inner target circle */}
      <circle cx="12" cy="12" r="5" strokeWidth="1.2" />
      {/* Crosshair lines extending beyond */}
      <line x1="12" y1="0" x2="12" y2="24" strokeWidth="1.2" />
      <line x1="0" y1="12" x2="24" y2="12" strokeWidth="1.2" />
      {/* Center registration dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

interface CropCornersProps {
  className?: string;
  offset?: number;
  length?: number;
}

export function CropCorners({
  className,
  offset = 8,
  length = 12,
}: CropCornersProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 select-none overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Top Left */}
      <div
        className="absolute border-l border-t border-ink/40"
        style={{
          top: `${offset}px`,
          left: `${offset}px`,
          width: `${length}px`,
          height: `${length}px`,
        }}
      />
      {/* Top Right */}
      <div
        className="absolute border-r border-t border-ink/40"
        style={{
          top: `${offset}px`,
          right: `${offset}px`,
          width: `${length}px`,
          height: `${length}px`,
        }}
      />
      {/* Bottom Left */}
      <div
        className="absolute border-l border-b border-ink/40"
        style={{
          bottom: `${offset}px`,
          left: `${offset}px`,
          width: `${length}px`,
          height: `${length}px`,
        }}
      />
      {/* Bottom Right */}
      <div
        className="absolute border-r border-b border-ink/40"
        style={{
          bottom: `${offset}px`,
          right: `${offset}px`,
          width: `${length}px`,
          height: `${length}px`,
        }}
      />
    </div>
  );
}

interface HalftoneBackgroundProps {
  className?: string;
  variant?: "subtle" | "violet" | "ink";
}

export function HalftoneBackground({
  className,
  variant = "subtle",
}: HalftoneBackgroundProps) {
  const variantClass = {
    subtle: "bg-halftone-subtle",
    violet: "bg-halftone-violet",
    ink: "bg-halftone opacity-10",
  }[variant];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none",
        variantClass,
        className
      )}
      aria-hidden="true"
    />
  );
}

