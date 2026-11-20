import { NextRequest, NextResponse } from "next/server";
import { approveProofByCustomer } from "@/server/orders/proof-service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  try {
    const result = await approveProofByCustomer(token, ip);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Proof approval failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
