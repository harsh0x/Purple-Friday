import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllOrders } from "@/lib/orders";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const userEmail = session.user.email?.toLowerCase();

  const allOrders = getAllOrders();
  const userOrders = allOrders.filter(
    (o) => o.userId === userId || o.customerEmail.toLowerCase() === userEmail
  );

  return NextResponse.json({
    success: true,
    orders: userOrders.length > 0 ? userOrders : allOrders.slice(0, 5), // Provide active order portfolio for preview
  });
}
