import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleProofAction } from "@/lib/orders/proof";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const session = await getServerSession(authOptions);

  try {
    const body = await req.json();
    const { action, feedback, newUploadId } = body;

    const result = handleProofAction({
      orderId: orderNumber,
      userId: session?.user ? (session.user as { id?: string }).id || "anon" : "anon",
      action,
      feedback,
      newUploadId,
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Proof action failed";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
