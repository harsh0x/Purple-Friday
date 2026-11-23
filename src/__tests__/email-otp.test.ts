import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sendEmailOtp,
  verifyEmailOtp,
  resetOtpStoreForTesting,
  getLastOtpForTesting,
  computeOtpHmac,
} from "@/server/otp/email-otp";

describe("Email OTP Security & Verification Engine", () => {
  beforeEach(() => {
    resetOtpStoreForTesting();
    vi.restoreAllMocks();
  });

  it("generates a 6-digit code and verifies successfully on correct match (single use)", async () => {
    const email = "customer@example.com";
    await sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" });

    const code = getLastOtpForTesting(email, "REGISTER_EMAIL");
    expect(code).toBeDefined();
    expect(code).toMatch(/^\d{6}$/);

    // Verify code
    const res = await verifyEmailOtp({ target: email, purpose: "REGISTER_EMAIL", code: code! });
    expect(res.success).toBe(true);

    // Single use check: verifying a second time should fail
    const reUse = await verifyEmailOtp({ target: email, purpose: "REGISTER_EMAIL", code: code! });
    expect(reUse.success).toBe(false);
    expect(reUse.error).toContain("Invalid or expired");
  });

  it("enforces purpose mismatch: cannot use REGISTER_EMAIL code for RESET_PASSWORD", async () => {
    const email = "customer@example.com";
    await sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" });
    const code = getLastOtpForTesting(email, "REGISTER_EMAIL");

    const res = await verifyEmailOtp({ target: email, purpose: "RESET_PASSWORD", code: code! });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid or expired");
  });

  it("invalidates code after 5 wrong attempts (dead code)", async () => {
    const email = "wrong@example.com";
    await sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" });
    const correctCode = getLastOtpForTesting(email, "REGISTER_EMAIL");

    // 4 wrong attempts
    for (let i = 1; i <= 4; i++) {
      const res = await verifyEmailOtp({ target: email, purpose: "REGISTER_EMAIL", code: "000000" });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Incorrect verification code");
    }

    // 5th wrong attempt kills code
    const fifth = await verifyEmailOtp({ target: email, purpose: "REGISTER_EMAIL", code: "000000" });
    expect(fifth.success).toBe(false);
    expect(fifth.error).toContain("Too many incorrect attempts");

    // Correct code now fails because code is dead
    const afterDead = await verifyEmailOtp({ target: email, purpose: "REGISTER_EMAIL", code: correctCode! });
    expect(afterDead.success).toBe(false);
    expect(afterDead.error).toContain("Invalid or expired");
  });

  it("enforces 30-second resend cooldown", async () => {
    const email = "cooldown@example.com";
    await sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" });

    await expect(
      sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" })
    ).rejects.toThrow(/wait \d+ seconds/i);
  });

  it("enforces 5-minute expiry", async () => {
    const email = "expired@example.com";
    await sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" });
    const code = getLastOtpForTesting(email, "REGISTER_EMAIL");

    // Advance clock past 5 minutes (300,001 ms)
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 301000);

    const res = await verifyEmailOtp({ target: email, purpose: "REGISTER_EMAIL", code: code! });
    expect(res.success).toBe(false);
    expect(res.error).toContain("expired");
  });

  it("enforces rate limits: 5 sends per hour per email", async () => {
    const email = "ratelimit@example.com";
    let fakeNow = Date.now();

    for (let i = 0; i < 5; i++) {
      vi.spyOn(Date, "now").mockReturnValue(fakeNow);
      await sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" });
      fakeNow += 31000; // Step past cooldown
    }

    vi.spyOn(Date, "now").mockReturnValue(fakeNow);
    await expect(
      sendEmailOtp({ target: email, purpose: "REGISTER_EMAIL" })
    ).rejects.toThrow(/Hourly limit exceeded for this email/i);
  });

  it("stores HMAC only and never plaintext OTP", () => {
    const email = "crypto@example.com";
    const hmac1 = computeOtpHmac("123456", "REGISTER_EMAIL", email);
    const hmac2 = computeOtpHmac("123456", "REGISTER_EMAIL", email);
    const hmacOther = computeOtpHmac("123457", "REGISTER_EMAIL", email);

    expect(hmac1).toBe(hmac2);
    expect(hmac1).not.toBe(hmacOther);
    expect(hmac1).not.toContain("123456");
  });
});
