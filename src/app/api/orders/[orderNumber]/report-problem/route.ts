import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { reportOrderProblem } from "@/server/customers/account-service";
import { isSameOrigin } from "@/lib/security/origin";

const reportSchema = z.object({
  reason: z.string().min(3, "Reason is required (min 3 chars).").max(100),
  comment: z.string().min(5, "Please provide more details (min 5 chars).").max(1000),
  photoUrls: z.array(z.string().url("Must be valid URL")).max(3).default([]),
});

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const email = session.user.email;
  const { orderNumber } = await props.params;

  if (!userId || !email) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const issue = await reportOrderProblem({
      orderNumber,
      userId,
      customerEmail: email,
      reason: parsed.data.reason,
      comment: parsed.data.comment,
      photoUrls: parsed.data.photoUrls,
    });

    return NextResponse.json({
      success: true,
      message: "Problem report submitted. Our team will review within 24 hours.",
      issue,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to report problem.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
