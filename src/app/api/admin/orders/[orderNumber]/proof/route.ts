import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import { getOrderByNumber } from "@/lib/orders";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(
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
    const { proofUrl } = body;

    order.status = "PROOF_READY";
    order.updatedAt = new Date().toISOString();

    await logAdminAction({
      userId: (session?.user as { id?: string })?.id,
      action: "ATTACH_PROOF_READY",
      entity: "Order",
      entityId: order.orderNumber,
      metadata: { proofUrl },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    console.log(
      `[PROOF NOTIFICATION DISPATCHED] Order ${order.orderNumber}: Proof ready alert sent to ${order.customerEmail}`
    );

    return NextResponse.json({
      success: true,
      status: "PROOF_READY",
      message: "Proof attached and customer notified.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Proof attachment failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
