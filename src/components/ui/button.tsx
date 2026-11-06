"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "stamp"
  | "secondary"
  | "magnetic"
  | "design-cta"
  | "nudge"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "stamp",
      size = "md",
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles (accessible 44px touch targets, focus rings)
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2";

    // Size variants
    const sizeStyles: Record<ButtonSize, string> = {
      sm: "min-h-[38px] px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase",
      md: "min-h-[44px] px-5 py-2.5 text-sm font-sans tracking-wide",
      lg: "min-h-[52px] px-7 py-3 text-base font-sans tracking-wide",
      icon: "min-h-[44px] min-w-[44px] p-2.5",
    };

    // 6 Distinct button variants per the Design Bible
    let variantStyles = "";

    switch (variant) {
      case "stamp":
        // 1. Primary "stamp": solid violet, hard 4px offset ink shadow, presses down
        variantStyles =
          "bg-violet text-white font-semibold shadow-stamp hover:shadow-stamp-hover hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-active rounded-sm";
        break;

      case "secondary":
        // 2. Secondary: text link with an animated underline sweep
        variantStyles =
          "relative bg-transparent text-ink font-semibold p-0 min-h-[44px] px-2 rounded-none hover:text-violet after:absolute after:bottom-1 after:left-2 after:right-2 after:h-[2px] after:bg-violet after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300";
        break;

      case "magnetic":
        // 3. Icon button: circular, magnetic hover pull (desktop)
        variantStyles =
          "rounded-full border border-ink/40 bg-paper text-ink hover:border-ink hover:bg-ink hover:text-paper shadow-sm active:scale-95 transition-transform";
        break;

      case "design-cta":
        // 4. Design CTA: ink background with a violet fill wipe from the left on hover
        variantStyles =
          "relative overflow-hidden bg-ink text-white font-semibold rounded-sm border border-ink isolation-auto before:absolute before:inset-0 before:bg-violet before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 before:ease-out";
        break;

      case "nudge":
        // 5. Quantity nudge chip: spot-lime pill with counter roll animation
        variantStyles =
          "bg-spot-lime text-ink font-mono font-bold text-xs uppercase rounded-full shadow-stamp-sm hover:shadow-stamp hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none border border-ink";
        break;

      case "ghost":
        // 6. Ghost outline button for filters
        variantStyles =
          "bg-transparent text-ink border border-ink/30 hover:border-ink hover:bg-ink/5 active:bg-ink/10 rounded-sm";
        break;
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles, className)}
        {...props}
      >
        {/* Content wrapper to remain on top of before pseudo-element wipes */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
          )}
          {children}
          {!isLoading && rightIcon && (
            <span className="inline-flex shrink-0">{rightIcon}</span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

