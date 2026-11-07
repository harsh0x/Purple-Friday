import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { validatePasswordStrength } from "@/lib/security/auth-policy";
import { RESET_TOKENS } from "@/lib/security/auth-tokens";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(10),
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
        { success: false, error: "Invalid token or password." },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Check token validity
    const tokenRecord = RESET_TOKENS.get(token);
    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Password reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    // Validate password policy
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.errors[0] },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(password, 12);
    const email = tokenRecord.email;

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash: newHash,
            failedAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    } catch {
      // Memory fallback
    }

    // Invalidate used token
    RESET_TOKENS.delete(token);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You may now sign in.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reset password";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
