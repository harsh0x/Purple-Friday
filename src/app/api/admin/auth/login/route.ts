import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserCredentials } from "@/lib/auth-service";
import { isStaffRole } from "@/lib/admin/permissions";
import { createAdminSessionToken, applyAdminSessionCookie } from "@/lib/admin/admin-session";
import { writeAudit } from "@/lib/admin/audit";

const LoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

// In-Memory IP rate limiter for admin login
const LOGIN_RATE_LIMIT = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const MAX_ATTEMPTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = LOGIN_RATE_LIMIT.get(ip);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    LOGIN_RATE_LIMIT.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
    }
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // 1. Rate limiting check
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes before trying again." },
      { status: 429 }
    );
  }

  // 2. Validate input schema with Zod strict
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    // 3. Verify credentials and account lock status
    const user = await verifyUserCredentials(email, password);

    // 4. Enforce staff role restriction: Customer accounts can NEVER open /admin
    if (!isStaffRole(user.role)) {
      // Return generic error - do not reveal account role
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 5. Issue secure Admin Session
    const sessionToken = await createAdminSessionToken(user);
    const homeScreen = "/admin";

    // 6. Record immutable audit log
    await writeAudit({
      actor: user.email,
      actorRole: user.role,
      action: "auth.admin_login_success",
      entityType: "STAFF_USER",
      entityId: user.id,
      ipAddress: clientIp,
      after: {
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      homeScreen,
    });

    applyAdminSessionCookie(response, sessionToken);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid email or password.";

    // If account was locked, pass the friendly lockout message
    const isLockout = message.includes("temporarily locked") || message.includes("Account locked");

    await writeAudit({
      actor: email.toLowerCase().trim(),
      actorRole: "UNAUTHENTICATED",
      action: "auth.admin_login_failed",
      entityType: "STAFF_USER",
      ipAddress: clientIp,
      after: { reason: message },
    });

    return NextResponse.json(
      { error: isLockout ? message : "Invalid email or password." },
      { status: isLockout ? 423 : 401 }
    );
  }
}
