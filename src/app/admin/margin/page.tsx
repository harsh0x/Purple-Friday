"use client";

import React, { useState, useEffect } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import { formatCurrency } from "@/lib/utils";
import {
  Download,
  AlertTriangle,
  Plus,
} from "lucide-react";

interface WaterfallData {
  grossInvoicePaise: number;
  gstPaise: number;
  netRevenuePaise: number;
  cogsPaise: number;
  grossMarginPaise: number;
  gatewayFeesPaise: number;
  shippingCostsPaise: number;
  rtoLossesPaise: number;
  allocatedAdSpendPaise: number;
  trueNetMarginPaise: number;
  netMarginPercent: number;
}

interface MonthlyMarginRow {
  month: string;
  orderCount: number;
  netRevenuePaise: number;
  cogsPaise: number;
  gatewayFeesPaise: number;
  shippingCostsPaise: number;
  rtoLossesPaise: number;
  adSpendPaise: number;
  trueNetMarginPaise: number;
  netMarginPercent: number;
}

interface OrderMarginRow {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  customerName: string;
  itemCount: number;
  grossPaise: number;
  gstPaise: number;
  netRevenuePaise: number;
  cogsPaise: number;
  gatewayFeePaise: number;
  shippingCostPaise: number;
  rtoLossPaise: number;
  netMarginPaise: number;
  marginPercent: number;
  isLowMargin: boolean;
  isNegativeMargin: boolean;
}

interface ProductMarginRow {
  productId: string;
  title: string;
  unitsSold: number;
  revenuePaise: number;
  cogsPaise: number;
  marginPaise: number;
  marginPercent: number;
  isLowMargin: boolean;
}

export default function AdminMarginPage() {
  const [data, setData] = useState<{
    waterfall: WaterfallData;
    monthlyMargins: MonthlyMarginRow[];
    orderMargins: OrderMarginRow[];
    productMargins: ProductMarginRow[];
    alerts: { lowMarginCount: number; negativeMarginCount: number };
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"waterfall" | "orders" | "products" | "monthly">("waterfall");
  const [loading, setLoading] = useState(true);
  const [adSpendMonth, setAdSpendMonth] = useState("2026-11");
  const [adSpendAmount, setAdSpendAmount] = useState("50000"); // Rs 50,000
  const [showAdSpendModal, setShowAdSpendModal] = useState(false);
  const [adSpendSubmitting, setAdSpendSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/margin");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdSpendSubmitting(true);
    try {
      const paise = Math.round(parseFloat(adSpendAmount) * 100);
      const res = await fetch("/api/admin/margin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: adSpendMonth,
          amountPaise: paise,
          channel: "Meta & Google B2B Ads",
          notes: "Corporate gifting seasonal spend",
        }),
      });
      if (res.ok) {
        setShowAdSpendModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdSpendSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs font-mono text-[#15101F]/60">
        Loading real-time atelier margin telemetry...
      </div>
    );
  }

  const wf = data.waterfall;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                True Net Margin Tracker
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                P&L Unit Economics
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              India custom print profitability: Net Revenue − COGS − Gateway (2%) − Shipping − RTO Scrapped Losses − Ad Spend
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAdSpendModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] font-mono text-xs font-semibold shadow-sm hover:bg-[#FAF7F2] transition-colors"
            >
              <Plus className="w-4 h-4 text-[#6A2CFF]" />
              <span>Record Ad Spend</span>
            </button>

            <a
              href="/api/admin/margin?export=csv"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold shadow-sm hover:bg-[#221A31] transition-colors"
            >
              <Download className="w-4 h-4 text-[#D8FF3F]" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Alerts Banner (Negative or <15% margin) */}
        {(data.alerts.negativeMarginCount > 0 || data.alerts.lowMarginCount > 0) && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Margin Alert: {data.alerts.negativeMarginCount} negative margin orders & {data.alerts.lowMarginCount} below 15% threshold
                </h4>
                <p className="text-xs text-amber-800/80 font-sans mt-0.5">
                  Orders affected by heavy RTO loss or sub-optimal custom tier pricing require production team review.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("orders")}
              className="text-xs font-mono font-bold text-amber-900 underline shrink-0 hover:text-amber-950"
            >
              Review Orders &rarr;
            </button>
          </div>
        )}

        {/* Executive KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              Net Realized Revenue
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-[#15101F]">
              {formatCurrency(wf.netRevenuePaise)}
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Gross {formatCurrency(wf.grossInvoicePaise)} − GST {formatCurrency(wf.gstPaise)}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              Total Production COGS
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-[#15101F]">
              {formatCurrency(wf.cogsPaise)}
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Blank apparel + direct print consumable costs
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              RTO Scrapped Loss
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-rose-600">
              {formatCurrency(wf.rtoLossesPaise)}
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Unrecoverable custom print blank & round-trip freight
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#15101F]/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase text-[#15101F]/60 font-semibold">
              True Net Margin (EBITDA)
            </span>
            <div className="mt-2 font-mono text-2xl font-black text-emerald-600 flex items-baseline gap-2">
              <span>{formatCurrency(wf.trueNetMarginPaise)}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {wf.netMarginPercent}%
              </span>
            </div>
            <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
              Bottom-line profit after all operational deductions
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#15101F]/10 pb-2">
          {(
            [
              { id: "waterfall", label: "Waterfall Breakdown" },
              { id: "orders", label: `Order Margins (${data.orderMargins.length})` },
              { id: "products", label: `Product Margins (${data.productMargins.length})` },
              { id: "monthly", label: `Monthly Trends (${data.monthlyMargins.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all ${activeTab === tab.id
                ? "bg-[#15101F] text-white shadow-sm"
                : "bg-white text-[#15101F]/70 hover:bg-[#FAF7F2] border border-[#15101F]/10"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Waterfall Step Cascade */}
        {activeTab === "waterfall" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-[#15101F]">
                Net Margin Step-by-Step Waterfall
              </h3>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Every rupee tracked from customer payment to company bank balance
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Step 1: Gross Invoice */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#15101F]">1. Gross Customer Invoices</div>
                  <div className="text-[11px] text-[#15101F]/60">Total billed including GST</div>
                </div>
                <div className="font-mono text-base font-black text-[#15101F]">
                  +{formatCurrency(wf.grossInvoicePaise)}
                </div>
              </div>

              {/* Step 2: GST Output Tax */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-rose-900">2. Less: GST Output Liability</div>
                  <div className="text-[11px] text-rose-800/70">Remitted directly to Govt of India</div>
                </div>
                <div className="font-mono text-base font-black text-rose-700">
                  −{formatCurrency(wf.gstPaise)}
                </div>
              </div>

              {/* Step 3: Net Revenue */}
              <div className="p-4 rounded-2xl bg-[#CDB8FF]/15 border border-[#6A2CFF]/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#6A2CFF]">3. Equals: Net Realized Revenue</div>
                  <div className="text-[11px] text-[#15101F]/60">Platform top-line base</div>
                </div>
                <div className="font-mono text-base font-black text-[#6A2CFF]">
                  ={formatCurrency(wf.netRevenuePaise)}
                </div>
              </div>

              {/* Step 4: COGS */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-rose-900">4. Less: COGS (Blanks + Direct Print Cost)</div>
                  <div className="text-[11px] text-rose-800/70">Raw materials and consumables consumed</div>
                </div>
                <div className="font-mono text-base font-black text-rose-700">
                  −{formatCurrency(wf.cogsPaise)}
                </div>
              </div>

              {/* Step 5: Payment Gateway Fees */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-rose-900">5. Less: Razorpay Gateway Fees (2% + Fixed)</div>
                  <div className="text-[11px] text-rose-800/70">Payment processing fee</div>
                </div>
                <div className="font-mono text-base font-black text-rose-700">
                  −{formatCurrency(wf.gatewayFeesPaise)}
                </div>
              </div>

              {/* Step 6: Shipping Logistics */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-rose-900">6. Less: Outbound Courier & Freight</div>
                  <div className="text-[11px] text-rose-800/70">Courier charges (BlueDart, Delhivery, etc.)</div>
                </div>
                <div className="font-mono text-base font-black text-rose-700">
                  −{formatCurrency(wf.shippingCostsPaise)}
                </div>
              </div>

              {/* Step 7: RTO Losses */}
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-rose-900">7. Less: RTO Merchandise Scrapped Losses</div>
                  <div className="text-[11px] text-rose-800/70">
                    Custom goods cannot be resold; total loss = blank + print + roundtrip freight
                  </div>
                </div>
                <div className="font-mono text-base font-black text-rose-700">
                  −{formatCurrency(wf.rtoLossesPaise)}
                </div>
              </div>

              {/* Step 8: Ad Spend */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-rose-900">8. Less: Allocated Marketing Ad Spend</div>
                  <div className="text-[11px] text-rose-800/70">Corporate client acquisition and performance ads</div>
                </div>
                <div className="font-mono text-base font-black text-rose-700">
                  −{formatCurrency(wf.allocatedAdSpendPaise)}
                </div>
              </div>

              {/* Step 9: True Net Margin */}
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-base text-emerald-950">9. Equals: True Net Profit (EBITDA)</div>
                  <div className="text-xs text-emerald-800/80">Realized bank margin after all direct liabilities</div>
                </div>
                <div className="font-mono text-xl font-black text-emerald-700">
                  {formatCurrency(wf.trueNetMarginPaise)} ({wf.netMarginPercent}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Order Margins Table */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#15101F]/10 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[#15101F]">
                  Order-by-Order Unit Economics
                </h3>
                <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                  Ordered by margin percentage (lowest margins flagged first)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Net Revenue</th>
                    <th className="p-4 text-right">COGS</th>
                    <th className="p-4 text-right">Gateway+Ship</th>
                    <th className="p-4 text-right">RTO Loss</th>
                    <th className="p-4 text-right">Net Margin</th>
                    <th className="p-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15101F]/10">
                  {data.orderMargins.slice(0, 50).map((o) => (
                    <tr
                      key={o.orderId}
                      className={`hover:bg-[#FAF7F2]/50 ${o.isNegativeMargin
                        ? "bg-rose-50/40"
                        : o.isLowMargin
                          ? "bg-amber-50/30"
                          : ""
                        }`}
                    >
                      <td className="p-4 font-bold text-[#15101F]">{o.orderNumber}</td>
                      <td className="p-4 text-[#15101F]/80">{o.customerName}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#15101F]/5 text-[#15101F]">
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">{formatCurrency(o.netRevenuePaise)}</td>
                      <td className="p-4 text-right">{formatCurrency(o.cogsPaise)}</td>
                      <td className="p-4 text-right">
                        {formatCurrency(o.gatewayFeePaise + o.shippingCostPaise)}
                      </td>
                      <td className="p-4 text-right text-rose-600">
                        {o.rtoLossPaise > 0 ? formatCurrency(o.rtoLossPaise) : "—"}
                      </td>
                      <td
                        className={`p-4 text-right font-bold ${o.netMarginPaise < 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                      >
                        {formatCurrency(o.netMarginPaise)}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${o.isNegativeMargin
                            ? "bg-rose-100 text-rose-700"
                            : o.isLowMargin
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                          {o.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Product Margins */}
        {activeTab === "products" && (
          <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#15101F]/10">
              <h3 className="font-display font-bold text-base text-[#15101F]">
                Product Catalog Margins & Volume Contribution
              </h3>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Evaluates which merchandise lines drive the highest margin contribution
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-right">Units Sold</th>
                    <th className="p-4 text-right">Realized Revenue</th>
                    <th className="p-4 text-right">Total COGS</th>
                    <th className="p-4 text-right">Gross Profit</th>
                    <th className="p-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15101F]/10">
                  {data.productMargins.map((p) => (
                    <tr key={p.productId} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-4 font-bold text-[#15101F]">{p.title}</td>
                      <td className="p-4 text-right">{p.unitsSold}</td>
                      <td className="p-4 text-right">{formatCurrency(p.revenuePaise)}</td>
                      <td className="p-4 text-right">{formatCurrency(p.cogsPaise)}</td>
                      <td className="p-4 text-right font-bold text-emerald-700">
                        {formatCurrency(p.marginPaise)}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${p.isLowMargin
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                          {p.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Monthly Trends */}
        {activeTab === "monthly" && (
          <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#15101F]/10">
              <h3 className="font-display font-bold text-base text-[#15101F]">
                12-Month Financial Unit Trajectory
              </h3>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Track margin expansion and seasonality impacts
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                  <tr>
                    <th className="p-4">Month</th>
                    <th className="p-4 text-right">Orders</th>
                    <th className="p-4 text-right">Net Revenue</th>
                    <th className="p-4 text-right">COGS</th>
                    <th className="p-4 text-right">Freight+Fees</th>
                    <th className="p-4 text-right">RTO Loss</th>
                    <th className="p-4 text-right">Ad Spend</th>
                    <th className="p-4 text-right">Net Profit</th>
                    <th className="p-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15101F]/10">
                  {data.monthlyMargins.map((m) => (
                    <tr key={m.month} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-4 font-bold text-[#15101F]">{m.month}</td>
                      <td className="p-4 text-right">{m.orderCount}</td>
                      <td className="p-4 text-right">{formatCurrency(m.netRevenuePaise)}</td>
                      <td className="p-4 text-right">{formatCurrency(m.cogsPaise)}</td>
                      <td className="p-4 text-right">
                        {formatCurrency(m.gatewayFeesPaise + m.shippingCostsPaise)}
                      </td>
                      <td className="p-4 text-right text-rose-600">
                        {m.rtoLossesPaise > 0 ? formatCurrency(m.rtoLossesPaise) : "—"}
                      </td>
                      <td className="p-4 text-right">{formatCurrency(m.adSpendPaise)}</td>
                      <td className="p-4 text-right font-bold text-emerald-700">
                        {formatCurrency(m.trueNetMarginPaise)}
                      </td>
                      <td className="p-4 text-right font-bold">{m.netMarginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Record Monthly Ad Spend */}
        {showAdSpendModal && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#15101F]/15 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-[#15101F]">
                Record Monthly Marketing Ad Spend
              </h3>
              <p className="text-xs font-mono text-[#15101F]/60 mt-1">
                Enter overall monthly performance marketing spend to attribute against order revenue.
              </p>

              <form onSubmit={handleSaveAdSpend} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                    Month (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={adSpendMonth}
                    onChange={(e) => setAdSpendMonth(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#15101F]/80 mb-1">
                    Total Spend in Rupees (₹)
                  </label>
                  <input
                    type="number"
                    value={adSpendAmount}
                    onChange={(e) => setAdSpendAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    placeholder="50000"
                    className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAdSpendModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-[#15101F]/60 hover:text-[#15101F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adSpendSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors"
                  >
                    {adSpendSubmitting ? "Saving..." : "Save Ad Spend"}
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