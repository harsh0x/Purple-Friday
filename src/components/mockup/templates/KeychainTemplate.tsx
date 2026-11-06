import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function KeychainTemplate({
  color = "#6A2CFF",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 320 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Keychain Template"
    >
      <defs>
        <filter id="keychainShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="5" floodOpacity="0.16" />
        </filter>
        <linearGradient id="silverRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#CDB8FF" />
          <stop offset="100%" stopColor="#816F98" />
        </linearGradient>
      </defs>

      {/* Split Key Ring */}
      <circle
        cx="160"
        cy="70"
        r="45"
        stroke="url(#silverRing)"
        strokeWidth="9"
        fill="none"
        filter="url(#keychainShadow)"
      />
      <circle cx="160" cy="70" r="45" stroke="#15101F" strokeWidth="1.5" fill="none" />

      {/* Connector Link */}
      <rect x="154" y="115" width="12" height="28" rx="5" fill="url(#silverRing)" stroke="#15101F" strokeWidth="1.5" />

      {/* Main Leather/Metal Tag Plate (Recolourable) */}
      <rect
        x="95"
        y="145"
        width="130"
        height="180"
        rx="14"
        fill={color}
        filter="url(#keychainShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
      />

      {/* Stitching Border */}
      <rect
        x="104"
        y="154"
        width="112"
        height="162"
        rx="10"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        strokeOpacity="0.4"
      />

      {/* Defined Print/Deboss Area (x: 110, y: 180, width: 100, height: 110) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="110"
            y="180"
            width="100"
            height="110"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="110"
            y="180"
            width="100"
            height="110"
            rx="6"
            fill="none"
            stroke="#15101F"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.35"
          />
        )}
      </g>
    </svg>
  );
}

