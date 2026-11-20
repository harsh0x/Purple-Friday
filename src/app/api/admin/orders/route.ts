import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { hasPermission } from "@/lib/admin/permissions";
import {
  listAdminOrders,
  bulkAssignDesigner,
  exportOrdersCsv,
} from "@/server/orders/orders-service";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "admin:view_orders")) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isExport = searchParams.get("export") === "csv";

  const filterParams = {
    page: parseInt(searchParams.get("page") || "1", 10),
    pageSize: parseInt(searchParams.get("pageSize") || "10", 10),
    search: searchParams.get("q") || undefined,
    status: searchParams.get("status") || undefined,
    paymentStatus: searchParams.get("paymentStatus") || undefined,
    product: searchParams.get("product") || undefined,
    customer: searchParams.get("customer") || undefined,
    overdueOnly: searchParams.get("overdue") === "true",
    designerId: searchParams.get("designerId") || undefined,
  };

  if (isExport) {
    if (!hasPermission(session.role, "admin:manage_orders")) {
      return NextResponse.json({ error: "Permission denied for CSV export" }, { status: 403 });
    }
    const csvContent = await exportOrdersCsv(filterParams, session.role);
    const filename = `purple_friday_orders_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await listAdminOrders(filterParams, session.role);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "admin:manage_orders")) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, orderNumbers, designerId } = body;

    if (action === "BULK_ASSIGN_DESIGNER") {
      if (!Array.isArray(orderNumbers) || orderNumbers.length === 0 || !designerId) {
        return NextResponse.json({ error: "Invalid bulk assignment parameters" }, { status: 400 });
      }

      const res = await bulkAssignDesigner(orderNumbers, designerId, {
        email: session.email,
        role: session.role,
        name: session.name,
      });

      return NextResponse.json({ success: true, ...res });
    }

    return NextResponse.json({ error: "Unrecognized bulk action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bulk action failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
