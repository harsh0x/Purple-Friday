"use client";

import React from "react";
import Link from "next/link";
import { Plus, Shield, Sparkles } from "lucide-react";
import { AdminThemeToggle } from "./AdminThemeToggle";
import { useAdminTheme } from "./AdminThemeContext";

interface AdminGreetingProps {
  userName?: string | null;
  attentionCount?: number;
  userRole?: string | null;
}

export function AdminGreeting({
  userName = "Staff Member",
  attentionCount = 0,
  userRole = "SUPER_ADMIN",
}: AdminGreetingProps) {
  const { theme } = useAdminTheme();
  const isDark = theme === "dark";

  // Format current date in Asia/Kolkata timezone
  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  // Time-of-day greeting in India time
  const hour = parseInt(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );

  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17) {
    greeting = "Good evening";
  }

  const firstName = userName?.split(" ")[0] || "Staff";

  return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b transition-colors duration-200 ${isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
          }`}
      >
        <div>
          <div className="flex items-center gap-2">
              <h1
                className={`font-sans font-bold text-2xl sm:text-3xl tracking-tight transition-colors ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
              >
                {greeting}, {firstName}
              </h1>
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
          </div>
            <p
              className={`mt-1 text-xs font-sans transition-colors ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
                }`}
            >
              {dateFormatted} •{" "}
                <span
                  className={`font-semibold ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                    }`}
                >
                  {attentionCount} {attentionCount === 1 ? "thing needs" : "things need"} your attention
                </span>
            </p>
        </div>

          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* Activity Log Button */}
            <Link
              href="/admin/audit"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-sans font-semibold shadow-sm transition-all ${isDark
                  ? "bg-[#1A1726] border-[#2A253B] text-[#F4F3F8] hover:bg-[#211D32] hover:border-[#7C3AED]/40"
                  : "bg-white border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2] hover:border-[#6A2CFF]/40"
                }`}
            >
              <Shield className="w-4 h-4 text-[#8B5CF6]" />
              <span>Activity Log</span>
            </Link>

            {/* + New Order Button */}
            <Link
              href="/admin/orders"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-sans font-semibold shadow-sm transition-all active:scale-95 ${isDark
                  ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-[#7C3AED]/20"
                  : "bg-[#15101F] hover:bg-[#221A31] text-white"
                }`}
            >
              <Plus className="w-4 h-4 text-[#D9F99D]" />
              <span>+ New Order</span>
            </Link>

            {/* Invite Staff (Super Admin) */}
            {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
              <Link
                href="/admin/team"
                className={`hidden lg:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-sans font-semibold shadow-sm transition-all ${isDark
                    ? "bg-[#1A1726] border-[#2A253B] text-[#9E98B3] hover:text-white hover:bg-[#211D32]"
                    : "bg-white border-[#15101F]/15 text-[#15101F]/80 hover:text-[#15101F] hover:bg-[#FAF7F2]"
                  }`}
              >
                <Plus className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Invite Staff</span>
              </Link>
            )}

            {/* Dark Mode / Light Mode Toggle Button */}
            <AdminThemeToggle showLabel />
          </div>
        </div>
        );
}
