import React from "react";

interface TemplateProps {
  color?: string;
  logoUrl?: string;
  className?: string;
}

export function NotebookTemplate({
  color = "#15101F",
  logoUrl,
  className = "w-full h-full",
}: TemplateProps) {
  return (
    <svg
      viewBox="0 0 340 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hardbound Notebook Template"
    >
      <defs>
        <filter id="notebookShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="3" dy="5" stdDeviation="6" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Pages block bottom edge */}
      <rect x="75" y="45" width="225" height="320" rx="6" fill="#F5F0E8" stroke="#15101F" strokeWidth="2" />
      {/* Page lines */}
      <line x1="290" y1="55" x2="290" y2="355" stroke="#DDD4E6" strokeWidth="2" strokeDasharray="2 2" />

      {/* Notebook Hard Cover (Recolourable) */}
      <rect
        x="60"
        y="40"
        width="230"
        height="325"
        rx="8"
        fill={color}
        filter="url(#notebookShadow)"
        stroke="#15101F"
        strokeWidth="2.5"
      />

      {/* Spine Crease Line */}
      <line x1="85" y1="40" x2="85" y2="365" stroke="#000000" strokeWidth="2" strokeOpacity="0.4" />
      <line x1="88" y1="40" x2="88" y2="365" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" />

      {/* Elastic Closure Band */}
      <rect
        x="250"
        y="40"
        width="16"
        height="325"
        fill="#15101F"
        fillOpacity="0.75"
        stroke="#15101F"
        strokeWidth="1.5"
      />

      {/* Ribbon Bookmark Hanging Out */}
      <path
        d="M175 365 L175 390 L185 382 L195 390 L195 365 Z"
        fill="#6A2CFF"
        stroke="#15101F"
        strokeWidth="1.5"
      />

      {/* Defined Deboss / Foil Stamping Area (x: 105, y: 130, width: 125, height: 140) */}
      <g id="print-area">
        {logoUrl ? (
          <image
            href={logoUrl}
            x="105"
            y="130"
            width="125"
            height="140"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            x="105"
            y="130"
            width="125"
            height="140"
            rx="4"
            fill="none"
            stroke="#D8FF3F"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.45"
          />
        )}
      </g>
    </svg>
  );
}

