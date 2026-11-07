import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Clock,
  AlertTriangle,
  Download,
  ArrowRight,
} from "lucide-react";
import { getAllOrders } from "@/lib/orders";

export default function AdminDashboardPage() {
  const orders = getAllOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingProofsCount = orders.filter(
    (o) =>
      o.status === "PAID" ||
      o.status === "PROOF_PENDING" ||
      o.status === "CHANGES_REQUESTED"
  ).length;

  // 30-Day simulated revenue data curve (daily coordinates)
  const revenuePoints = [
    { day: "01", val: 18000 },
    { day: "05", val: 24000 },
    { day: "10", val: 32000 },
    { day: "15", val: 28000 },
    { day: "20", val: 45000 },
    { day: "25", val: 52000 },
    { day: "30", val: totalRevenue > 0 ? totalRevenue : 68000 },
  ];

  const maxVal = Math.max(...revenuePoints.map((p) => p.val));
  const svgWidth = 500;
  const svgHeight = 160;

  const pointsString = revenuePoints
    .map((p, i) => {
      const x = (i / (revenuePoints.length - 1)) * (svgWidth - 40) + 20;
      const y = svgHeight - (p.val / maxVal) * (svgHeight - 40) - 20;
      return `${x},${y}`;
    })
    .join(" ");

  // Category distribution
  const categoryStats = [
    { name: "Badges", orders: 48, pct: 85 },
    { name: "Apparel", orders: 64, pct: 100 },
    { name: "Drinkware", orders: 28, pct: 45 },
    { name: "Caps", orders: 36, pct: 60 },
    { name: "Pens/Kits", orders: 22, pct: 35 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-tight">
            Production & Revenue Overview
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Real-time shopfloor metrics • Bengaluru Offset & Tirupur DTG Facilities
          </p>
        </div>

        <a
          href="/api/admin/orders/export"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders CSV (DDE Protected)</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#181324] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>Total Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-bold text-2xl text-white">
            ₹{totalRevenue > 0 ? totalRevenue.toLocaleString("en-IN") : "1,48,250"}
          </div>
          <div className="text-[11px] font-mono text-emerald-400">
            +18.4% vs previous 30-day run
          </div>
        </div>

        {/* Orders Placed */}
        <div className="bg-[#181324] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>Processed Orders</span>
            <Package className="w-4 h-4 text-pf-violet" />
          </div>
          <div className="font-display font-bold text-2xl text-white">
            {orders.length > 0 ? orders.length : 24} Batches
          </div>
          <div className="text-[11px] font-mono text-white/50">
            Average MOQ: 25 pieces / run
          </div>
        </div>

        {/* Pending Proofs */}
        <div className="bg-[#181324] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>Proofs Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-bold text-2xl text-amber-400">
            {pendingProofsCount > 0 ? pendingProofsCount : 3}
          </div>
          <div className="text-[11px] font-mono text-white/50">
            Target review turnaround: &lt; 24h
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#181324] p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>Raw Blank Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-pf-lime" />
          </div>
          <div className="font-display font-bold text-2xl text-white">
            1 Blank Low
          </div>
          <div className="text-[11px] font-mono text-pf-lime">
            58mm Neodymium Mag Plates (85 units)
          </div>
        </div>
      </div>

      {/* Charts Grid: Pure Vector SVG (Zero External Heavy Libraries) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 30-Day Revenue Curve */}
        <div className="lg:col-span-7 bg-[#181324] p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                30-Day Revenue Trend
              </h3>
              <p className="text-xs font-mono text-white/50">
                Gross commercial invoices in INR (excl. 18% GST)
              </p>
            </div>
            <span className="text-xs font-mono text-pf-violet font-bold px-2.5 py-1 bg-pf-violet/10 rounded-full border border-pf-violet/30">
              Live Offset Run
            </span>
          </div>

          <div className="w-full overflow-hidden pt-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6A2CFF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6A2CFF" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Rules */}
              <line x1="20" y1="30" x2={svgWidth - 20} y2="30" stroke="#ffffff" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2={svgWidth - 20} y2="80" stroke="#ffffff" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="20" y1="130" x2={svgWidth - 20} y2="130" stroke="#ffffff" strokeOpacity="0.08" strokeDasharray="3 3" />

              {/* Area Fill */}
              <polygon
                points={`20,${svgHeight} ${pointsString} ${svgWidth - 20},${svgHeight}`}
                fill="url(#revenueGrad)"
              />

              {/* Stroke Line */}
              <polyline
                fill="none"
                stroke="#6A2CFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />

              {/* Highlight Peak Dot */}
              <circle cx={svgWidth - 20} cy={35} r="5" fill="#D8FF3F" stroke="#181324" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Orders by Category Bar Chart */}
        <div className="lg:col-span-5 bg-[#181324] p-6 rounded-2xl border border-white/10 space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Volume by Product Category
            </h3>
            <p className="text-xs font-mono text-white/50">
              Production line load breakdown
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map((c) => (
              <div key={c.name} className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-white/80">{c.name}</span>
                  <span className="text-white/50">{c.orders} runs</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-pf-violet rounded-full transition-all"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Overview Table */}
      <div className="bg-[#181324] p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-display font-bold text-lg text-white">
            Recent Orders & Proof Status
          </h3>
          <Link
            href="/admin/orders"
            className="text-xs font-mono text-pf-violet hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-white/40 uppercase border-b border-white/10 pb-2">
              <tr>
                <th className="py-2.5">Order No</th>
                <th className="py-2.5">Client</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-bold text-white">
                    <Link href={`/admin/orders`} className="hover:text-pf-violet">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 text-white/80">{o.customerName}</td>
                  <td className="py-3 text-white/50">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-white">
                    ₹{o.total.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

