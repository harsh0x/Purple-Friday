"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useAdminTheme } from "./AdminThemeContext";

interface AdminThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function AdminThemeToggle({
  showLabel = false,
  className = "",
}: AdminThemeToggleProps) {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-2xl p-2.5 transition-all duration-200 border ${
        isDark
          ? "bg-[#1A1726] border-[#2A253B] text-[#D9F99D] hover:bg-[#211D32] hover:border-[#7C3AED]/40 hover:text-white"
          : "bg-white border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2] hover:border-[#6A2CFF]/40 hover:text-[#6A2CFF]"
      } shadow-sm active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#D9F99D] transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#6A2CFF] transition-transform duration-300 group-hover:-rotate-12" />
      )}

      {showLabel && (
        <span
          className={`text-xs font-sans font-medium transition-colors ${
            isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
          }`}
        >
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
