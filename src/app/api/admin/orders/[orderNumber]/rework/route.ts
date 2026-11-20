import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { recordQcRework } from "@/server/orders/state-machine";

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
    const { reworkNotes, expectedVersion } = body;

    if (!reworkNotes || reworkNotes.trim().length === 0) {
      return NextResponse.json({ error: "Rework notes are required for QC failure tracking." }, { status: 400 });
    }

    const actor = {
      email: session.email,
      role: session.role,
      name: session.name,
    };

    const result = await recordQcRework(orderNumber, actor, reworkNotes, expectedVersion);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record QC rework";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
