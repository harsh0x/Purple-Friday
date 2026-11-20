import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { getOverviewDashboardData } from "@/server/analytics/overview-service";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getOverviewDashboardData(session.role);
  return NextResponse.json(data);
}