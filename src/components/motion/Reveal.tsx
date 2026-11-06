"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  delayMs?: number;
  durationMs?: number;
  threshold?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  direction = "up",
  delayMs = 0,
  durationMs = 400,
  threshold = 0.15,
  once = true,
  ...props
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentEl = elementRef.current;
    if (currentEl) observer.observe(currentEl);

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, [threshold, once]);

  // Initial transform state
  let hiddenTransform = "";
  switch (direction) {
    case "up":
      hiddenTransform = "translateY(24px)";
      break;
    case "down":
      hiddenTransform = "translateY(-24px)";
      break;
    case "left":
      hiddenTransform = "translateX(24px)";
      break;
    case "right":
      hiddenTransform = "translateX(-24px)";
      break;
    case "scale":
      hiddenTransform = "scale(0.96)";
      break;
    case "fade":
    default:
      hiddenTransform = "none";
      break;
  }

  return (
    <div
      ref={elementRef}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : hiddenTransform,
        transitionProperty: "transform, opacity",
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform, opacity",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

