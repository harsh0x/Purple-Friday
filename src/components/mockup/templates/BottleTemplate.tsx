import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function BottleTemplate({
  color = "#221A31",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 300 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Insulated Stainless Bottle Template"
    >
      <defs>
        <filter id="bottleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="5" stdDeviation="6" floodOpacity="0.16" />
        </filter>
        <linearGradient id="cylinderHighlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
          <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Cap Handle Loop */}
      <path
        d="M130 55 C130 30 170 30 170 55"
        stroke="#15101F"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Screw Cap */}
      <rect x="120" y="55" width="60" height="25" rx="3" fill="#15101F" stroke="#15101F" strokeWidth="2" />
      {/* Cap Grip Ridges */}
      <line x1="135" y1="60" x2="135" y2="75" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="150" y1="60" x2="150" y2="75" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="165" y1="60" x2="165" y2="75" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.3" />

      {/* Bottle Neck Ring */}
      <rect x="128" y="80" width="44" height="12" fill="#CDB8FF" stroke="#15101F" strokeWidth="1.5" />

      {/* Bottle Cylinder Body (Recolourable) */}
      <path
        d="M128 92 L105 130 C100 138 100 145 100 155 L100 375 C100 388 108 395 120 395 L180 395 C192 395 200 388 200 375 L200 155 C200 145 200 138 195 130 L172 92 Z"
        fill={color}
        filter="url(#bottleShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
      />

      {/* Cylindrical Highlight */}
      <path
        d="M128 92 L105 130 C100 138 100 145 100 155 L100 375 C100 388 108 395 120 395 L180 395 C192 395 200 388 200 375 L200 155 C200 145 200 138 195 130 L172 92 Z"
        fill="url(#cylinderHighlight)"
      />

      {/* Defined Laser / UV Print Zone (x: 120, y: 180, width: 60, height: 130) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="120"
            y="180"
            width="60"
            height="130"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="120"
            y="180"
            width="60"
            height="130"
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

