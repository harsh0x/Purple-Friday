import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORDER_STORE } from "@/server/orders/state-machine";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const userEmail = session.user.email?.toLowerCase().trim();

  // Strict ownership check: only return orders matching userId or customerEmail
  const allOrders = Array.from(new Set(ORDER_STORE.values()));
  const userOrders = allOrders.filter((o) => {
    const addr = (o.address || {}) as Record<string, string>;
    const orderEmail = (o.customerEmail || addr.email || "").toLowerCase().trim();
    return (userId && o.userId === userId) || (userEmail && orderEmail === userEmail);
  });

  return NextResponse.json({
    success: true,
    orders: userOrders,
  });
}
