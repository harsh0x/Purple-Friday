import React from "react";
import { getAdminSession } from "@/lib/admin/admin-session";
import { PageTransition } from "@/components/admin/PageTransition";
import { getOverviewDashboardData } from "@/server/analytics/overview-service";
import { OverviewCommandCentre } from "@/components/admin/OverviewCommandCentre";

  export default async function AdminOverviewPage() {
    const session = await getAdminSession();
    const overviewData = await getOverviewDashboardData(session?.name || "Admin");

  return (
    <PageTransition>
      <div className="space-y-8">
        <OverviewCommandCentre initialData={overviewData} />
      </div>
    </PageTransition>
  );
}
