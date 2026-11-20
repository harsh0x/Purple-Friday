import React from "react";
import { Clock, PauseCircle, AlertOctagon, CheckCircle } from "lucide-react";

interface OrderSlaBadgeProps {
  isOverdue: boolean;
  hoursRemaining?: number | null;
  isPaused: boolean;
  status: string;
}

export function OrderSlaBadge({
  isOverdue,
  hoursRemaining,
  isPaused,
  status,
}: OrderSlaBadgeProps) {
  // If order is in terminal state
  if (["DELIVERED", "CANCELLED", "REFUNDED", "RTO"].includes(status.toUpperCase())) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
        <CheckCircle className="w-3 h-3 text-zinc-400" />
        <span>Completed</span>
      </span>
    );
  }

  // If clock is paused while waiting on customer
  if (isPaused || status === "MOCKUP_SENT" || status === "REVISION_REQUESTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-purple-50 dark:bg-purple-950/40 text-[#6A2CFF] dark:text-[#CDB8FF] border border-[#6A2CFF]/20">
        <PauseCircle className="w-3 h-3 text-[#6A2CFF] animate-pulse" />
        <span>SLA Paused</span>
      </span>
    );
  }

  // Overdue: Blinking OVERDUE badge with red border
  if (isOverdue || (hoursRemaining !== null && hoursRemaining !== undefined && hoursRemaining < 0)) {
    const overdueHours = hoursRemaining !== null && hoursRemaining !== undefined ? Math.abs(hoursRemaining) : 0;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500 animate-pulse shadow-sm">
        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span>OVERDUE {overdueHours > 0 ? `(${overdueHours}h)` : ""}</span>
      </span>
    );
  }

  // Urgent: < 8 hours remaining -> Red
  if (hoursRemaining !== null && hoursRemaining !== undefined && hoursRemaining < 8) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
        <Clock className="w-3 h-3 text-rose-600" />
        <span>{hoursRemaining}h left</span>
      </span>
    );
  }

  // Warning: 8 to 24 hours remaining -> Amber
  if (hoursRemaining !== null && hoursRemaining !== undefined && hoursRemaining <= 24) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>{hoursRemaining}h left</span>
      </span>
    );
  }

  // Normal: > 24 hours remaining -> Green
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
      <Clock className="w-3 h-3 text-emerald-600" />
      <span>{hoursRemaining !== null && hoursRemaining !== undefined ? `${hoursRemaining}h left` : "On Track"}</span>
    </span>
  );
}
