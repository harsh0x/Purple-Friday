import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import { getAllOrders } from "@/lib/orders";
import { exportOrdersToCsv } from "@/lib/security/csv";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
  }

  const orders = getAllOrders();
  const csvContent = exportOrdersToCsv(orders);

  await logAdminAction({
    userId: (session?.user as { id?: string })?.id,
    action: "EXPORT_ORDERS_CSV",
    entity: "Order",
    metadata: { count: orders.length },
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="purple-friday-orders-${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
