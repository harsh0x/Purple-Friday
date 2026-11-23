"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  Star,
  FileText,
} from "lucide-react";
import { OverviewDashboardData, KpiTile, AttentionItem } from "@/server/analytics/overview-service";
import { useAdminTheme } from "./AdminThemeContext";

interface Props {
  initialData: OverviewDashboardData;
}

export function OverviewCommandCentre({ initialData }: Props) {
  const [data] = useState<OverviewDashboardData>(initialData);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");
  const [activeTooltipIdx, setActiveTooltipIdx] = useState<number | null>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useAdminTheme();
  const isDark = theme === "dark";

  const is7D = timeRange === "7D";
  const is30D = timeRange === "30D";
  const is90D = timeRange === "90D";

  const currentSeries =
    is7D
      ? data.timeSeries.days7
      : is30D
        ? data.timeSeries.days30
        : data.timeSeries.days90;

  const maxVal = Math.max(...currentSeries.netRevenue, 100);

  // Automatically scroll timeline to the latest date (far right) when time range changes
  useEffect(() => {
    setActiveTooltipIdx(null);
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollTo({
        left: chartScrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [timeRange]);

  const getLabelInfo = (dateStr: string, idx: number, total: number) => {
    const parts = dateStr.trim().split(" ");
    const day = parts[0] || "";
    const month = parts[1] || "";

    if (total <= 7) {
      return { show: true, text: day };
    }

    if (total <= 30) {
      if (day === "1") {
        return { show: true, text: `1 ${month}`.trim() };
      }
      if (idx === 0 || idx === total - 1 || idx % 4 === 0) {
        return { show: true, text: day };
      }
      return { show: false, text: "" };
    }

    // 90 Days
    if (day === "1") {
      return { show: true, text: `1 ${month}`.trim() };
    }
    if (idx === 0 || idx === total - 1 || idx % 7 === 0) {
      return { show: true, text: day };
    }
    return { show: false, text: "" };
  };

  const tileIcons: Record<string, React.ReactNode> = {
    orders_today: <ShoppingBag className="w-5 h-5 text-[#6A2CFF] dark:text-[#CDB8FF]" />,
    revenue_month: <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    orders_action: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    reviews_waiting: <Star className="w-5 h-5 text-[#8B5CF6] dark:text-[#D9F99D]" />,
    open_quotes: <FileText className="w-5 h-5 text-[#6A2CFF] dark:text-[#CDB8FF]" />,
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Greeting Header */}
      <div
        className={`pb-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
          }`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6A2CFF] dark:text-[#D9F99D] uppercase tracking-wider mb-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Command Centre</span>
          </div>
          <h1
            className={`font-sans font-black text-2xl sm:text-3xl tracking-tight ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
              }`}
          >
            {data.greetingText}
          </h1>
        </div>
      </div>

      {/* 5 KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {data.kpiTiles.map((tile: KpiTile) => (
          <div
            key={tile.id}
            className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between transition-colors ${isDark ? "bg-[#1A1726] border-[#2A253B]" : "bg-white border-[#15101F]/10"
              }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-sans font-medium ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/70"
                  }`}
              >
                {tile.label}
              </span>
              <div className="p-2 rounded-xl bg-[#6A2CFF]/10 dark:bg-[#7C3AED]/20">
                {tileIcons[tile.id] || <Sparkles className="w-4 h-4 text-[#6A2CFF]" />}
              </div>
            </div>
            <div className="mt-4">
              <div
                data-number
                className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
              >
                {tile.value}
              </div>
              <p
                className={`text-[11px] font-sans mt-1 ${isDark ? "text-[#736C8D]" : "text-[#15101F]/50"
                  }`}
              >
                {tile.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Category Donut Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart with 7, 30, 90 day controls */}
        <div
          className={`lg:col-span-2 rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between transition-colors overflow-hidden ${
            isDark ? "bg-[#1A1726] border-[#2A253B]" : "bg-white border-[#15101F]/10"
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
                  Net Revenue
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
                Daily realized revenue across all confirmed orders
              </p>
            </div>

            {/* Segmented Time Control */}
            <div
              className={`inline-flex items-center p-1 rounded-2xl border text-xs font-sans shrink-0 ${
                isDark ? "bg-[#13111C] border-[#2A253B]" : "bg-[#F5F0E8] border-[#15101F]/10"
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

          {/* Scrollable Bar Chart Visualization */}
          <div className="my-6">
            <div
              ref={chartScrollRef}
              className="overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent -mx-2 px-2"
            >
              <div
                className={`min-h-[220px] flex items-end justify-between ${
                  is7D
                    ? "w-full gap-2 sm:gap-4 px-2"
                    : is30D
                      ? "min-w-[620px] lg:min-w-0 w-full gap-1.5 sm:gap-2 px-1"
                      : "min-w-[960px] lg:min-w-[1080px] w-full gap-1 px-1"
                }`}
              >
                {currentSeries.dates.map((date: string, idx: number) => {
                  const rev = currentSeries.netRevenue[idx] || 0;
                  const heightPercent = Math.min(100, Math.max(8, Math.round((rev / maxVal) * 100)));
                  const labelInfo = getLabelInfo(date, idx, currentSeries.dates.length);
                  const isTooltipOpen = activeTooltipIdx === idx;

                  const tooltipPosClass =
                    idx < 3
                      ? "left-0"
                      : idx > currentSeries.dates.length - 4
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2";

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveTooltipIdx(isTooltipOpen ? null : idx)}
                      onMouseEnter={() => setActiveTooltipIdx(idx)}
                      onMouseLeave={() => setActiveTooltipIdx(null)}
                      className="flex-1 flex flex-col items-center gap-1.5 group relative cursor-pointer"
                    >
                      {/* Tooltip */}
                      <div
                        className={`transition-all duration-150 absolute bottom-full mb-2 z-30 pointer-events-none text-xs font-sans rounded-xl p-2.5 shadow-xl whitespace-nowrap border ${tooltipPosClass} ${
                          isTooltipOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible"
                        } ${
                          isDark
                            ? "bg-[#13111C] border-[#2A253B] text-[#F4F3F8]"
                            : "bg-[#15101F] border-transparent text-white"
                        }`}
                      >
                        <div className="font-bold">{date}</div>
                        <div className="text-emerald-400 font-medium">₹{rev.toLocaleString("en-IN")}</div>
                      </div>

                      {/* Single Revenue Bar */}
                      <div className="w-full flex items-end justify-center h-44">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 hover:brightness-125 ${
                            isDark ? "bg-[#7C3AED]" : "bg-[#6A2CFF]"
                          } ${isTooltipOpen ? "ring-2 ring-white/50 brightness-125" : ""} ${
                            is7D
                              ? "max-w-[32px] min-w-[18px]"
                              : is30D
                                ? "max-w-[18px] min-w-[10px]"
                                : "max-w-[12px] min-w-[6px]"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      <span
                        className={`text-[10px] sm:text-[11px] font-sans truncate ${
                          labelInfo.show
                            ? isDark
                              ? "text-[#736C8D] font-medium"
                              : "text-[#15101F]/70 font-medium"
                            : "invisible select-none"
                        }`}
                      >
                        {labelInfo.show ? labelInfo.text : "·"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-sans ${
              isDark ? "border-[#2A253B] text-[#9E98B3]" : "border-[#15101F]/10 text-[#15101F]/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#6A2CFF]" />
              <span>Net Revenue (excl. GST)</span>
            </div>
            <div className="flex items-center gap-3">
              {!is7D && (
                <span className="text-[11px] text-[#9E98B3] flex items-center gap-1 font-mono">
                  ↔ Scroll or swipe to view full timeline
                </span>
              )}
              <span>Daily totals from real store orders</span>
            </div>
          </div>
        </div>

        {/* Category Donut Card */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between transition-colors ${isDark ? "bg-[#1A1726] border-[#2A253B]" : "bg-white border-[#15101F]/10"
            }`}
        >
          <div>
            <div
              className={`pb-4 border-b ${isDark ? "border-[#2A253B]" : "border-[#15101F]/10"}`}
            >
              <h2
                className={`font-sans font-bold text-lg tracking-tight ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
              >
                Orders by Category
              </h2>
              <p
                className={`text-xs font-sans mt-0.5 ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/65"
                  }`}
              >
                Product volume distribution
              </p>
            </div>

            <div className="my-6 flex justify-center items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {data.categoryDonut.map((cat, idx) => {
                    const strokeDashoffset = data.categoryDonut
                      .slice(0, idx)
                      .reduce((acc, c) => acc + c.percentage, 0);

                    return (
                      <circle
                        key={cat.category}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={cat.color}
                        strokeWidth="12"
                        strokeDasharray={`${cat.percentage} ${100 - cat.percentage}`}
                        strokeDashoffset={-strokeDashoffset}
                        fill="transparent"
                        className="transition-all duration-700"
                      />
                    );
                  })}
                </svg>
                <div className="absolute text-center">
                  <span
                    className={`text-xs font-sans uppercase tracking-wider block ${isDark ? "text-[#736C8D]" : "text-[#15101F]/50"
                      }`}
                  >
                    Top
                  </span>
                  <span
                    className={`text-xl font-bold font-sans ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                      }`}
                  >
                    {data.categoryDonut[0]?.percentage || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {data.categoryDonut.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className={isDark ? "text-[#F4F3F8]" : "text-[#15101F]"}>
                      {cat.category}
                    </span>
                  </div>
                  <span className={`font-mono ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/60"}`}>
                    {cat.count} units ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* "Needs your attention" list + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention List */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border shadow-sm transition-colors ${isDark ? "bg-[#1A1726] border-[#2A253B]" : "bg-white border-[#15101F]/10"
            }`}
        >
          <div
            className={`pb-4 border-b flex items-center justify-between ${isDark ? "border-[#2A253B]" : "border-[#15101F]/10"
              }`}
          >
            <div>
              <h2
                className={`font-sans font-bold text-lg tracking-tight ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                  }`}
              >
                Needs Your Attention
              </h2>
              <p
                className={`text-xs font-sans mt-0.5 ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/65"
                  }`}
              >
                Items requiring store administrative action
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.attentionItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                All caught up! No pending alerts or overdue tasks.
              </div>
            ) : (
              data.attentionItems.map((item: AttentionItem) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`block p-4 rounded-2xl border transition-all hover:shadow-sm ${isDark
                    ? "bg-[#13111C] border-[#2A253B] hover:border-[#7C3AED]/50"
                    : "bg-[#FAF7F2] border-[#15101F]/10 hover:border-[#6A2CFF]/40"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                            }`}
                        >
                          {item.title}
                        </span>
                        <span
                          data-chip
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6A2CFF]/15 text-[#6A2CFF] dark:text-[#CDB8FF]"
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/65"
                          }`}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border shadow-sm transition-colors ${isDark ? "bg-[#1A1726] border-[#2A253B]" : "bg-white border-[#15101F]/10"
            }`}
        >
          <div
            className={`pb-4 border-b ${isDark ? "border-[#2A253B]" : "border-[#15101F]/10"}`}
          >
            <h2
              className={`font-sans font-bold text-lg tracking-tight ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"
                }`}
            >
              Recent Activity
            </h2>
            <p
              className={`text-xs font-sans mt-0.5 ${isDark ? "text-[#9E98B3]" : "text-[#15101F]/65"
                }`}
            >
              Live operational event feed
            </p>
          </div>

          <div className="mt-5 space-y-3">
              {
                data.recentActivity.map((act, idx) => (
                  <div
                    key={`${act.id}-${idx}`}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${isDark
                      ? "bg-[#13111C] border-[#2A253B]"
                      : "bg-[#FAF7F2] border-[#15101F]/10"
                      }`}
                  >
                    <div>
                      <div className={`font-semibold ${isDark ? "text-[#F4F3F8]" : "text-[#15101F]"}`}>
                        {act.action}
                      </div>
                      <div className={isDark ? "text-[#9E98B3]" : "text-[#15101F]/60"}>
                        {act.detail}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        data-chip
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-zinc-400 border border-white/10"
                      >
                        {act.tag}
                      </span>
                      <div className="text-[10px] text-zinc-400 mt-1">{act.timestamp}</div>
                    </div>
                  </div>
                ))
              }
          </div>
        </div>
      </div>
    </div>
  );
}
