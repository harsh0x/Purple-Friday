import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { addOrderInternalNote } from "@/server/orders/orders-service";

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
    const { note } = body;

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: "Note content cannot be empty" }, { status: 400 });
    }

    const actor = {
      email: session.email,
      role: session.role,
      name: session.name,
    };

    const result = await addOrderInternalNote(orderNumber, note, actor);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add internal note";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
