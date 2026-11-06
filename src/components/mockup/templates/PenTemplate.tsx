import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function PenTemplate({
  color = "#15101F",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 420 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Executive Pen Template"
    >
      <defs>
        <filter id="penShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.14" />
        </filter>
        <linearGradient id="metalChrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#B496FF" />
          <stop offset="100%" stopColor="#816F98" />
        </linearGradient>
      </defs>

      {/* Main Pen Barrel (Recolourable) */}
      <rect
        x="60"
        y="75"
        width="260"
        height="30"
        rx="2"
        fill={color}
        filter="url(#penShadow)"
        stroke="#15101F"
        strokeWidth="2"
      />

      {/* Grip Ring / Accent Rings */}
      <rect x="180" y="74" width="8" height="32" fill="url(#metalChrome)" stroke="#15101F" strokeWidth="1.5" />
      <rect x="315" y="74" width="6" height="32" fill="url(#metalChrome)" stroke="#15101F" strokeWidth="1.5" />

      {/* Pen Tip Cone */}
      <path
        d="M60 75 L25 90 L60 105 Z"
        fill="url(#metalChrome)"
        stroke="#15101F"
        strokeWidth="2"
      />
      {/* Ballpoint nib */}
      <circle cx="23" cy="90" r="2.5" fill="#15101F" />

      {/* Back Cap */}
      <path
        d="M320 76 C340 76 345 83 345 90 C345 97 340 104 320 104 Z"
        fill="url(#metalChrome)"
        stroke="#15101F"
        strokeWidth="2"
      />

      {/* Metal Pocket Clip */}
      <path
        d="M260 65 L335 65 C338 65 340 68 340 75 L332 75 C332 70 330 69 260 69 Z"
        fill="url(#metalChrome)"
        stroke="#15101F"
        strokeWidth="1.5"
      />

      {/* Defined Laser Engraving Area (x: 80, y: 80, width: 90, height: 20) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="80"
            y="80"
            width="90"
            height="20"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="80"
            y="80"
            width="90"
            height="20"
            rx="2"
            fill="none"
            stroke="#6A2CFF"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.5"
          />
        )}
      </g>
    </svg>
  );
}

