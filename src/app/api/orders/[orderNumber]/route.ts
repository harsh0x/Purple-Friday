import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumberAsync } from "@/lib/orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  if (!orderNumber) {
    return NextResponse.json({ success: false, error: "Missing order number" }, { status: 400 });
  }

  const order = await getOrderByNumberAsync(orderNumber);
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order });
}
