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
import { useAdminTheme } from "./AdminThemeContext";

interface Props {
  initialData: OverviewDashboardData;
}

export function OverviewCommandCentre({ initialData }: Props) {
  const [data] = useState<OverviewDashboardData>(initialData);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");
  const { theme } = useAdminTheme();
  const isDark = theme === "dark";

  const currentSeries =
    timeRange === "7D"
      ? data.timeSeries.days7
      : timeRange === "30D"
      ? data.timeSeries.days30
      : data.timeSeries.days90;

  // Max value for chart bar scaling
  const maxVal = Math.max(...currentSeries.netRevenue, 100);

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Live Operational Funnel Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-sans uppercase tracking-wider font-semibold ${
              isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
            }`}
          >
            Live Atelier Operational Funnel
          </span>
          <span
            className={`text-xs font-sans ${
              isDark ? "text-[#736C8D]" : "text-[#15101F]/50"
            }`}
          >
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
                  ? isDark
                    ? "bg-rose-950/30 border-rose-800/40 hover:border-rose-700/60"
                    : "bg-rose-50/80 border-rose-200 hover:border-rose-300"
                  : isDark
                  ? "bg-[#1A1726] border-[#2A253B] hover:border-[#7C3AED]/50"
                  : "bg-white border-[#15101F]/10 hover:border-[#6A2CFF]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-sans font-medium truncate ${
                    isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
                  }`}
                >
                  {item.label}
                </span>
                <ArrowUpRight
                  className={`w-3.5 h-3.5 transition-colors ${
                    isDark
                      ? "text-[#736C8D] group-hover:text-[#D9F99D]"
                      : "text-[#15101F]/40 group-hover:text-[#6A2CFF]"
                  }`}
                />
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span
                  className={`font-sans text-2xl font-bold tracking-tight ${
                    item.isOverdueAlert
                      ? isDark
                        ? "text-rose-400"
                        : "text-rose-600"
                      : isDark
                      ? "text-[#F4F3F8]"
                      : "text-[#15101F]"
                  }`}
                >
                  {item.count}
                </span>
                {item.isOverdueAlert && (
                  <span
                    className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${
                      isDark
                        ? "bg-rose-950/70 text-rose-300 border border-rose-800/50"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
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
        <div
          className={`lg:col-span-2 rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between transition-colors ${
            isDark
              ? "bg-[#1A1726] border-[#2A253B]"
              : "bg-white border-[#15101F]/10"
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
              isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`font-sans font-bold text-lg tracking-tight ${
                    isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
                >
                  Net Revenue & True Net Margin Over Time
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold ${
                    isDark
                      ? "bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/30"
                      : "bg-[#6A2CFF]/10 text-[#6A2CFF]"
                  }`}
                >
                  Excl. GST
                </span>
              </div>
              <p
                className={`text-xs font-sans mt-0.5 ${
                  isDark ? "text-[#9E98B3]" : "text-[#15101F]/65"
                }`}
              >
                Realized revenue vs true bottom-line margin after COGS, freight, gateway fees & RTO losses
              </p>
            </div>

            {/* Segmented Time Control */}
            <div
              className={`inline-flex items-center p-1 rounded-2xl border text-xs font-sans shrink-0 ${
                isDark
                  ? "bg-[#13111C] border-[#2A253B]"
                  : "bg-[#F5F0E8] border-[#15101F]/10"
              }`}
            >
              {(["7D", "30D", "90D"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    timeRange === range
                      ? isDark
                        ? "bg-[#7C3AED] text-white shadow-sm font-semibold"
                        : "bg-[#15101F] text-white shadow-sm font-semibold"
                      : isDark
                      ? "text-[#9E98B3] hover:text-[#F4F3F8]"
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
                  <div
                    className={`opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 pointer-events-none text-xs font-sans rounded-xl p-2.5 shadow-xl whitespace-nowrap border ${
                      isDark
                        ? "bg-[#13111C] border-[#2A253B] text-[#F4F3F8]"
                        : "bg-[#15101F] border-transparent text-white"
                    }`}
                  >
                    <div className="font-bold">{date}</div>
                    <div className="text-emerald-400 font-medium">Net Rev: ₹{rev.toLocaleString("en-IN")}</div>
                    <div className="text-[#CDB8FF] font-medium">Net Margin: ₹{margin.toLocaleString("en-IN")}</div>
                  </div>

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Revenue Bar */}
                    <div
                      className={`w-full max-w-[18px] rounded-t-md transition-all duration-500 hover:brightness-110 ${
                        isDark ? "bg-[#8B5CF6]" : "bg-[#6A2CFF]"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    {/* Margin Bar */}
                    <div
                      className={`w-full max-w-[18px] rounded-t-md transition-all duration-500 hover:brightness-110 border ${
                        isDark
                          ? "bg-[#D9F99D] border-transparent"
                          : "bg-[#D8FF3F] border-[#15101F]/10"
                      }`}
                      style={{ height: `${marginPercent}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-sans truncate max-w-[38px] ${
                      isDark ? "text-[#736C8D]" : "text-[#15101F]/60"
                    }`}
                  >
                    {date.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Legend & Summary */}
          <div
            className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-sans ${
              isDark
                ? "border-[#2A253B] text-[#9E98B3]"
                : "border-[#15101F]/10 text-[#15101F]/70"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded ${isDark ? "bg-[#8B5CF6]" : "bg-[#6A2CFF]"}`} />
                <span>Net Revenue (Excl GST)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded ${isDark ? "bg-[#D9F99D]" : "bg-[#D8FF3F] border border-[#15101F]/20"}`} />
                <span>True Net Margin</span>
              </span>
            </div>
            <Link
              href="/admin/margin"
              className={`font-semibold hover:underline flex items-center gap-1 ${
                isDark ? "text-[#C4B5FD]" : "text-[#6A2CFF]"
              }`}
            >
              <span>View Margin Waterfall</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Donut Card: Orders by Product Category */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between transition-colors ${
            isDark
              ? "bg-[#1A1726] border-[#2A253B]"
              : "bg-white border-[#15101F]/10"
          }`}
        >
          <div>
            <h2
              className={`font-sans font-bold text-lg tracking-tight ${
                isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
              }`}
            >
              Orders by Category
            </h2>
            <p
              className={`text-xs font-sans mt-0.5 ${
                isDark ? "text-[#9E98B3]" : "text-[#15101F]/60"
              }`}
            >
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
                  stroke={isDark ? "#2A253B" : "#EDE6DA"}
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
                <span
                  className={`font-sans text-xl font-bold tracking-tight ${
                    isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
                >
                  {data.categoryDonut.reduce((sum, item) => sum + item.count, 0)}
                </span>
                <span
                  className={`text-[10px] font-sans uppercase tracking-wider ${
                    isDark ? "text-[#9E98B3]" : "text-[#15101F]/60"
                  }`}
                >
                  Units
                </span>
              </div>
            </div>
          </div>

          {/* Category Legend */}
          <div
            className={`space-y-2 pt-4 border-t ${
              isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
            }`}
          >
            {data.categoryDonut.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs font-sans"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={`truncate font-medium ${
                      isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-normal ${
                      isDark ? "text-[#736C8D]" : "text-[#15101F]/50"
                    }`}
                  >
                    {item.percentage}%
                  </span>
                  <span
                    className={`font-semibold ${
                      isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. KPI Tiles Grid with Count-up Values & Role Filtering */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-sans uppercase tracking-wider font-semibold ${
              isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
            }`}
          >
            Key Performance Indicators ({data.role.replace(/_/g, " ")})
          </span>
          {data.role === "SUPER_ADMIN" && (
            <span
              className={`text-[11px] font-sans px-2 py-0.5 rounded-full font-semibold ${
                isDark
                  ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/40"
                  : "text-emerald-700 bg-emerald-50"
              }`}
            >
              Executive Financial View
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {data.kpiTiles.map((tile: KpiTile) => (
            <div
              key={tile.id}
              className={`rounded-3xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                isDark
                  ? "bg-[#1A1726] border-[#2A253B] hover:border-[#7C3AED]/40"
                  : "bg-white border-[#15101F]/10 hover:border-[#6A2CFF]/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-sans uppercase tracking-wider font-medium ${
                    isDark ? "text-[#9E98B3]" : "text-[#15101F]/60"
                  }`}
                >
                  {tile.label}
                </span>
                {tile.trend === "up" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : tile.trend === "down" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                ) : null}
              </div>
              <div className="mt-3">
                <div
                  className={`font-sans text-2xl font-bold tracking-tight ${
                    isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
                >
                  {tile.value}
                </div>
                {tile.change && (
                  <div
                    className={`text-[11px] font-sans font-medium mt-1 ${
                      tile.trend === "up"
                        ? "text-emerald-500"
                        : isDark
                        ? "text-[#9E98B3]"
                        : "text-[#15101F]/60"
                    }`}
                  >
                    {tile.change}
                  </div>
                )}
                <div
                  className={`text-[11px] font-sans mt-0.5 truncate ${
                    isDark ? "text-[#736C8D]" : "text-[#15101F]/60"
                  }`}
                >
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
        <div
          className={`rounded-3xl p-6 border shadow-sm transition-colors ${
            isDark
              ? "bg-[#1A1726] border-[#2A253B]"
              : "bg-white border-[#15101F]/10"
          }`}
        >
          <div
            className={`flex items-center justify-between mb-4 pb-3 border-b ${
              isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${isDark ? "text-[#8B5CF6]" : "text-[#6A2CFF]"}`} />
              <h3
                className={`font-sans font-bold text-base ${
                  isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                }`}
              >
                Needs Your Attention ({data.attentionItems.length})
              </h3>
            </div>
            <span
              className={`text-xs font-sans ${
                isDark ? "text-[#736C8D]" : "text-[#15101F]/50"
              }`}
            >
              Action required
            </span>
          </div>

          <div className="space-y-3">
            {data.attentionItems.map((item: AttentionItem) => (
              <Link
                key={item.id}
                href={item.href}
                className={`block p-4 rounded-2xl border transition-all group ${
                  isDark
                    ? "bg-[#13111C] border-[#2A253B] hover:border-[#7C3AED]/50 hover:bg-[#1A1726]"
                    : "bg-[#FAF7F2] border-[#15101F]/10 hover:border-[#6A2CFF]/40 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-sans font-semibold text-sm transition-colors ${
                          isDark
                            ? "text-[#F4F3F8] group-hover:text-[#D9F99D]"
                            : "text-[#15101F] group-hover:text-[#6A2CFF]"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-sans px-2 py-0.5 rounded font-semibold ${
                          item.priority === "URGENT"
                            ? isDark
                              ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                              : "bg-rose-100 text-rose-700"
                            : item.priority === "HIGH"
                            ? isDark
                              ? "bg-amber-950/60 text-amber-300 border border-amber-800/50"
                              : "bg-amber-100 text-amber-800"
                            : isDark
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-sans mt-1 ${
                        isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ArrowUpRight
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isDark
                        ? "text-[#736C8D] group-hover:text-[#D9F99D]"
                        : "text-[#15101F]/40 group-hover:text-[#6A2CFF]"
                    }`}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div
          className={`rounded-3xl p-6 border shadow-sm transition-colors ${
            isDark
              ? "bg-[#1A1726] border-[#2A253B]"
              : "bg-white border-[#15101F]/10"
          }`}
        >
          <div
            className={`flex items-center justify-between mb-4 pb-3 border-b ${
              isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isDark ? "text-[#8B5CF6]" : "text-[#6A2CFF]"}`} />
              <h3
                className={`font-sans font-bold text-base ${
                  isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                }`}
              >
                Recent Atelier Activity Feed
              </h3>
            </div>
            <Link
              href="/admin/audit"
              className={`text-xs font-sans font-semibold hover:underline ${
                isDark ? "text-[#C4B5FD]" : "text-[#6A2CFF]"
              }`}
            >
              Full Audit Log &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentActivity.map((act) => (
              <div
                key={act.id}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-colors ${
                  isDark
                    ? "bg-[#13111C]/80 border-[#2A253B]"
                    : "bg-[#FAF7F2]/60 border-[#15101F]/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark
                        ? "bg-[#7C3AED]/20 text-[#D9F99D]"
                        : "bg-[#6A2CFF]/10 text-[#6A2CFF]"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-sans font-semibold ${
                        isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                      }`}
                    >
                      {act.action}
                    </div>
                    <div
                      className={`text-xs font-sans mt-0.5 ${
                        isDark ? "text-[#9E98B3]" : "text-[#15101F]/60"
                      }`}
                    >
                      {act.detail}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span
                    data-mono-strict="true"
                    className={`text-[11px] font-mono ${
                      isDark ? "text-[#736C8D]" : "text-[#15101F]/50"
                    }`}
                  >
                    {act.timestamp}
                  </span>
                  <span
                    className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded mt-1 border ${
                      isDark
                        ? "bg-[#1A1726] text-[#C4B5FD] border-[#2A253B]"
                        : "bg-white text-[#15101F]/70 border-[#15101F]/10"
                    }`}
                  >
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
