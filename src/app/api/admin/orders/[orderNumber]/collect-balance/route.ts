import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markCodBalanceCollected } from "@/server/payments/cod-service";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role || "CUSTOMER";
  const email = session.user.email || "staff@purplefriday.in";
  const { orderNumber } = await props.params;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await markCodBalanceCollected({
      orderNumber,
      actor: email,
      actorRole: role,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record balance collection";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
