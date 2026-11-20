import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { hasPermission } from "@/lib/admin/permissions";
import { getAdminOrderDetail } from "@/server/orders/orders-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "admin:view_orders")) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { orderNumber } = await context.params;
  const order = await getAdminOrderDetail(orderNumber, session.role);

  if (!order) {
    return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
  }

  return NextResponse.json({ order, viewerRole: session.role });
}
