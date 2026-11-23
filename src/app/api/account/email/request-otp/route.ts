import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { findUserByEmail } from "@/lib/auth-service";
import { sendEmailOtp } from "@/server/otp/email-otp";
import { isSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  newEmail: z.string().email("Please provide a valid new email address."),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email." },
        { status: 400 }
      );
    }

    const newEmailNorm = parsed.data.newEmail.toLowerCase().trim();
    if (newEmailNorm === session.user.email?.toLowerCase().trim()) {
      return NextResponse.json({ error: "New email must be different from your current email." }, { status: 400 });
    }

    // Check if new email is already in use
    const existing = await findUserByEmail(newEmailNorm);
    if (existing) {
      return NextResponse.json({ error: "This email address is already in use." }, { status: 400 });
    }

    // Dispatch OTP to the NEW email address
    await sendEmailOtp({
      target: newEmailNorm,
      purpose: "CHANGE_EMAIL",
      accountId: (session.user as { id?: string }).id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${newEmailNorm}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send verification code.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
