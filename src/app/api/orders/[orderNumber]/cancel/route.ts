import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { changeOrderStatus, ORDER_STORE } from "@/server/orders/state-machine";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  const { orderNumber } = await props.params;

  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) {
    return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
  }

  // Customer identity
  const addr = (order.address as Record<string, unknown>) || {};
  const customerEmail = session?.user?.email || (addr.customerEmail as string) || "customer@purplefriday.in";

  try {
    const actor = {
      email: customerEmail,
      role: "CUSTOMER",
      name: session?.user?.name || (addr.customerName as string) || "Customer",
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
