import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  listAdminOrders,
  exportOrdersCsv,
  bulkChangeOrderStatus,
} from "@/server/orders/orders-service";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const isExport = searchParams.get("export") === "csv";

  const minAmtStr = searchParams.get("minAmount");
  const maxAmtStr = searchParams.get("maxAmount");

    const filterParams = {
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: parseInt(searchParams.get("pageSize") || "10", 10),
      search: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      product: searchParams.get("product") || undefined,
      customer: searchParams.get("customer") || undefined,
      cityOrPin: searchParams.get("cityOrPin") || searchParams.get("pin") || searchParams.get("city") || undefined,
      coupon: searchParams.get("coupon") || undefined,
      minAmount: minAmtStr ? parseFloat(minAmtStr) : undefined,
      maxAmount: maxAmtStr ? parseFloat(maxAmtStr) : undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      overdueOnly: searchParams.get("overdue") === "true",
      sortBy: (searchParams.get("sortBy") as "createdAt" | "total" | "slaDueAt") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    if (isExport) {
      const csvContent = await exportOrdersCsv(filterParams, session!.role);
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

    const result = await listAdminOrders(filterParams, session!.role);
    return NextResponse.json(result);
  }

  export async function POST(req: NextRequest) {
    const session = await getAdminSession();
    try {
      requireAdmin(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    try {
      const body = await req.json();
      const { action, orderNumbers, targetStatus, reason, courierName, trackingNumber, trackingUrl } = body;

      if (action === "BULK_STATUS" || targetStatus) {
        if (!Array.isArray(orderNumbers) || orderNumbers.length === 0) {
          return NextResponse.json({ error: "Order numbers array required" }, { status: 400 });
        }

        const actor = {
          email: session!.email,
          role: session!.role,
          name: session!.name,
        };

        const result = await bulkChangeOrderStatus(
          orderNumbers,
          targetStatus,
          actor,
          { reason, courierName, trackingNumber, trackingUrl }
        );

        return NextResponse.json({ success: true, ...result });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk action failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
