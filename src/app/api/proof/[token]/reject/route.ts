import { NextRequest, NextResponse } from "next/server";
import { requestProofRevisionByCustomer } from "@/server/orders/proof-service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  try {
    const body = await req.json();
    const { comments } = body;

    const result = await requestProofRevisionByCustomer(token, comments, ip);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Revision request failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
