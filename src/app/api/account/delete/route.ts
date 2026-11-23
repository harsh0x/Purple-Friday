import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { findUserById, anonymizeUserAccount } from "@/lib/auth-service";
import { verifyEmailOtp } from "@/server/otp/email-otp";
import { notify } from "@/server/notifications/notify";
import { recordCustomerEvent } from "@/server/customers/customer-events";
import { isSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  password: z.string().min(1, "Password is required to delete account."),
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
  const email = session.user.email;
  if (!userId || !email) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Password and OTP are required." },
        { status: 400 }
      );
    }

    const { password, otp } = parsed.data;

    const user = await findUserById(userId);
    if (!user) throw new Error("User not found.");

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    // Verify OTP
    const otpResult = await verifyEmailOtp({
      target: user.email,
      purpose: "DELETE_ACCOUNT",
      code: otp,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || "Invalid verification code." },
        { status: 400 }
      );
    }

    const originalEmail = user.email;

    // Erase or anonymize personal data, orders/invoices preserved for tax
    await anonymizeUserAccount(userId);

    // Send confirmation email to the user
    await notify("welcome", originalEmail, {
      name: "Customer",
      message: "Your Purple Friday account has been deleted and your personal data has been erased. Tax invoices and order records are retained as required by Indian tax law.",
    });

    // Record customer event & admin alert
    await recordCustomerEvent({
      userId,
      customerEmail: originalEmail,
      type: "account_deleted",
      summary: `Customer account deleted and anonymized.`,
    });

    return NextResponse.json({
      success: true,
      message: "Account has been deleted and personal data anonymized.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete account.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
