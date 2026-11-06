"use client";

import { useRef, useEffect } from "react";

export interface UseMagneticHoverOptions {
  strength?: number; // Distance multiplier (default: 0.3)
  speed?: number; // Return transition speed in ms (default: 300)
  disabled?: boolean;
}

export function useMagneticHover<T extends HTMLElement = HTMLButtonElement>(
  options: UseMagneticHoverOptions = {}
) {
  const { strength = 0.3, speed = 300, disabled = false } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    // Check for pointer precision and reduced motion preference
    const isPointerFine = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isPointerFine || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      el.style.transition = "transform 0.1s ease-out";
    };

    const handleMouseLeave = () => {
      el.style.transform = "translate(0px, 0px)";
      el.style.transition = `transform ${speed}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.style.transform = "";
      el.style.transition = "";
    };
  }, [strength, speed, disabled]);

  return ref;
}

