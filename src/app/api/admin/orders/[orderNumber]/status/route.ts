import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import { getOrderByNumber } from "@/lib/orders";
import { logAdminAction } from "@/lib/admin/audit";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  return handleStatusUpdate(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  return handleStatusUpdate(req, context);
}

async function handleStatusUpdate(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const session = await getServerSession(authOptions);

  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { status, trackingNumber } = body;

    const previousStatus = order.status;
    if (status) {
      order.status = status;
    }
    if (trackingNumber) {
      order.trackingNumber = trackingNumber; // Stored reference
    }
    order.updatedAt = new Date().toISOString();

    await logAdminAction({
      userId: (session?.user as { id?: string })?.id,
      action: "UPDATE_ORDER_STATUS",
      entity: "Order",
      entityId: order.orderNumber,
      metadata: { from: previousStatus, to: order.status, trackingNumber },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      status: order.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Status update failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
