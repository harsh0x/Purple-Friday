"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number | string;
  icon?: React.ReactNode;
}

export function Chip({
  className,
  selected = false,
  count,
  icon,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide transition-all select-none border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1",
        selected
          ? "bg-ink text-paper border-ink shadow-sm"
          : "bg-paper-pure text-ink/80 border-ink/20 hover:border-ink hover:text-ink hover:bg-paper",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            "inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px]",
            selected ? "bg-violet text-white" : "bg-ink/10 text-ink/70"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

