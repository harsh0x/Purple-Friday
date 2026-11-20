import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { computeRfmCustomerProfiles } from "@/server/analytics/rfm";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const segment = searchParams.get("segment");
  const query = searchParams.get("q")?.toLowerCase();

  const orders = Array.from(ORDER_STORE.values());
  let profiles = computeRfmCustomerProfiles(orders);

  if (segment && segment !== "ALL") {
    profiles = profiles.filter((p) => p.segment === segment);
  }

  if (query) {
    profiles = profiles.filter(
      (p) =>
        p.customerName.toLowerCase().includes(query) ||
        p.customerEmail.toLowerCase().includes(query) ||
        p.companyName.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    profiles,
    totalCount: profiles.length,
    segmentCounts: {
      vip: profiles.filter((p) => p.segment === "VIP Corporate Buyers").length,
      atRisk: profiles.filter((p) => p.segment === "At-Risk Repeat Clients").length,
      sample: profiles.filter((p) => p.segment === "One-Time Sample Buyers").length,
      newCust: profiles.filter((p) => p.segment === "New Customers").length,
      lapsed: profiles.filter((p) => p.segment === "Lapsed").length,
      reorderDue: profiles.filter((p) => p.isOverdueForReorder).length,
    },
  });
}