"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

interface RtoRiskBadgeProps {
  score?: number | null;
  reasons?: string[];
  overridden?: boolean;
  className?: string;
}

export function RtoRiskBadge({
  score = 0,
  reasons = [],
  overridden = false,
  className = "",
}: RtoRiskBadgeProps) {
  const safeScore = score ?? 0;

  if (overridden) {
    return (
      <span
        title={reasons.join(" • ") || "RTO risk overridden by staff"}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Risk Overridden</span>
      </span>
    );
  }

  if (safeScore >= 50) {
    return (
      <span
        title={reasons.join(" • ") || "High RTO risk profile"}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse ${className}`}
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>High Risk ({safeScore} pts)</span>
      </span>
    );
  }

  if (safeScore >= 20) {
    return (
      <span
        title={reasons.join(" • ") || "Moderate RTO risk"}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Moderate ({safeScore} pts)</span>
      </span>
    );
  }

  return (
    <span
      title="Verified low-risk address"
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>Safe ({safeScore} pts)</span>
    </span>
  );
}
