import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { findUserByEmail } from "@/lib/auth-service";
import { RESET_TOKENS } from "@/lib/security/auth-tokens";
import { sendEmailOtp } from "@/server/otp/email-otp";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req, "auth_forgot_password");
  const rateLimitResult = await checkRateLimit(clientKey, 5, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many password reset requests. Please wait." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

      const normEmail = parsed.data.email.toLowerCase().trim();
      const user = await findUserByEmail(normEmail);

      if (user && user.active) {
        // Send OTP to email
        await sendEmailOtp({
          target: normEmail,
          purpose: "RESET_PASSWORD",
          accountId: user.id,
          ipAddress: req.headers.get("x-forwarded-for") || undefined,
          isUnauthenticated: true,
        });

        // Also set legacy reset token for magic link compatibility
        const token = crypto.randomBytes(32).toString("hex");
        RESET_TOKENS.set(token, {
          email: user.email,
          expiresAt: Date.now() + 60 * 60 * 1000,
        });
      }

      // Always return constant-time generic confirmation to prevent email enumeration
      return NextResponse.json({
        success: true,
        message:
        "If an account with this email exists, a password reset code has been dispatched.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing reset request";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }
