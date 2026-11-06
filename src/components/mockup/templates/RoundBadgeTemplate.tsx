import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function RoundBadgeTemplate({
  color = "#F5F0E8",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 340 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Magnetic Round Badge Template"
    >
      <defs>
        <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="5" stdDeviation="6" floodOpacity="0.18" />
        </filter>
        {/* Metallic Bevel Ring Gradient */}
        <radialGradient id="metallicBevel" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#E0D8CB" stopOpacity="0.3" />
          <stop offset="85%" stopColor="#15101F" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#15101F" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Outer Metallic Casing */}
      <circle
        cx="170"
        cy="170"
        r="145"
        fill="#DDD4E6"
        stroke="#15101F"
        strokeWidth="3"
        filter="url(#badgeShadow)"
      />
      <circle cx="170" cy="170" r="145" fill="url(#metallicBevel)" />

      {/* Badge Face Surface (Recolourable) */}
      <circle
        cx="170"
        cy="170"
        r="132"
        fill={color}
        stroke="#15101F"
        strokeWidth="1.5"
      />

      {/* Registration Crosshairs / Bleed Guide */}
      <circle
        cx="170"
        cy="170"
        r="120"
        stroke="#6A2CFF"
        strokeWidth="1"
        strokeDasharray="4 4"
        strokeOpacity="0.35"
      />
      <line x1="170" y1="38" x2="170" y2="50" stroke="#6A2CFF" strokeWidth="1.5" opacity="0.4" />
      <line x1="170" y1="290" x2="170" y2="302" stroke="#6A2CFF" strokeWidth="1.5" opacity="0.4" />
      <line x1="38" y1="170" x2="50" y2="170" stroke="#6A2CFF" strokeWidth="1.5" opacity="0.4" />
      <line x1="290" y1="170" x2="302" y2="170" stroke="#6A2CFF" strokeWidth="1.5" opacity="0.4" />

      {/* Defined Print Area (Circular Center: 170, 170, r=100) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="70"
            y="70"
            width="200"
            height="200"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <g>
            <circle cx="170" cy="170" r="85" fill="none" stroke="#6A2CFF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
            <text x="170" y="174" textAnchor="middle" fill="#15101F" fontSize="12" fontFamily="var(--font-dm-mono)" opacity="0.5" fontWeight="bold">
              58mm PRINT ZONE
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

