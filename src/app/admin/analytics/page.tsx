"use client";

import React, { useState, useEffect } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import { formatCurrency } from "@/lib/utils";
import {
  Repeat,
  MapPin,
  Building2,
  Calendar,
  Sliders,
} from "lucide-react";
import type {
  CohortMonthData,
  AnalyticsMetricsResult,
  SampleToBulkResult,
  TopCustomerMetric,
} from "@/server/analytics/cohorts";

interface AnalyticsResponseData {
  sampleToBulk: SampleToBulkResult;
  cohorts: CohortMonthData[];
  metrics: AnalyticsMetricsResult;
  settings?: {
    sampleMaxQty?: number;
    bulkMinQty?: number;
    conversionWindowDays?: number;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sampleMaxQty, setSampleMaxQty] = useState(2);
  const [bulkMinQty, setBulkMinQty] = useState(20);
  const [windowDays, setWindowDays] = useState(60);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.settings) {
          setSampleMaxQty(json.settings.sampleMaxQty || 2);
          setBulkMinQty(json.settings.bulkMinQty || 20);
          setWindowDays(json.settings.conversionWindowDays || 60);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sampleMaxQty,
          bulkMinQty,
          conversionWindowDays: windowDays,
        }),
      });
      if (res.ok) {
        setShowConfigModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs font-mono text-[#15101F]/60">
        Loading corporate intelligence & retention matrix...
      </div>
    );
  }

  const stb = data.sampleToBulk;
  const cohorts = data.cohorts;
  const metrics = data.metrics;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                Corporate Intelligence & Cohorts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                B2B Telemetry
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Sample-to-bulk conversion funnels, 12-month cohort retention heatmaps & India city distribution
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] font-mono text-xs font-semibold shadow-sm hover:bg-[#FAF7F2] transition-colors"
            >
              <Sliders className="w-4 h-4 text-[#6A2CFF]" />
              <span>Configure Conversion Rules</span>
            </button>
          </div>
        </div>

        {/* 1. Sample-to-Bulk Conversion Tracker */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#15101F]/10">
            <div>
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-[#6A2CFF]" />
                <h2 className="font-display font-bold text-lg text-[#15101F]">
                  Sample-to-Bulk Corporate Pipeline
                </h2>
              </div>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Rule: Customer orders ≤ {sampleMaxQty} sample pcs &rarr; follow-on order ≥ {bulkMinQty} bulk pcs within {windowDays} days
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {stb.conversionRatePercent}% Conversion Rate
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
              <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
                Sample Orders Placed
              </span>
              <div className="mt-2 font-mono text-2xl font-black text-[#15101F]">
                {stb.totalSampleOrders}
              </div>
              <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
                Initial evaluation orders (≤ {sampleMaxQty} pcs)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
              <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
                Converted to Bulk (≥ {bulkMinQty} pcs)
              </span>
              <div className="mt-2 font-mono text-2xl font-black text-[#6A2CFF]">
                {stb.convertedToBulkCount}
              </div>
              <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
                High-volume B2B contract conversions
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
              <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
                Average Days to Convert
              </span>
              <div className="mt-2 font-mono text-2xl font-black text-[#15101F]">
                {stb.avgDaysToConvert} <span className="text-sm font-normal">days</span>
              </div>
              <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
                From sample receipt to corporate PO
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-mono uppercase text-emerald-900 font-semibold">
                Converted Bulk Revenue
              </span>
              <div className="mt-2 font-mono text-2xl font-black text-emerald-700">
                {formatCurrency(stb.totalConvertedRevenuePaise)}
              </div>
              <div className="text-xs text-emerald-800/80 font-sans mt-0.5">
                Realized value from converted sample leads
              </div>
            </div>
          </div>
        </div>

        {/* 2. 12-Month Cohort Retention Matrix (Heatmap) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#15101F]/10 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#6A2CFF]" />
              <h2 className="font-display font-bold text-lg text-[#15101F]">
                12-Month Client Retention Cohort Matrix
              </h2>
            </div>
            <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
              Tracks repeat order retention percentages across consecutive calendar months from first order
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                  <th className="p-3 text-left">Cohort Month</th>
                  <th className="p-3">New Clients</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="p-3">
                      M{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15101F]/10">
                {cohorts.map((c) => (
                  <tr key={c.cohortMonth} className="hover:bg-[#FAF7F2]/50">
                    <td className="p-3 font-bold text-left text-[#15101F] whitespace-nowrap">
                      {c.cohortMonth}
                    </td>
                    <td className="p-3 font-semibold text-[#15101F] bg-[#FAF7F2]">
                      {c.initialCustomers}
                    </td>
                    {c.months.map((m, idx: number) => {
                      if (!m.active) {
                        return (
                          <td key={idx} className="p-3 text-[#15101F]/20">
                            —
                          </td>
                        );
                      }
                      const pct = m.retentionPct;
                      // Heatmap color intensity
                      let bgClass = "bg-purple-50 text-[#15101F]";
                      if (pct >= 50) bgClass = "bg-[#6A2CFF] text-white font-bold";
                      else if (pct >= 30) bgClass = "bg-[#8E51FF]/40 text-[#15101F] font-bold";
                      else if (pct >= 15) bgClass = "bg-[#CDB8FF]/30 text-[#15101F]";

                      return (
                        <td key={idx} className={`p-2 transition-colors ${bgClass}`}>
                          <div>{pct}%</div>
                          <div className="text-[9px] opacity-70">({m.repeatCount})</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. City Distribution & Top Corporate Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* City & PIN Code Distribution */}
          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#15101F]/10">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6A2CFF]" />
                <h3 className="font-display font-bold text-base text-[#15101F]">
                  Sales by City Tier & Top PIN Codes
                </h3>
              </div>
              <span className="text-xs font-mono text-[#15101F]/50">Pan-India Reach</span>
            </div>

            {/* Tier 1 vs Tier 2/3 Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-[#6A2CFF]">Tier 1 Metro (BLR, BOM, DEL, HYD, MAA, PNQ)</span>
                <span>{metrics.cityTiers.tier1Percentage}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#15101F]/10 overflow-hidden flex">
                <div
                  className="bg-[#6A2CFF] h-full transition-all"
                  style={{ width: `${metrics.cityTiers.tier1Percentage}%` }}
                />
                <div
                  className="bg-[#D8FF3F] h-full transition-all"
                  style={{ width: `${metrics.cityTiers.tier23Percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#15101F]/60">
                <span>Revenue: {formatCurrency(metrics.cityTiers.tier1RevenuePaise)}</span>
                <span>Tier 2/3: {formatCurrency(metrics.cityTiers.tier23RevenuePaise)}</span>
              </div>
            </div>

            {/* Top PIN Codes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[#15101F]/60 border-b border-[#15101F]/10">
                  <tr>
                    <th className="pb-2">PIN Code</th>
                    <th className="pb-2">Hub City</th>
                    <th className="pb-2 text-right">Orders</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">RTO Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15101F]/10">
                  {metrics.topPinCodes.slice(0, 5).map((p) => (
                    <tr key={p.pinCode}>
                      <td className="py-2.5 font-bold text-[#15101F]">{p.pinCode}</td>
                      <td className="py-2.5 text-[#15101F]/70">{p.city}</td>
                      <td className="py-2.5 text-right">{p.orders}</td>
                      <td className="py-2.5 text-right">{formatCurrency(p.revenuePaise)}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.rtoRatePct > 15
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {p.rtoRatePct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Corporate Clients */}
          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#15101F]/10">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#6A2CFF]" />
                <h3 className="font-display font-bold text-base text-[#15101F]">
                  Top Corporate Accounts
                </h3>
              </div>
              <span className="text-xs font-mono text-[#15101F]/50">Enterprise Volume</span>
            </div>

            <div className="space-y-3">
              {metrics.topCorporateClients.slice(0, 5).map((client: TopCustomerMetric, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-center justify-between"
                >
                  <div>
                    <div className="font-sans font-bold text-sm text-[#15101F]">
                      {client.companyName}
                    </div>
                    <div className="text-[11px] font-mono text-[#15101F]/60 mt-0.5">
                      {client.ordersCount} orders • {client.city} • Last order: {client.lastOrderDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-sm text-emerald-700">
                      {formatCurrency(client.totalSpendPaise)}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6A2CFF]/10 text-[#6A2CFF] font-bold">
                      VIP Client
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal: Configure Sample-to-Bulk Thresholds */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#15101F]/15 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-[#15101F]">
                Configure Sample-to-Bulk Logic
              </h3>
              <p className="text-xs font-mono text-[#15101F]/60 mt-1">
                Customize threshold parameters stored dynamically in AppSettings.
              </p>

              <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                    Max Sample Pieces (default: 2)
                  </label>
                  <input
                    type="number"
                    value={sampleMaxQty}
                    onChange={(e) => setSampleMaxQty(parseInt(e.target.value, 10))}
                    min="1"
                    max="10"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                    Min Bulk Pieces (default: 20)
                  </label>
                  <input
                    type="number"
                    value={bulkMinQty}
                    onChange={(e) => setBulkMinQty(parseInt(e.target.value, 10))}
                    min="5"
                    max="100"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                    Conversion Window Days (default: 60)
                  </label>
                  <input
                    type="number"
                    value={windowDays}
                    onChange={(e) => setWindowDays(parseInt(e.target.value, 10))}
                    min="15"
                    max="180"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-[#15101F]/60 hover:text-[#15101F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors"
                  >
                    {savingSettings ? "Saving..." : "Save Parameters"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}