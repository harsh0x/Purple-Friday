import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { changeOrderStatus, ORDER_STORE } from "@/server/orders/state-machine";
import { isSameOrigin } from "@/lib/security/origin";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await props.params;

  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) {
    return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
  }

  // Security: strict ownership check
  const userId = (session.user as { id?: string }).id;
  const userEmail = session.user.email?.toLowerCase().trim();
  const addr = (order.address || {}) as Record<string, string>;
  const orderEmail = (order.customerEmail || addr.email || "").toLowerCase().trim();
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";

  const isOwner = (userId && order.userId === userId) || (userEmail && orderEmail === userEmail) || isAdmin;
  if (!isOwner) {
    return NextResponse.json({ error: "Permission denied: You do not own this order." }, { status: 403 });
  }

  try {
    const actor = {
      email: userEmail || orderEmail || "customer@purplefriday.in",
      role: isAdmin ? "ADMIN" : "CUSTOMER",
      name: session.user.name || addr.customerName || "Customer",
    };

    const result = await changeOrderStatus(
      order.id,
      "CANCELLED",
      actor,
      "Self-serve cancellation requested by customer from account page."
    );

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully.",
      orderNumber: result.order.orderNumber,
      status: result.order.status,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Cancellation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
