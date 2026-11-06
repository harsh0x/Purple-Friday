import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
}

export function Logo({ className, variant = "dark" }: LogoProps) {
  const isDark = variant === "dark";

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet",
        className
      )}
      aria-label="Purple Friday Homepage"
    >
      {/* Original Inline SVG Brand Mark */}
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:rotate-45"
      >
        {/* Background diamond stamp */}
        <rect
          x="17"
          y="2"
          width="21.2"
          height="21.2"
          rx="2"
          transform="rotate(45 17 2)"
          fill="#6A2CFF"
          stroke={isDark ? "#15101F" : "#F5F0E8"}
          strokeWidth="1.8"
        />
        {/* Registration crosshairs */}
        <circle cx="17" cy="17" r="7" stroke={isDark ? "#15101F" : "#FFFFFF"} strokeWidth="1.2" strokeDasharray="2 1.5" />
        <line x1="17" y1="5" x2="17" y2="29" stroke={isDark ? "#15101F" : "#FFFFFF"} strokeWidth="1.2" />
        <line x1="5" y1="17" x2="29" y2="17" stroke={isDark ? "#15101F" : "#FFFFFF"} strokeWidth="1.2" />
        {/* Center dot */}
        <circle cx="17" cy="17" r="2" fill="#D8FF3F" />
      </svg>

      {/* Wordmark Typography */}
      <div className="flex flex-col text-left leading-none">
        <span
          className={cn(
            "font-display font-extrabold text-lg tracking-tight uppercase transition-colors",
            isDark ? "text-ink group-hover:text-violet" : "text-paper group-hover:text-spot-lime"
          )}
        >
          Purple Friday
        </span>
        <span
          className={cn(
            "font-mono text-[9px] tracking-widest uppercase",
            isDark ? "text-ink/60" : "text-paper/60"
          )}
        >
          Print Shop India
        </span>
      </div>
    </Link>
  );
}

