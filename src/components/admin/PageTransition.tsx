"use client";

import React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Performant, accessible page entrance transition.
 * Uses CSS transform and opacity only (250ms).
 * Strictly respects prefers-reduced-motion.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-both motion-reduce:animate-none">
      {children}
    </div>
  );
}
