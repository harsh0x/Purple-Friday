/**
 * Guest Order Verification Security
 * Generates and verifies HMAC-SHA256 signed tokens for guest order access.
 * Compatible with Node and Edge runtimes via Web Crypto API.
 */

function getSecretKey(): string {
  return process.env.NEXTAUTH_SECRET || "pf_guest_order_super_secret_key_2026";
}

export async function signGuestOrderToken(orderNumber: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecretKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`guest_order:${orderNumber}`));
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${orderNumber}.${hash}`;
}

export async function verifyGuestOrderToken(
  orderNumber: string,
  token?: string | null
): Promise<boolean> {
  if (!token || !orderNumber) return false;
  try {
    const expected = await signGuestOrderToken(orderNumber);
    return token === expected;
  } catch {
    return false;
  }
}
