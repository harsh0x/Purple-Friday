import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "lilac" | "lime" | "ink" | "violet" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "lilac",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    lilac: "bg-lilac/50 text-ink border border-lilac-dark",
    lime: "bg-spot-lime text-ink border border-ink font-bold",
    ink: "bg-ink text-paper border border-ink",
    violet: "bg-violet text-white border border-violet",
    outline: "bg-transparent text-ink border border-ink/30",
  }[variant];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-mono tracking-wider",
    md: "px-2.5 py-1 text-xs font-mono tracking-wide",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 uppercase font-medium rounded-full select-none",
        variantStyles,
        sizeStyles,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            variant === "lime" ? "bg-ink" : variant === "ink" ? "bg-spot-lime" : "bg-violet"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

