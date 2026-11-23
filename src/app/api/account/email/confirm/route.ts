import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { findUserById, changeUserEmail } from "@/lib/auth-service";
import { verifyEmailOtp } from "@/server/otp/email-otp";
import { notify } from "@/server/notifications/notify";
import { recordCustomerEvent } from "@/server/customers/customer-events";
import { isSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1, "Current password is required."),
  otp: z.string().length(6, "6-digit verification code is required."),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid confirmation data." },
        { status: 400 }
      );
    }

    const { newEmail, password, otp } = parsed.data;
    const newEmailNorm = newEmail.toLowerCase().trim();

    // 1. Verify current password
    const user = await findUserById(userId);
    if (!user) throw new Error("User not found.");

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    // 2. Verify OTP sent to the NEW email
    const otpResult = await verifyEmailOtp({
      target: newEmailNorm,
      purpose: "CHANGE_EMAIL",
      code: otp,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    const oldEmail = user.email;

    // 3. Update email in database & bump tokenVersion
    const updated = await changeUserEmail(userId, newEmailNorm);

    // 4. Dispatch security alerts to BOTH old and new email
    await notify("security_alert_email_changed", oldEmail);
    await notify("security_alert_email_changed", newEmailNorm);

    // 5. Record customer event & admin alert
    await recordCustomerEvent({
      userId,
      customerEmail: newEmailNorm,
      type: "email_changed",
      summary: `Email changed from ${oldEmail} to ${newEmailNorm}.`,
      metadata: { oldEmail, newEmail: newEmailNorm },
    });

    return NextResponse.json({
      success: true,
      message: "Email updated successfully. Other active sessions have been signed out.",
      user: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to change email.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
