import crypto from "crypto";
import { notify } from "../notifications/notify";

export type OtpPurpose =
  | "REGISTER_EMAIL"
  | "CHANGE_EMAIL"
  | "RESET_PASSWORD"
  | "DELETE_ACCOUNT";

export interface StoredOtpRecord {
  hmac: string;
  purpose: OtpPurpose;
  target: string; // normalized email
  accountId?: string;
  ipAddress?: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// In-memory store for active OTPs keyed by `${purpose}:${target}`
export const OTP_STORE = new Map<string, StoredOtpRecord>();

// Rate limiting trackers
const emailSendTimestamps = new Map<string, number[]>();
const ipSendTimestamps = new Map<string, number[]>();
const accountSendTimestamps = new Map<string, number[]>();

// In-memory test driver storage for Playwright and Vitest
export const TEST_OTP_INBOX = new Map<string, { code: string; purpose: OtpPurpose; time: number }[]>();

function getOtpSecret(): string {
  return process.env.OTP_SECRET || "pf_super_secret_otp_hmac_master_key_2026_fallback";
}

export function computeOtpHmac(code: string, purpose: OtpPurpose, target: string): string {
  const secret = getOtpSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${purpose}:${target.toLowerCase().trim()}:${code.trim()}`)
    .digest("hex");
}

function cleanOldTimestamps(list: number[], windowMs: number, now: number): number[] {
  return list.filter((t) => now - t < windowMs);
}

/**
 * Resets in-memory OTP stores. Used strictly in test environments.
 */
export function resetOtpStoreForTesting() {
  OTP_STORE.clear();
  emailSendTimestamps.clear();
  ipSendTimestamps.clear();
  accountSendTimestamps.clear();
  TEST_OTP_INBOX.clear();
}

/**
 * Helper to retrieve the latest OTP for an email in testing/Playwright driver.
 */
export function getLastOtpForTesting(target: string, purpose?: OtpPurpose): string | undefined {
  const list = TEST_OTP_INBOX.get(target.toLowerCase().trim()) || [];
  if (purpose) {
    const matched = list.slice().reverse().find((item) => item.purpose === purpose);
    return matched?.code;
  }
  return list[list.length - 1]?.code;
}

/**
 * Validates Cloudflare Turnstile token if key is configured.
 */
export async function verifyTurnstileToken(token?: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || secret.includes("sample")) {
    return true; // Not configured, skip
  }
  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const outcome = await res.json();
    return Boolean(outcome.success);
  } catch {
    return false;
  }
}

/**
 * Generates and dispatches a 6-digit Email OTP.
 * Stored only as HMAC. Single use, 5 minute expiry, 30s cooldown.
 */
export async function sendEmailOtp(params: {
  target: string;
  purpose: OtpPurpose;
  accountId?: string;
  ipAddress?: string;
  turnstileToken?: string;
  isUnauthenticated?: boolean;
}): Promise<{ success: boolean; message: string; cooldownRemaining?: number }> {
  const target = params.target.toLowerCase().trim();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  // 1. Turnstile check on unauthenticated requests
  if (params.isUnauthenticated) {
    const validTurnstile = await verifyTurnstileToken(params.turnstileToken, params.ipAddress);
    if (!validTurnstile) {
      throw new Error("Security verification failed. Please refresh and try again.");
    }
  }

  // 2. Cooldown check (30 seconds)
  const storeKey = `${params.purpose}:${target}`;
  const existing = OTP_STORE.get(storeKey);
  if (existing) {
    const elapsed = now - existing.lastSentAt;
    if (elapsed < 30_000) {
      const waitSeconds = Math.ceil((30_000 - elapsed) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new code.`);
    }
  }

  // 3. Rate limits: 5 sends / hour per email
  const emailHistory = cleanOldTimestamps(emailSendTimestamps.get(target) || [], ONE_HOUR, now);
  if (emailHistory.length >= 5) {
    throw new Error("Hourly limit exceeded for this email address. Please try again later.");
  }

  // 4. Rate limits: 20 sends / hour per IP
  if (params.ipAddress) {
    const ipHistory = cleanOldTimestamps(ipSendTimestamps.get(params.ipAddress) || [], ONE_HOUR, now);
    if (ipHistory.length >= 20) {
      throw new Error("Too many verification attempts from this IP address. Please wait an hour.");
    }
    ipSendTimestamps.set(params.ipAddress, [...ipHistory, now]);
  }

  // 5. Rate limits: 10 sends / day per account
  if (params.accountId) {
    const accountHistory = cleanOldTimestamps(accountSendTimestamps.get(params.accountId) || [], ONE_DAY, now);
    if (accountHistory.length >= 10) {
      throw new Error("Daily verification code limit reached for this account.");
    }
    accountSendTimestamps.set(params.accountId, [...accountHistory, now]);
  }

  // Update email history
  emailSendTimestamps.set(target, [...emailHistory, now]);

  // 6. Generate 6-digit code securely
  const code = crypto.randomInt(100000, 1000000).toString();
  const hmac = computeOtpHmac(code, params.purpose, target);

  // 7. Store ONLY the HMAC (5 minutes validity)
  OTP_STORE.set(storeKey, {
    hmac,
    purpose: params.purpose,
    target,
    accountId: params.accountId,
    ipAddress: params.ipAddress,
    expiresAt: now + 5 * 60 * 1000,
    attempts: 0,
    lastSentAt: now,
  });

  // 8. Development & Test driver logging
  if (process.env.NODE_ENV !== "production") {
    if (process.env.DEV_OTP_LOG === "true" || process.env.DEV_OTP_LOG === "1") {
      console.log(`[DEV OTP LOG] Purpose: ${params.purpose} | Target: ${target} | Code: ${code}`);
    }
  }

  // Save to test driver memory in test environments
  if (process.env.NODE_ENV === "test" || process.env.VITEST || process.env.PLAYWRIGHT) {
    const existingList = TEST_OTP_INBOX.get(target) || [];
    TEST_OTP_INBOX.set(target, [...existingList, { code, purpose: params.purpose, time: now }]);
  }

  // 9. Dispatch via unified notify()
  await notify("otp_verification", target, {
    otp: code,
    purpose: params.purpose.replace(/_/g, " "),
  });

  // Response never reveals whether account exists
  return {
    success: true,
    message: "If the email is valid, a 6-digit verification code has been sent.",
  };
}

/**
 * Constant-time OTP verification.
 * 5 wrong tries -> dead. Single use.
 */
export async function verifyEmailOtp(params: {
  target: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<{ success: boolean; error?: string }> {
  const target = params.target.toLowerCase().trim();
  const storeKey = `${params.purpose}:${target}`;
  const record = OTP_STORE.get(storeKey);
  const now = Date.now();

  if (!record) {
    return { success: false, error: "Invalid or expired verification code." };
  }

  // Check Expiry (5 minutes)
  if (now > record.expiresAt) {
    OTP_STORE.delete(storeKey);
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  // Check Purpose Match
  if (record.purpose !== params.purpose) {
    return { success: false, error: "Invalid verification purpose for this code." };
  }

  // Compute HMAC for the provided code
  const candidateHmac = computeOtpHmac(params.code, params.purpose, target);

  // Constant-time comparison
  const bufExpected = Buffer.from(record.hmac, "utf8");
  const bufCandidate = Buffer.from(candidateHmac, "utf8");

  const isMatch =
    bufExpected.length === bufCandidate.length &&
    crypto.timingSafeEqual(bufExpected, bufCandidate);

  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      // 5 wrong tries then dead
      OTP_STORE.delete(storeKey);
      return {
        success: false,
        error: "Too many incorrect attempts. This code has been invalidated.",
      };
    }
    return {
      success: false,
      error: `Incorrect verification code. ${5 - record.attempts} attempts remaining.`,
    };
  }

  // Single use: destroy immediately on success
  OTP_STORE.delete(storeKey);
  return { success: true };
}
