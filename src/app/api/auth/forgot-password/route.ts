import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { findUserByEmail } from "@/lib/auth-service";
import { RESET_TOKENS } from "@/lib/security/auth-tokens";

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

    const user = await findUserByEmail(parsed.data.email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      RESET_TOKENS.set(token, {
        email: user.email,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      // Log reset link for developer console / simulation
      console.log(`[PASSWORD RESET] For ${user.email}: /auth/reset-password?token=${token}`);
    }

    // Always return constant-time generic confirmation to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account with this email exists, a password reset link has been dispatched.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing reset request";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
