import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/security/auth-policy";
import { createUser, findUserByEmail } from "@/lib/auth-service";
import { isSameOrigin } from "@/lib/security/origin";
import { sendEmailOtp } from "@/server/otp/email-otp";

const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-origin requests are forbidden." },
      { status: 403 }
    );
  }

  const clientKey = getClientKey(req, "auth_register");
  const rateLimitResult = await checkRateLimit(clientKey, 5, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many registration attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { email, name, phone, password } = parsed.data;

    // Strict Password Policy Validation
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.errors[0] || "Password does not meet security requirements." },
        { status: 400 }
      );
    }

      const normEmail = email.toLowerCase().trim();
      const existing = await findUserByEmail(normEmail);

      if(!existing) {
        // Create user in inactive status until email OTP is verified
        await createUser({
          email: normEmail,
          name,
          phone,
          password,
          role: "CUSTOMER",
          active: false,
        });
      }

    // Send 6-digit OTP to the registered email
    await sendEmailOtp({
        target: normEmail,
        purpose: "REGISTER_EMAIL",
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        isUnauthenticated: true,
      });

      return NextResponse.json({
        success: true,
        message: "Verification code sent to your email. Please verify to activate your account.",
        email: normEmail,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
  }
