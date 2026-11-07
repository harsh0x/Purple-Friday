import { describe, it, expect } from "vitest";
import {
  validatePasswordStrength,
  checkAccountLockout,
  recordFailedAttempt,
} from "@/lib/security/auth-policy";

describe("Authentication Security - Password Policy Validator", () => {
  it("rejects passwords shorter than 10 characters", () => {
    const result = validatePasswordStrength("Ab1!short");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("at least 10 characters"))).toBe(true);
  });

  it("rejects passwords missing uppercase letters", () => {
    const result = validatePasswordStrength("nouppercase123!@#");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
  });

  it("rejects passwords missing lowercase letters", () => {
    const result = validatePasswordStrength("NOLOWERCASE123!@#");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("rejects passwords missing numbers", () => {
    const result = validatePasswordStrength("NoNumbersHere!@#");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("number"))).toBe(true);
  });

  it("rejects passwords missing special characters", () => {
    const result = validatePasswordStrength("NoSpecialChar1234");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("special symbol"))).toBe(true);
  });

  it("rejects passwords in the common dictionary blacklist", () => {
    const result = validatePasswordStrength("purplefriday");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("too common"))).toBe(true);
  });

  it("accepts strong passwords meeting all criteria and returns high score", () => {
    const result = validatePasswordStrength("SuperSecure@PF2026!");
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });
});

describe("Authentication Security - Brute Force Lockout Logic", () => {
  it("does not lock account on failures 1 through 4", () => {
    for (let i = 0; i < 4; i++) {
      const result = recordFailedAttempt(i);
      expect(result.isNowLocked).toBe(false);
      expect(result.lockedUntil).toBeNull();
      expect(result.failedAttempts).toBe(i + 1);
    }
  });

  it("locks account for 15 minutes upon reaching 5 consecutive failures", () => {
    const result = recordFailedAttempt(4); // 5th failure
    expect(result.isNowLocked).toBe(true);
    expect(result.failedAttempts).toBe(5);
    expect(result.lockedUntil).not.toBeNull();

    // Verify lock is active
    const status = checkAccountLockout({
      failedAttempts: result.failedAttempts,
      lockedUntil: result.lockedUntil,
    });
    expect(status.isLocked).toBe(true);
    expect(status.remainingMinutes).toBeGreaterThanOrEqual(14);
    expect(status.remainingMinutes).toBeLessThanOrEqual(15);
  });

  it("reports account as unlocked once lockout timestamp has expired", () => {
    const expiredLock = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const status = checkAccountLockout({
      failedAttempts: 5,
      lockedUntil: expiredLock,
    });
    expect(status.isLocked).toBe(false);
  });
});

