"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  IndianRupee,
  Download,
  Sparkles,
  Clock,
  ArrowRight,
  PackageCheck,
} from "lucide-react";
import {
  recommendCorporateKit,
  CorporateAudience,
} from "@/lib/corporate/kits";

export function BudgetPlanner() {
  const [teamSize, setTeamSize] = useState<number>(50);
  const [budgetPerPerson, setBudgetPerPerson] = useState<number>(1200);
  const [audience, setAudience] = useState<CorporateAudience>("new_joiners");
  const [downloading, setDownloading] = useState(false);

  const recommendation = recommendCorporateKit(teamSize, budgetPerPerson, audience);

  const audienceOptions: Array<{
    id: CorporateAudience;
    label: string;
    sub: string;
  }> = [
      {
        id: "new_joiners",
        label: "New Joiners / Onboarding",
        sub: "Day-one identity & welcome essentials",
      },
      {
        id: "client_vip",
        label: "Client VIP Gifting",
        sub: "Laser-etched prestige accessories",
      },
      {
        id: "festive",
        label: "Festive / Diwali Hampers",
        sub: "Curated celebration gift hampers",
      },
      {
        id: "conference",
        label: "Tech Conference Swag",
        sub: "High-density apparel & speaker gear",
      },
    ];

  const handleDownloadPdf = () => {
    setDownloading(true);
    const url = `/api/corporate/quotation-pdf?teamSize=${teamSize}&budget=${budgetPerPerson}&audience=${audience}`;
    window.location.href = url;
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Interactive Controls Panel */}
      <div className="bg-[#181324] text-white p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-8">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-pf-lime font-bold">
            Interactive Calculator
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
            Simulate Your Corporate Gifting Program
          </h2>
          <p className="text-xs font-mono text-white/50 mt-1.5">
            Configure quantity and budget parameters to compute volume pricing and download an official quotation.
          </p>
        </div>

        {/* Audience Taxonomy Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-mono uppercase text-white/60 tracking-wider">
            1. Select Campaign Purpose / Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {audienceOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAudience(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${audience === opt.id
                    ? "bg-pf-violet text-white border-pf-violet shadow-lg shadow-pf-violet/20"
                    : "bg-[#110D1A] text-white/80 border-white/10 hover:border-white/30"
                  }`}
              >
                <div className="font-display font-bold text-sm">{opt.label}</div>
                <div className={`text-[11px] font-mono mt-1 ${audience === opt.id ? "text-white/80" : "text-white/40"}`}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Team Size Slider */}
          <div className="space-y-4 bg-[#110D1A] p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/70">
                <Users className="w-4 h-4 text-pf-violet" />
                <span>Team / Recipient Size</span>
              </div>
              <span className="font-mono font-bold text-lg text-pf-lime">
                {teamSize} Recipients
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={2500}
              step={10}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full accent-pf-violet cursor-pointer"
            />

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[25, 50, 100, 250, 500, 1000].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTeamSize(num)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors ${teamSize === num
                      ? "bg-pf-violet text-white font-bold"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Per Person Slider */}
          <div className="space-y-4 bg-[#110D1A] p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/70">
                <IndianRupee className="w-4 h-4 text-pf-lime" />
                <span>Budget Per Person</span>
              </div>
              <span className="font-mono font-bold text-lg text-white">
                ₹{budgetPerPerson.toLocaleString("en-IN")}
              </span>
            </div>

            <input
              type="range"
              min={400}
              max={5000}
              step={100}
              value={budgetPerPerson}
              onChange={(e) => setBudgetPerPerson(Number(e.target.value))}
              className="w-full accent-pf-violet cursor-pointer"
            />

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[500, 800, 1200, 1800, 2500, 4000].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudgetPerPerson(b)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors ${budgetPerPerson === b
                      ? "bg-pf-violet text-white font-bold"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  ₹{b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Output Box */}
      <div className="bg-white text-pf-ink p-6 sm:p-10 rounded-3xl border-2 border-pf-ink shadow-[8px_8px_0_0_#15101F] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-pf-ink">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pf-violet" />
              <span className="text-xs font-mono uppercase font-bold text-pf-violet">
                Recommended 3-Product Suite
              </span>
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-pf-ink mt-1">
              {recommendation.kitTitle}
            </h3>
            <p className="text-xs font-mono text-pf-ink/60 mt-1">
              {recommendation.themeTagline}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-5 py-3 rounded-xl bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold shadow-[4px_4px_0_0_#15101F] border-2 border-pf-ink hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-transform flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Generating PDF..." : "Download Official PDF Quote"}</span>
            </button>
          </div>
        </div>

        {/* 3 Physical Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendation.items.map((item, idx) => {
            const bulkRate = teamSize >= 200 ? item.bulkPrice250 : item.bulkPrice50;
            return (
              <div
                key={item.id}
                className="bg-pf-paper rounded-2xl border-2 border-pf-ink p-5 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-pf-violet">
                      Item #{idx + 1} • {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-pf-lime text-pf-ink text-[9px] font-mono font-bold">
                      {Math.round(((item.mrp - bulkRate) / item.mrp) * 100)}% Off
                    </span>
                  </div>

                  <div className="w-full h-36 relative bg-white/70 rounded-xl border border-pf-ink/10 flex items-center justify-center p-3 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <h4 className="font-display font-bold text-sm text-pf-ink leading-snug">
                    {item.name}
                  </h4>
                </div>

                <div className="pt-3 border-t border-pf-ink/10 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-pf-ink/40 line-through block">
                      MRP ₹{item.mrp}
                    </span>
                    <span className="text-base font-bold text-pf-ink">
                      ₹{bulkRate}
                      <span className="text-[10px] text-pf-ink/50 font-normal"> / pc</span>
                    </span>
                  </div>

                  <Link
                    href={`/design/${item.slug}`}
                    className="text-[11px] font-bold text-pf-violet hover:underline flex items-center gap-1"
                  >
                    <span>Customize</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Presentation Packaging Note */}
        <div className="p-4 bg-pf-paper/60 rounded-xl border border-pf-ink/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-pf-ink">
                Artisan Custom Presentation Packaging:
              </span>{" "}
              Rigid magnetic-clasp box with foil-stamped corporate sleeve and individual employee name tags included.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-700 font-bold shrink-0">
            Free With 25+ Kits
          </span>
        </div>

        {/* Commercial Summary Banner */}
        <div className="bg-[#15101F] text-white p-6 rounded-2xl border-2 border-pf-ink grid grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-white/50">Effective Kit Rate</span>
            <div className="font-display font-bold text-2xl text-white">
              ₹{recommendation.bulkPricePerKit}
            </div>
            <div className="text-[10px] text-white/40 line-through">
              MRP ₹{recommendation.mrpPerKit}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase text-white/50">Total Project Investment</span>
            <div className="font-display font-bold text-2xl text-pf-lime">
              ₹{recommendation.totalTeamInvestment.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-white/40">Excludes 18% GST (Claimable)</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase text-white/50">Bulk Corporate Savings</span>
            <div className="font-display font-bold text-2xl text-emerald-400">
              ₹{recommendation.totalProjectSavings.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-emerald-400">
              {recommendation.percentSavings}% Savings vs Individual MRP
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase text-white/50">Turnaround Guarantee</span>
            <div className="font-display font-bold text-xl text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{recommendation.estimatedTurnaround}</span>
            </div>
            <div className="text-[10px] text-white/40">Pan-India Express Air Dispatch</div>
          </div>
        </div>
      </div>
    </div>
  );
}