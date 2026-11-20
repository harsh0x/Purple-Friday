import React from "react";
import { getAdminSession } from "@/lib/admin/admin-session";
import { getStaffMembers } from "@/lib/auth-service";
import { AdminGreeting } from "@/components/admin/AdminGreeting";
import { OverviewCharts } from "@/components/admin/OverviewCharts";
import { PageTransition } from "@/components/admin/PageTransition";
import { Users, FileCheck, Package, ShieldCheck } from "lucide-react";

export default async function AdminOverviewPage() {
  const session = await getAdminSession();
  const staff = await getStaffMembers();
  const activeStaffCount = staff.filter((s) => s.active !== false).length;

  // Real operational attention metrics (empty state in Part 1)
  const pendingApprovalsCount = 0;
  const ordersNeedingAttentionCount = 0;
  const totalAttentionNeeded = pendingApprovalsCount + ordersNeedingAttentionCount;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Dynamic India Greeting Bar */}
        <AdminGreeting
          userName={session?.name}
          userRole={session?.role}
          attentionCount={totalAttentionNeeded}
        />

        {/* Charts Section: Big Segmented Volume Chart + Donut Status Breakdown */}
        <OverviewCharts />

        {/* Rounded KPI Tiles Grid */}
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#15101F]/60 mb-3 font-semibold">
            Operational Highlights
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active People / Staff */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#15101F]/60">
                  Active Staff
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#6A2CFF]/10 text-[#6A2CFF] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-mono text-3xl font-black text-[#15101F]">
                  {activeStaffCount}
                </div>
                <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
                  Verified platform operators
                </div>
              </div>
            </div>

            {/* Waiting for Review */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#15101F]/60">
                  Waiting for Review
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#CDB8FF]/20 text-[#6A2CFF] flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-mono text-3xl font-black text-[#15101F]">
                  {pendingApprovalsCount}
                </div>
                <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
                  Print proof queue empty
                </div>
              </div>
            </div>

            {/* Orders Requiring Action */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#15101F]/60">
                  Orders in Pipeline
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#15101F]/5 text-[#15101F] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-mono text-3xl font-black text-[#15101F]">
                  {ordersNeedingAttentionCount}
                </div>
                <div className="text-xs text-[#15101F]/60 font-sans mt-0.5">
                  All dispatches up to date
                </div>
              </div>
            </div>

            {/* System & SLA Status */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#15101F]/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#15101F]/60">
                  System Uptime
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-mono text-3xl font-black text-emerald-600 flex items-center gap-1.5">
                  <span>99.9%</span>
                </div>
                <div className="text-xs text-[#15101F]/60 font-sans mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>All atelier services operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
