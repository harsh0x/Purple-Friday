"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Sparkles,
  Mail,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  X,
  ShieldAlert,
} from "lucide-react";
import { CustomerRfmProfile } from "@/server/analytics/rfm";

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<CustomerRfmProfile[]>([]);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CustomerRfmProfile | null>(null);
  const [copiedType, setCopiedType] = useState<"email" | "whatsapp" | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/customers", window.location.origin);
      if (selectedSegment !== "ALL") url.searchParams.set("segment", selectedSegment);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setProfiles(json.profiles || []);
        setSegmentCounts(json.segmentCounts || {});
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [selectedSegment, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCopy = (text: string, type: "email" | "whatsapp") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                Corporate Clients & RFM Segments
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                Recency • Frequency • Monetary
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              RFM quintile behavioral clustering, automated reorder gap tracking & personalized nudge drafts
            </p>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: "ALL", label: `All (${profiles.length})` },
              { id: "VIP Corporate Buyers", label: `VIP Corporate (${segmentCounts.vip || 0})` },
              { id: "At-Risk Repeat Clients", label: `At-Risk (${segmentCounts.atRisk || 0})` },
              { id: "One-Time Sample Buyers", label: `Sample Buyers (${segmentCounts.sample || 0})` },
              { id: "New Customers", label: `New (${segmentCounts.newCust || 0})` },
              { id: "Lapsed", label: `Lapsed (${segmentCounts.lapsed || 0})` },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setSelectedSegment(pill.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedSegment === pill.id
                    ? "bg-[#15101F] text-white shadow-sm"
                    : "bg-white text-[#15101F]/70 hover:bg-[#FAF7F2] border border-[#15101F]/10"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative shrink-0 md:w-72">
            <Search className="w-4 h-4 text-[#15101F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client, email or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#15101F]/15 bg-white text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                <tr>
                  <th className="p-4">Client / Company</th>
                  <th className="p-4">RFM Segment</th>
                  <th className="p-4">RFM Score</th>
                  <th className="p-4 text-right">Total Orders</th>
                  <th className="p-4 text-right">Lifetime Spend</th>
                  <th className="p-4 text-center">Reorder Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15101F]/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#15101F]/50">
                      Loading customer profiles...
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#15101F]/50">
                      No corporate profiles match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => {
                    const isVip = p.segment === "VIP Corporate Buyers";
                    const isAtRisk = p.segment === "At-Risk Repeat Clients";

                    return (
                      <tr key={p.customerId} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="p-4">
                          <div className="font-sans font-bold text-sm text-[#15101F]">
                            {p.customerName}
                          </div>
                          <div className="text-[11px] text-[#15101F]/60">
                            {p.companyName} • {p.city}, {p.state}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isVip
                                ? "bg-[#6A2CFF]/15 text-[#6A2CFF]"
                                : isAtRisk
                                ? "bg-rose-100 text-rose-700"
                                : p.segment === "One-Time Sample Buyers"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-[#15101F]/10 text-[#15101F]"
                            }`}
                          >
                            {p.segment}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#15101F]/10">
                            {p.rfmScore}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-[#15101F]">
                          {p.totalOrders}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-700">
                          {formatCurrency(p.totalSpendPaise)}
                        </td>
                        <td className="p-4 text-center">
                          {p.isOverdueForReorder ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              <AlertCircle className="w-3 h-3" />
                              <span>Reorder Due (+{p.daysOverdueForReorder}d)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#15101F]/50">
                              Every ~{p.averageOrderGapDays}d
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedProfile(p)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#15101F]/15 text-[#15101F] font-bold hover:bg-[#FAF7F2] transition-colors"
                          >
                            Profile & Nudge
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Profile & Draft Reorder Nudge Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#15101F]/15 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-[#15101F]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-xl text-[#15101F]">
                      {selectedProfile.customerName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6A2CFF]/15 text-[#6A2CFF]">
                      {selectedProfile.segment}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                    {selectedProfile.companyName} • {selectedProfile.customerEmail} • {selectedProfile.city}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="p-1 rounded-xl text-[#15101F]/40 hover:text-[#15101F] hover:bg-[#FAF7F2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Account Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
                  <span className="text-[10px] font-mono uppercase text-[#15101F]/60">Total Spend</span>
                  <div className="font-mono text-base font-black text-emerald-700 mt-1">
                    {formatCurrency(selectedProfile.totalSpendPaise)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
                  <span className="text-[10px] font-mono uppercase text-[#15101F]/60">AOV</span>
                  <div className="font-mono text-base font-black text-[#15101F] mt-1">
                    {formatCurrency(
                      Math.round(selectedProfile.totalSpendPaise / (selectedProfile.totalOrders || 1))
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
                  <span className="text-[10px] font-mono uppercase text-[#15101F]/60">Reorder Interval</span>
                  <div className="font-mono text-base font-black text-[#15101F] mt-1">
                    ~{selectedProfile.averageOrderGapDays} days
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10">
                  <span className="text-[10px] font-mono uppercase text-[#15101F]/60">Credit Term</span>
                  <div className="font-mono text-base font-black text-[#6A2CFF] mt-1">
                    NET 30
                  </div>
                </div>
              </div>

              {/* 1-Click Reorder Nudge Draft Section */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6A2CFF]" />
                    <h3 className="font-sans font-bold text-sm text-[#15101F]">
                      Personalized Reorder Nudge Draft
                    </h3>
                  </div>
                  {selectedProfile.isOverdueForReorder && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-700">
                      Reorder Due
                    </span>
                  )}
                </div>

                {/* Safety Guarantee Notice */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Strict Policy Guard:</span> Messages are never automatically sent without your explicit review. Copy below and send through your authenticated business WhatsApp or corporate outreach inbox.
                  </div>
                </div>

                {/* WhatsApp Copy Card */}
                <div className="p-3 rounded-xl bg-white border border-[#15101F]/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Business Message</span>
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(selectedProfile.draftNudgeMessage.whatsappText, "whatsapp")
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      {copiedType === "whatsapp" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy WhatsApp Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[#15101F]/80 bg-[#FAF7F2] p-2.5 rounded-lg whitespace-pre-wrap">
                    {selectedProfile.draftNudgeMessage.whatsappText}
                  </p>
                </div>

                {/* Email Draft Card */}
                <div className="p-3 rounded-xl bg-white border border-[#15101F]/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#6A2CFF]">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#6A2CFF]" />
                      <span>Corporate Email Subject: {selectedProfile.draftNudgeMessage.emailSubject}</span>
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(selectedProfile.draftNudgeMessage.emailBody, "email")
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-[#6A2CFF] hover:bg-purple-100 transition-colors"
                    >
                      {copiedType === "email" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email Body</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[#15101F]/80 bg-[#FAF7F2] p-2.5 rounded-lg whitespace-pre-wrap">
                    {selectedProfile.draftNudgeMessage.emailBody}
                  </p>
                </div>
              </div>

              {/* Order History Timeline */}
              <div>
                <h4 className="font-sans font-bold text-sm text-[#15101F] mb-2">
                  Past Order History ({selectedProfile.orders.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedProfile.orders.map((o) => (
                    <div
                      key={o.id}
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-[#15101F]">{o.orderNumber}</span>
                        <span className="text-[#15101F]/50 ml-2">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#15101F] border border-[#15101F]/10">
                          {o.status}
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(Math.round((o.total || 0) * 100))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}