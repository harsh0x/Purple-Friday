"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { OverviewDashboardData, FunnelItem, KpiTile, AttentionItem } from "@/server/analytics/overview-service";

interface Props {
  initialData: OverviewDashboardData;
}

export function OverviewCommandCentre({ initialData }: Props) {
  const [data] = useState<OverviewDashboardData>(initialData);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");

  const currentSeries =
    timeRange === "7D"
      ? data.timeSeries.days7
      : timeRange === "30D"
      ? data.timeSeries.days30
      : data.timeSeries.days90;

  // Max value for chart bar scaling
  const maxVal = Math.max(...currentSeries.netRevenue, 100);

  return (
    <div className="space-y-8">
      {/* 1. Live Operational Funnel Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#15101F]/60 font-semibold">
            Live Atelier Operational Funnel
          </span>
          <span className="text-[11px] font-mono text-[#15101F]/50">
            Real-time pipeline dispatch telemetry
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.funnel.map((item: FunnelItem) => (
            <Link
              key={item.id}
              href={item.href}
              className={`group p-4 rounded-2xl border transition-all hover:shadow-md ${
                item.isOverdueAlert
                  ? "bg-rose-50/80 border-rose-200 hover:border-rose-300"
                  : "bg-white border-[#15101F]/10 hover:border-[#6A2CFF]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#15101F]/60 font-medium truncate">
                  {item.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#15101F]/40 group-hover:text-[#6A2CFF] transition-colors" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`font-mono text-2xl font-black ${
                    item.isOverdueAlert ? "text-rose-600" : "text-[#15101F]"
                  }`}
                >
                  {item.count}
                </span>
                {item.isOverdueAlert && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    SLA ALERT
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Big Chart Card + Category Donut Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Chart Card with Segmented Time Control */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#15101F]/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                  Net Revenue & True Net Margin Over Time
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                  Excl. GST
                </span>
              </div>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Realized revenue vs true bottom-line margin after COGS, freight, gateway fees & RTO losses
              </p>
            </div>

            {/* Segmented Time Control */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/10 text-xs font-mono shrink-0">
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

          {/* SVG Bar Chart Visualization */}
          <div className="my-6 min-h-[200px] flex items-end justify-between gap-2 px-2">
            {currentSeries.dates.map((date: string, idx: number) => {
              const rev = currentSeries.netRevenue[idx] || 0;
              const margin = currentSeries.netMargin[idx] || 0;
              const heightPercent = Math.min(100, Math.max(12, Math.round((rev / maxVal) * 100)));
              const marginPercent = Math.min(100, Math.max(8, Math.round((margin / maxVal) * 100)));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 pointer-events-none bg-[#15101F] text-white text-[11px] font-mono rounded-xl p-2 shadow-xl whitespace-nowrap">
                    <div className="font-bold">{date}</div>
                    <div className="text-emerald-400">Net Rev: ₹{rev.toLocaleString("en-IN")}</div>
                    <div className="text-[#CDB8FF]">Net Margin: ₹{margin.toLocaleString("en-IN")}</div>
                  </div>

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Revenue Bar */}
                    <div
                      className="w-full max-w-[18px] bg-[#6A2CFF] rounded-t-md transition-all duration-500 hover:brightness-110"
                      style={{ height: `${heightPercent}%` }}
                    />
                    {/* Margin Bar */}
                    <div
                      className="w-full max-w-[18px] bg-[#D8FF3F] rounded-t-md transition-all duration-500 hover:brightness-110 border border-[#15101F]/10"
                      style={{ height: `${marginPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#15101F]/50 truncate max-w-[36px]">
                    {date.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Legend & Summary */}
          <div className="pt-4 border-t border-[#15101F]/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#15101F]/70">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#6A2CFF]" />
                <span>Net Revenue (Excl GST)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#D8FF3F] border border-[#15101F]/20" />
                <span>True Net Margin</span>
              </span>
            </div>
            <Link
              href="/admin/margin"
              className="font-semibold text-[#6A2CFF] hover:underline flex items-center gap-1"
            >
              <span>View Margin Waterfall</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Donut Card: Orders by Product Category */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
              Orders by Category
            </h2>
            <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
              Production distribution across atelier catalogues
            </p>
          </div>

          {/* Donut Visualization */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#EDE6DA"
                  strokeWidth="12"
                  fill="none"
                />
                {data.categoryDonut.map((item, idx) => {
                  const circumference = 251.2;
                  const strokeLength = (item.percentage / 100) * circumference;
                  let prevOffset = 0;
                  for (let i = 0; i < idx; i++) {
                    prevOffset += (data.categoryDonut[i].percentage / 100) * circumference;
                  }

                  return (
                    <circle
                      key={item.category}
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={item.color}
                      strokeWidth="12"
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={-prevOffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-mono text-xl font-black text-[#15101F]">
                  {data.categoryDonut.reduce((sum, item) => sum + item.count, 0)}
                </span>
                <span className="text-[10px] font-mono text-[#15101F]/60 uppercase tracking-wider">
                  Units
                </span>
              </div>
            </div>
          </div>

          {/* Category Legend */}
          <div className="space-y-2 pt-4 border-t border-[#15101F]/10">
            {data.categoryDonut.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#15101F]/70 truncate">{item.category}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#15101F]/50 font-normal">{item.percentage}%</span>
                  <span className="font-bold text-[#15101F]">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. KPI Tiles Grid with Count-up Values & Role Filtering */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#15101F]/60 font-semibold">
            Key Performance Indicators ({data.role.replace(/_/g, " ")})
          </span>
          {data.role === "SUPER_ADMIN" && (
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              Executive Financial View
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {data.kpiTiles.map((tile: KpiTile) => (
            <div
              key={tile.id}
              className="bg-white rounded-3xl p-5 border border-[#15101F]/10 shadow-sm flex flex-col justify-between hover:border-[#6A2CFF]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#15101F]/60 font-medium">
                  {tile.label}
                </span>
                {tile.trend === "up" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : tile.trend === "down" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                ) : null}
              </div>
              <div className="mt-3">
                <div className="font-mono text-2xl font-black text-[#15101F] tracking-tight">
                  {tile.value}
                </div>
                {tile.change && (
                  <div
                    className={`text-[10px] font-mono font-semibold mt-1 ${
                      tile.trend === "up" ? "text-emerald-600" : "text-[#15101F]/60"
                    }`}
                  >
                    {tile.change}
                  </div>
                )}
                <div className="text-[11px] text-[#15101F]/60 font-sans mt-0.5 truncate">
                  {tile.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Actionable "Needs Your Attention" + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Your Attention List */}
        <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#15101F]/10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#6A2CFF]" />
              <h3 className="font-display font-bold text-base text-[#15101F]">
                Needs Your Attention ({data.attentionItems.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-[#15101F]/50">Action required</span>
          </div>

          <div className="space-y-3">
            {data.attentionItems.map((item: AttentionItem) => (
              <Link
                key={item.id}
                href={item.href}
                className="block p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 hover:border-[#6A2CFF]/40 hover:bg-white transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-sm text-[#15101F] group-hover:text-[#6A2CFF] transition-colors">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          item.priority === "URGENT"
                            ? "bg-rose-100 text-rose-700"
                            : item.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#15101F]/70 font-sans mt-1">
                      {item.description}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#15101F]/40 group-hover:text-[#6A2CFF] shrink-0 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#15101F]/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6A2CFF]" />
              <h3 className="font-display font-bold text-base text-[#15101F]">
                Recent Atelier Activity Feed
              </h3>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs font-mono font-semibold text-[#6A2CFF] hover:underline"
            >
              Full Audit Log &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentActivity.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF7F2]/60 border border-[#15101F]/5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-[#6A2CFF]/10 text-[#6A2CFF] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-sans font-bold text-[#15101F]">
                      {act.action}
                    </div>
                    <div className="text-[11px] font-sans text-[#15101F]/60 mt-0.5">
                      {act.detail}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-mono text-[#15101F]/50">{act.timestamp}</span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white text-[#15101F]/70 border border-[#15101F]/10 mt-1">
                    {act.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}