import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AdminRole, isStaffRole } from "./permissions";

export const ADMIN_COOKIE_NAME = "pf_admin_session";
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours max lifetime
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  phone?: string;
  mustChangePassword: boolean;
  issuedAt: number;
  expiresAt: number;
  lastActive: number;
}

function getSecretKey(): string {
  return process.env.NEXTAUTH_SECRET || "pf_super_secret_jwt_key_2026_dev_fallback";
}

function signPayload(serialized: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(serialized).digest("base64url");
}

export function createAdminSessionToken(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    mustChangePassword?: boolean;
  }
): string {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name || "Staff Member",
    role: (user.role.toUpperCase() as AdminRole) || "SUPER_ADMIN",
    phone: user.phone,
    mustChangePassword: Boolean(user.mustChangePassword),
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS,
    lastActive: now,
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(serialized, getSecretKey());
  return `${serialized}.${signature}`;
}

export function verifyAdminSessionToken(
  token?: string | null
): { valid: boolean; session?: AdminSessionPayload; reason?: string } {
  if (!token) {
    return { valid: false, reason: "Missing token" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Malformed token" };
  }

  const [serialized, signature] = parts;
  const expectedSig = signPayload(serialized, getSecretKey());

  if (signature !== expectedSig) {
    return { valid: false, reason: "Invalid signature" };
  }

  try {
    const payloadJson = Buffer.from(serialized, "base64url").toString("utf-8");
    const session = JSON.parse(payloadJson) as AdminSessionPayload;
    const now = Date.now();

    // 1. Check absolute 8-hour expiry
    if (now > session.expiresAt) {
      return { valid: false, reason: "Session expired (8-hour cap reached)" };
    }

    // 2. Check 30-minute idle timeout
    if (now - session.lastActive > IDLE_TIMEOUT_MS) {
      return { valid: false, reason: "Session expired due to 30 minutes of inactivity" };
    }

    // 3. Ensure role is a staff role
    if (!isStaffRole(session.role)) {
      return { valid: false, reason: "Customer role cannot access admin" };
    }

    return { valid: true, session };
  } catch {
    return { valid: false, reason: "Token parse failure" };
  }
}

export function touchAdminSession(session: AdminSessionPayload): string {
  const updated: AdminSessionPayload = {
    ...session,
    lastActive: Date.now(),
  };
  const serialized = Buffer.from(JSON.stringify(updated)).toString("base64url");
  const signature = signPayload(serialized, getSecretKey());
  return `${serialized}.${signature}`;
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const result = verifyAdminSessionToken(token);
  return result.valid ? result.session || null : null;
}

export function applyAdminSessionCookie(response: NextResponse, sessionToken: string): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000), // 8 hours in seconds
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
}
