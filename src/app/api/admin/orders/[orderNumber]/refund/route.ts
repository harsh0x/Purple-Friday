import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { processOrderRefund } from "@/server/refunds/refund-service";

const refundSchema = z.object({
  amountPaise: z.number().int().positive().optional(),
  reason: z.string().min(5, "A descriptive reason (min 5 chars) is required for refunds."),
  idempotencyKey: z.string().min(1, "Idempotency key is required."),
  type: z.literal("MANUAL").default("MANUAL").optional(),
  reference: z.string().optional(),
});

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
    const parsed = refundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid refund data" },
        { status: 400 }
      );
    }

    const result = await processOrderRefund({
      orderNumber,
      amountPaise: parsed.data.amountPaise,
      reason: parsed.data.reason,
      idempotencyKey: parsed.data.idempotencyKey,
      actor: email,
      actorRole: role,
      type: parsed.data.type,
      reference: parsed.data.reference,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Refund processing failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
