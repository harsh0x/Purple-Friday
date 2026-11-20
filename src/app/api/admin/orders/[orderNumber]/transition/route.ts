import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { changeOrderStatus } from "@/server/orders/state-machine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { orderNumber } = await context.params;

  try {
    const body = await req.json();
    const { to, reason, expectedVersion } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing target status" }, { status: 400 });
    }

    const actor = {
      email: session.email,
      role: session.role,
      name: session.name,
    };

    const result = await changeOrderStatus(orderNumber, to, actor, reason, expectedVersion);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "State transition failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
