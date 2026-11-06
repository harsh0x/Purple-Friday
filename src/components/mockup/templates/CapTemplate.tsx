import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function CapTemplate({
  color = "#15101F",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 380 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cap Template"
    >
      <defs>
        <filter id="capShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Cap Crown Panels */}
      <path
        d="M80 180 C80 80 140 40 190 40 C240 40 300 80 300 180 Z"
        fill={color}
        filter="url(#capShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
      />

      {/* Center Seam */}
      <path d="M190 40 L190 180" stroke="#15101F" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Left/Right Panel Seams */}
      <path d="M190 40 C150 70 120 120 110 180" stroke="#15101F" strokeWidth="1.2" strokeOpacity="0.3" />
      <path d="M190 40 C230 70 260 120 270 180" stroke="#15101F" strokeWidth="1.2" strokeOpacity="0.3" />

      {/* Top Button */}
      <circle cx="190" cy="40" r="6" fill="#15101F" />

      {/* Embroidered Eyelets */}
      <circle cx="150" cy="100" r="3" fill="#15101F" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="230" cy="100" r="3" fill="#15101F" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Curved Visor/Brim */}
      <path
        d="M60 180 C60 160 320 160 320 180 C330 230 50 230 60 180 Z"
        fill={color}
        stroke="#15101F"
        strokeWidth="2.5"
      />
      {/* Visor Stitching Arc */}
      <path
        d="M75 190 C90 220 290 220 305 190"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        strokeOpacity="0.35"
        fill="none"
      />

      {/* Front Crown Print Area (x: 155, y: 110, width: 70, height: 45) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="155"
            y="110"
            width="70"
            height="45"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="155"
            y="110"
            width="70"
            height="45"
            rx="3"
            fill="none"
            stroke="#6A2CFF"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.45"
          />
        )}
      </g>
    </svg>
  );
}

