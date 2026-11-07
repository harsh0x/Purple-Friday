import { NextRequest } from "next/server";
import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "purple-friday-production-grade-secret-key-32-chars";

/**
 * Signs an anonymous session ID using HMAC-SHA256
 */
export function signSessionId(id: string): string {
  const signature = crypto.createHmac("sha256", SECRET).update(id).digest("hex");
  return `${id}.${signature}`;
}

/**
 * Verifies a signed session ID
 */
export function verifySessionId(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [id, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(id).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  return id;
}

/**
 * Extracts or generates the uploader identity from the request.
 * If user is authenticated via NextAuth, returns userId.
 * Otherwise returns verified anonymous session ID or a newly created one.
 */
export function resolveUploaderIdentity(req: NextRequest): {
  uploaderId: string;
  isNew: boolean;
  signedCookieValue?: string;
} {
  // 1. Check for logged-in NextAuth session token
  const nextAuthToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (nextAuthToken) {
    // We can use a hash of the token or user ID
    const userId = crypto.createHash("sha256").update(nextAuthToken).digest("hex").slice(0, 32);
    return { uploaderId: `user_${userId}`, isNew: false };
  }

  // 2. Check for existing signed anonymous session cookie
  const cookie = req.cookies.get("pf_anon_uploader")?.value;
  if (cookie) {
    const verifiedId = verifySessionId(cookie);
    if (verifiedId) {
      return { uploaderId: verifiedId, isNew: false };
    }
  }

  // 3. Generate fresh cryptographically secure anonymous session
  const newId = `anon_${crypto.randomUUID()}`;
  const signed = signSessionId(newId);
  return { uploaderId: newId, isNew: true, signedCookieValue: signed };
}

