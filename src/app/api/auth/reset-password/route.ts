import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePasswordStrength } from "@/lib/security/auth-policy";
import { RESET_TOKENS } from "@/lib/security/auth-tokens";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";
import { verifyEmailOtp } from "@/server/otp/email-otp";
import { changeUserPassword, findUserByEmail } from "@/lib/auth-service";
import { notify } from "@/server/notifications/notify";
import { recordCustomerEvent } from "@/server/customers/customer-events";

const resetPasswordSchema = z.object({
  email: z.string().email().optional(),
  otp: z.string().length(6).optional(),
  token: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-origin requests are forbidden." },
      { status: 403 }
    );
  }

  const clientKey = getClientKey(req, "auth_reset_password");
  const rateLimitResult = await checkRateLimit(clientKey, 5, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many reset attempts. Please wait." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid password reset request." },
        { status: 400 }
      );
    }

    const { email, otp, token, password } = parsed.data;

      let targetEmail: string | undefined = undefined;

      if (otp && email) {
        // 1. Reset via Email OTP
        const otpRes = await verifyEmailOtp({
          target: email,
          purpose: "RESET_PASSWORD",
          code: otp,
        });

        if (!otpRes.success) {
          return NextResponse.json(
            { success: false, error: otpRes.error || "Invalid verification code." },
            { status: 400 }
          );
        }
        targetEmail = email.toLowerCase().trim();
      } else if (token) {
        // 2. Reset via Token Link
        const tokenRecord = RESET_TOKENS.get(token);
        if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
          return NextResponse.json(
            { success: false, error: "Password reset link is invalid or has expired." },
            { status: 400 }
          );
        }
        targetEmail = tokenRecord.email.toLowerCase().trim();
        RESET_TOKENS.delete(token);
      } else {
        return NextResponse.json(
          { success: false, error: "Either OTP code or reset token is required." },
          { status: 400 }
        );
      }

      // Validate password policy
      const strength = validatePasswordStrength(password);
      if (!strength.valid) {
        return NextResponse.json(
          { success: false, error: strength.errors[0] || "Password does not meet requirements." },
          { status: 400 }
        );
      }

        const user = await findUserByEmail(targetEmail);
        if (!user) {
          return NextResponse.json(
            { success: false, error: "Account not found." },
            { status: 404 }
          );
        }

        // Update password & bump tokenVersion to end all sessions
        await changeUserPassword(user.id, password);

        // Security alert email
        await notify("security_alert_password_changed", user.email);

        // Customer event & admin alert
        await recordCustomerEvent({
          userId: user.id,
          customerEmail: user.email,
          type: "password_changed",
          summary: "Customer password reset via OTP/link.",
        });

        return NextResponse.json({
          success: true,
          message: "Password updated successfully. All other sessions have been signed out.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Password reset failed";
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
    }
