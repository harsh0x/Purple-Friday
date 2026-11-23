import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORDER_STORE } from "@/server/orders/state-machine";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await props.params;
  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get("email")?.toLowerCase().trim();

  // Security: strict ownership check
  const userId = (session?.user as { id?: string })?.id;
  const userEmail = session?.user?.email?.toLowerCase().trim();
  const addr = (order.address || {}) as Record<string, string>;
  const orderEmail = (order.customerEmail || addr.email || "").toLowerCase().trim();

  const isOwner =
    Boolean(userId && order.userId === userId) ||
    Boolean(userEmail && orderEmail === userEmail) ||
    Boolean(emailParam && orderEmail === emailParam);
  if (!isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, order });
}
