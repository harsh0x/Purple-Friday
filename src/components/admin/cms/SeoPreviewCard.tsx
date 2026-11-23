"use client";

import React from "react";
import { Search, CheckCircle2, AlertTriangle } from "lucide-react";

interface SeoPreviewCardProps {
  title: string;
  description: string;
  path: string;
  onChangeTitle: (title: string) => void;
  onChangeDescription: (description: string) => void;
  heading?: string;
}

export function SeoPreviewCard({
  title,
  description,
  path,
  onChangeTitle,
  onChangeDescription,
  heading = "SEO & Google Search Appearance",
}: SeoPreviewCardProps) {
  const titleLen = title.length;
  const descLen = description.length;

  const isTitleOptimal = titleLen >= 30 && titleLen <= 65;
  const isDescOptimal = descLen >= 70 && descLen <= 165;

  const displayUrl = `https://purplefriday.in${path.startsWith("/") ? path : `/${path}`}`;
  const truncatedDesc =
    description.length > 165 ? `${description.slice(0, 162)}...` : description;

  return (
    <div className="space-y-5 rounded-3xl border border-pf-ink/15 dark:border-white/10 bg-white dark:bg-[#181524] p-6 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-pf-ink/10 dark:border-white/10">
        <Search className="w-4 h-4 text-pf-violet dark:text-[#CDB8FF]" />
        <h3 className="font-display font-bold text-base text-pf-ink dark:text-white">
          {heading}
        </h3>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
              Meta Title (Search Engine Title)
            </label>
            <span
              className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                isTitleOptimal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {isTitleOptimal ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {titleLen}/60 chars (optimal 40–60)
            </span>
          </div>
          <input
            type="text"
            maxLength={80}
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="e.g. Premium Custom Hoodies & Sweatshirts | Purple Friday India"
            className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
              Meta Description (Search Snippet)
            </label>
            <span
              className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                isDescOptimal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {isDescOptimal ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {descLen}/160 chars (optimal 120–160)
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={250}
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="e.g. Order bespoke 380 GSM fleece hoodies with high-density embroidery. 100% digital proof approval and pan-India express air dispatch."
            className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
          />
        </div>
      </div>

      {/* Live Google SERP Preview Card */}
      <div className="space-y-2 pt-2">
        <span className="text-[11px] font-mono font-bold text-pf-ink/60 dark:text-white/60 uppercase tracking-wider">
          Live Google SERP Card Preview
        </span>
        <div className="rounded-2xl border border-pf-ink/15 dark:border-white/10 bg-[#FAF9F6] dark:bg-[#110E1B] p-4 sm:p-5 space-y-1.5 shadow-xs">
          {/* Top row: Site icon and breadcrumb */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-pf-violet text-white flex items-center justify-center text-[10px] font-bold">
              PF
            </div>
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="font-sans font-medium text-[#202124] dark:text-[#bdc1c6]">
                Purple Friday
              </span>
              <span className="font-sans text-[#4d5156] dark:text-[#9aa0a6] truncate max-w-xs sm:max-w-md">
                {displayUrl}
              </span>
            </div>
          </div>

          {/* Blue Title Link */}
          <div className="pt-0.5">
            <h4 className="font-sans text-base sm:text-lg font-normal text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug line-clamp-1">
              {title || "Purple Friday | Custom Merchandise Atelier"}
            </h4>
          </div>

          {/* Snippet Description */}
          <p className="font-sans text-xs sm:text-sm text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
            {truncatedDesc ||
              "Discover India's premier custom printing atelier. 100% digital proof sign-off, factory-direct volume pricing, and express air delivery across 28,000+ PIN codes."}
          </p>
        </div>
      </div>
    </div>
  );
}
