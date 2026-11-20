"use client";

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";

export function OverviewCharts() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Big Chart Card with Segmented Time Control */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
              Order Volume & Production Run
            </h2>
            <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
              Live tracking for custom bulk print batches
            </p>
          </div>

          {/* Segmented Time Control */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/10 text-xs font-mono">
            {(["7D", "30D", "90D"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  timeRange === range
                    ? "bg-[#15101F] text-white shadow-sm"
                    : "text-[#15101F]/60 hover:text-[#15101F]"
                }`}
              >
                {range === "7D" ? "7 days" : range === "30D" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Empty State SVG Chart Area */}
        <div className="my-8 py-8 px-4 rounded-2xl bg-[#F5F0E8]/50 border border-dashed border-[#15101F]/15 flex flex-col items-center justify-center text-center min-h-[180px]">
          <div className="w-10 h-10 rounded-2xl bg-[#6A2CFF]/10 text-[#6A2CFF] flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#15101F] font-bold">
            Awaiting Transactions ({timeRange})
          </p>
          <p className="text-xs text-[#15101F]/60 max-w-sm mt-1 font-sans">
            No orders recorded in this period. Production volume and dispatch bars will plot here live as orders are processed.
          </p>
        </div>

        {/* Chart Footer Indicator */}
        <div className="pt-4 border-t border-[#15101F]/10 flex items-center justify-between text-xs font-mono text-[#15101F]/60">
          <span>Range: {timeRange === "7D" ? "Past 7 Days" : timeRange === "30D" ? "Past Month" : "Quarterly"}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6A2CFF]" />
            <span>0 Bulk Batches</span>
          </span>
        </div>
      </div>

      {/* Donut Chart Card with Legend */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
            Order Status Mix
          </h2>
          <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
            Distribution across fulfilment pipeline
          </p>
        </div>

        {/* SVG Donut Clean Empty State */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#EDE6DA"
                strokeWidth="12"
                fill="none"
              />
              {/* Neutral zero state ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#6A2CFF"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset="251.2"
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-2xl font-black text-[#15101F]">0</span>
              <span className="text-[10px] font-mono text-[#15101F]/60 uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-4 border-t border-[#15101F]/10">
          {[
            { label: "Approved / In Production", count: 0, color: "#6A2CFF" },
            { label: "Proof Approval Pending", count: 0, color: "#D8FF3F" },
            { label: "Dispatched / Delivered", count: 0, color: "#221A31" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#15101F]/70">{item.label}</span>
              </div>
              <span className="font-bold text-[#15101F]">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
