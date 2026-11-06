import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function PoloTemplate({
  color = "#221A31",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 400 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Polo Shirt Template"
    >
      <defs>
        <filter id="poloShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Polo Body */}
      <path
        d="M135 55 C160 85 240 85 265 55 L340 100 L310 160 L275 145 L275 400 C275 408 270 412 260 412 L140 412 C130 412 125 408 125 400 L125 145 L90 160 L60 100 Z"
        fill={color}
        filter="url(#poloShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Collar Fold Left */}
      <path
        d="M135 55 L180 120 L195 65 Z"
        fill="#15101F"
        fillOpacity="0.25"
        stroke="#15101F"
        strokeWidth="2"
      />
      {/* Collar Fold Right */}
      <path
        d="M265 55 L220 120 L205 65 Z"
        fill="#15101F"
        fillOpacity="0.25"
        stroke="#15101F"
        strokeWidth="2"
      />

      {/* Button Placket */}
      <rect
        x="188"
        y="65"
        width="24"
        height="85"
        fill={color}
        stroke="#15101F"
        strokeWidth="1.8"
      />
      {/* Buttons */}
      <circle cx="200" cy="85" r="3" fill="#FFFFFF" stroke="#15101F" strokeWidth="1" />
      <circle cx="200" cy="110" r="3" fill="#FFFFFF" stroke="#15101F" strokeWidth="1" />
      <circle cx="200" cy="135" r="3" fill="#FFFFFF" stroke="#15101F" strokeWidth="1" />

      {/* Left Chest Embroidery Area (x: 225, y: 135, width: 45, height: 45) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="225"
            y="135"
            width="45"
            height="45"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="225"
            y="135"
            width="45"
            height="45"
            rx="2"
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

