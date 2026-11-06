import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function HoodieTemplate({
  color = "#312540",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 400 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hoodie Template"
    >
      <defs>
        <filter id="hoodieShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Hood Top Outline */}
      <path
        d="M140 85 C140 25 260 25 260 85 Z"
        fill="#15101F"
        fillOpacity="0.2"
        stroke="#15101F"
        strokeWidth="2.5"
      />

      {/* Body & Raglan Sleeves */}
      <path
        d="M130 90 L80 180 L40 160 L15 110 L110 80 L140 85 L260 85 L290 80 L385 110 L360 160 L320 180 L270 90 L275 390 C275 402 268 408 255 408 L145 408 C132 408 125 402 125 390 Z"
        fill={color}
        filter="url(#hoodieShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Hood Opening & Neckband */}
      <path
        d="M150 88 C175 118 225 118 250 88 C235 70 165 70 150 88 Z"
        fill="#15101F"
        stroke="#15101F"
        strokeWidth="2"
      />

      {/* Drawstrings */}
      <path d="M185 105 L180 170" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M215 105 L220 170" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Kangaroo Pouch Pocket */}
      <path
        d="M145 280 L255 280 L268 360 L132 360 Z"
        fill={color}
        stroke="#15101F"
        strokeWidth="2"
      />
      <line x1="145" y1="280" x2="132" y2="360" stroke="#15101F" strokeWidth="2" />
      <line x1="255" y1="280" x2="268" y2="360" stroke="#15101F" strokeWidth="2" />

      {/* Defined Print Area (Chest: 150, 140, 100, 100) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="150"
            y="140"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="150"
            y="140"
            width="100"
            height="100"
            rx="4"
            fill="none"
            stroke="#6A2CFF"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        )}
      </g>
    </svg>
  );
}

