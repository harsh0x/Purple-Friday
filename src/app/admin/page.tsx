import React from "react";
import { getAdminSession } from "@/lib/admin/admin-session";
import { AdminGreeting } from "@/components/admin/AdminGreeting";
import { PageTransition } from "@/components/admin/PageTransition";
import { getOverviewDashboardData } from "@/server/analytics/overview-service";
import { OverviewCommandCentre } from "@/components/admin/OverviewCommandCentre";

export default async function AdminOverviewPage() {
  const session = await getAdminSession();
  const overviewData = await getOverviewDashboardData(session?.role || "SUPER_ADMIN");

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Dynamic India Greeting Bar */}
        <AdminGreeting
          userName={session?.name}
          userRole={session?.role}
          attentionCount={overviewData.totalAttentionNeeded}
        />

        {/* Full Command Centre with Funnel, Segmented Dual Charts, Donut, KPI Tiles & Attention List */}
        <OverviewCommandCentre initialData={overviewData} />
      </div>
    </PageTransition>
  );
}