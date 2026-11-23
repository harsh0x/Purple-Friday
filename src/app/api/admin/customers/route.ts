import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { computeCustomerProfiles, exportCustomersCsv } from "@/server/customers/customer-service";
import { CUSTOMER_EVENTS } from "@/server/customers/customer-events";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase();
  const isExport = searchParams.get("export") === "csv";

  const orders = Array.from(new Set(ORDER_STORE.values()));
  let profiles = computeCustomerProfiles(orders);

  if (query) {
    profiles = profiles.filter(
      (p) =>
        p.customerName.toLowerCase().includes(query) ||
        p.customerEmail.toLowerCase().includes(query) ||
        p.customerPhone.includes(query) ||
        p.companyName.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
    );
  }

  if (isExport) {
    const csvContent = exportCustomersCsv(profiles);
    const filename = `purple_friday_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    profiles,
    totalCount: profiles.length,
    recentEvents: CUSTOMER_EVENTS.slice(0, 30),
  });
}
