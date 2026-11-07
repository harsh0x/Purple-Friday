import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/security/auth-policy";
import { createUser } from "@/lib/auth-service";

const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  password: z.string().min(10, "Password must be at least 10 characters."),
});

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req, "auth_register");
  const rateLimitResult = await checkRateLimit(clientKey, 10, 60000);
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

    const { email, name, password } = parsed.data;

    // Strict Password Policy Validation
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.errors[0] || "Password does not meet security requirements." },
        { status: 400 }
      );
    }

    const user = await createUser({
      email,
      name,
      password,
      role: "CUSTOMER",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

