"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono uppercase tracking-wider text-ink/80 font-semibold"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full min-h-[44px] px-3.5 py-2.5 rounded-sm bg-paper-pure text-ink text-sm font-sans",
            "border border-ink/30 placeholder:text-ink/40 transition-colors",
            "hover:border-ink/60 focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet",
            "disabled:bg-paper-dark disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-600 focus:border-red-600 focus:ring-red-600",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-mono text-red-600 tracking-tight">{error}</p>
        ) : helperText ? (
          <p className="text-xs font-mono text-ink/60">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

