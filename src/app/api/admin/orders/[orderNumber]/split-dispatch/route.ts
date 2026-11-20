import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeSplitDispatch, SplitRowInput } from "@/server/shipping/shipping-service";

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
    const body = await req.json();
    const rows = body.rows as SplitRowInput[];
    const providerName = body.providerName as "MANUAL" | "SHIPROCKET" | undefined;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Rows array is required." }, { status: 400 });
    }

    const result = await executeSplitDispatch({
      orderNumber,
      rows,
      actor: email,
      actorRole: role,
      providerName,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to execute split dispatch";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
