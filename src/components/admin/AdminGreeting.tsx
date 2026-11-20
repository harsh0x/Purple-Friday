"use client";

import React from "react";
import Link from "next/link";
import { Plus, Shield, Sparkles } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
            {greeting}, {firstName}
          </h1>
          <Sparkles className="w-5 h-5 text-[#6A2CFF]" />
        </div>
        <p className="mt-1 text-xs font-mono text-[#15101F]/60">
          {dateFormatted} •{" "}
          <span className="font-semibold text-[#15101F]">
            {attentionCount} {attentionCount === 1 ? "thing needs" : "things need"} your attention
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/admin/audit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] font-mono text-xs font-semibold shadow-sm hover:bg-[#FAF7F2] transition-colors"
        >
          <Shield className="w-4 h-4 text-[#6A2CFF]" />
          <span>Activity Log</span>
        </Link>

        {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
          <Link
            href="/admin/team"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold shadow-sm hover:bg-[#221A31] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#D8FF3F]" />
            <span>Invite Staff</span>
          </Link>
        )}
      </div>
    </div>
  );
}
