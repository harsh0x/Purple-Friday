import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { REFUND_STORE } from "@/server/refunds/refund-service";
import { toPaise } from "@/server/pricing/engine";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Deduplicate orders
  const orders = Array.from(ORDER_STORE.values()).map((o) => {
    const totalPaise = toPaise(o.total);
    const advancePaidPaise = o.advancePaidPaise || (o.paymentStatus === "PAID" ? totalPaise : 0);
    const balanceDuePaise = o.balanceDuePaise || 0;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: ((o.address as Record<string, unknown>)?.customerName as string) || "Customer",
      total: o.total,
      totalPaise,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      advancePaidPaise,
      balanceDuePaise,
      balanceCollectedAt: o.balanceCollectedAt,
      balanceCollectedBy: o.balanceCollectedBy,
      createdAt: o.createdAt,
    };
  });

  const refunds = Array.from(REFUND_STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    success: true,
    orders,
    refunds,
  });
}
