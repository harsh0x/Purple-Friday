import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
  view?: "front" | "back";
}

export function TeeTemplate({
  color = "#15101F",
  logoUrl,
  className = "w-full h-full",
  view = "front",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 400 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="T-Shirt Template"
    >
      <defs>
        <filter id="teeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12" />
        </filter>
        <linearGradient id="teeShading" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <clipPath id="teePrintClip">
          <rect x="145" y="125" width="110" height="135" rx="2" />
        </clipPath>
      </defs>

      {/* T-Shirt Body & Sleeves Silhouette */}
      <path
        d="M130 50 C155 85 245 85 270 50 L345 95 L315 155 L280 140 L280 395 C280 405 275 410 265 410 L135 410 C125 410 120 405 120 395 L120 140 L85 155 L55 95 Z"
        fill={color}
        filter="url(#teeShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Shading overlay */}
      <path
        d="M130 50 C155 85 245 85 270 50 L345 95 L315 155 L280 140 L280 395 C280 405 275 410 265 410 L135 410 C125 410 120 405 120 395 L120 140 L85 155 L55 95 Z"
        fill="url(#teeShading)"
      />

      {/* Ribbed Collar */}
      {view === "front" ? (
        <>
          <path
            d="M130 50 C155 85 245 85 270 50 C250 72 150 72 130 50 Z"
            fill="#000000"
            fillOpacity="0.2"
            stroke="#15101F"
            strokeWidth="2"
          />
          <path
            d="M142 56 C165 80 235 80 258 56"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none"
          />
        </>
      ) : (
        <path
          d="M130 50 C160 62 240 62 270 50 Z"
          fill="#000000"
          fillOpacity="0.25"
          stroke="#15101F"
          strokeWidth="2"
        />
      )}

      {/* Sleeve Seam Details */}
      <path
        d="M120 140 C125 110 132 80 138 62"
        stroke="#15101F"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeDasharray="3 3"
      />
      <path
        d="M280 140 C275 110 268 80 262 62"
        stroke="#15101F"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeDasharray="3 3"
      />

      {/* Hem Stitching */}
      <line x1="124" y1="398" x2="276" y2="398" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 2" />

        {/* Defined Print Area (Clipped) */}
        <g id="print-area" clipPath="url(#teePrintClip)">
          {logoUrl ? (
            <image
              href={logoUrl}
              x="145"
              y="125"
              width="110"
              height="135"
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <rect
              x="150"
              y="130"
              width="100"
              height="120"
              rx="4"
              fill="none"
              stroke="#6A2CFF"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.35"
            />
          )}
        </g>
    </svg>
  );
}
