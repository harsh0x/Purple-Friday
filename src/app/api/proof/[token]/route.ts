import { NextRequest, NextResponse } from "next/server";
import { getProofByToken } from "@/server/orders/proof-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  try {
    const details = await getProofByToken(token, ip);
    if (!details) {
      return NextResponse.json({ error: "Proof not found or link has expired." }, { status: 404 });
    }
    return NextResponse.json({ proof: details });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load proof";
    return NextResponse.json({ error: msg }, { status: 429 });
  }
}
