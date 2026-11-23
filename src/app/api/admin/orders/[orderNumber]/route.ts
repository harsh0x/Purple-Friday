import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import { getAdminOrderDetail, updateOrderAddress } from "@/server/orders/orders-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { orderNumber } = await context.params;
  const order = await getAdminOrderDetail(orderNumber, session!.role);

    if (!order) {
      return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
    }

    return NextResponse.json({ order, viewerRole: session!.role });
  }

  export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ orderNumber: string }> }
  ) {
    const session = await getAdminSession();
    try {
      requireAdmin(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const { orderNumber } = await context.params;

    try {
      const body = await req.json();
      const { address, expectedVersion } = body;

      if (!address || !address.line1 || !address.city || !address.state || !address.pin) {
        return NextResponse.json(
          { error: "Address line1, city, state, and pin are required." },
          { status: 400 }
        );
      }

      const actor = {
        email: session!.email,
        role: session!.role,
        name: session!.name,
      };

      const result = await updateOrderAddress(orderNumber, address, actor, expectedVersion);
      return NextResponse.json({ success: true, order: result.order });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Address update failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
