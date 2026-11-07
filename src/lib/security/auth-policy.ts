/**
 * Password Policy & Brute Force Lockout Engine
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

const COMMON_PASSWORDS_BLACKLIST = new Set([
  "password",
  "password123",
  "password1234",
  "admin12345",
  "1234567890",
  "qwertyuiop",
  "purplefriday",
  "purplefriday123",
  "iloveyou123",
  "welcome123",
  "letmein1234",
]);

/**
 * Enforces client and server password strength policy:
 * - Minimum 10 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special symbol
 * - Not in common dictionary
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 10) {
    errors.push("Password must be at least 10 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z).");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z).");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number (0-9).");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special symbol (!@#$%^&*...).");
  }

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS_BLACKLIST.has(normalized)) {
    errors.push("Password is too common or easily guessed. Choose a more unique phrase.");
  }

  // Calculate score 0-4
  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 12) score++;

  return {
    valid: errors.length === 0,
    score: errors.length === 0 ? Math.max(score, 3) : Math.min(score, 2),
    errors,
  };
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingMinutes?: number;
}

/**
 * Checks whether an account is currently locked out from brute-force attempts.
 */
export function checkAccountLockout(user: {
  failedAttempts: number;
  lockedUntil: Date | null | string;
}): LockoutStatus {
  if (!user.lockedUntil) {
    return { isLocked: false };
  }

  const lockDate =
    typeof user.lockedUntil === "string"
      ? new Date(user.lockedUntil)
      : user.lockedUntil;

  const now = new Date();
  if (lockDate.getTime() > now.getTime()) {
    const diffMs = lockDate.getTime() - now.getTime();
    const remainingMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
    return {
      isLocked: true,
      remainingMinutes,
    };
  }

  // Lock expired
  return { isLocked: false };
}

/**
 * Calculates updated lockout status after a failed authentication attempt.
 * Locks account for 15 minutes after 5 consecutive failures.
 */
export function recordFailedAttempt(currentFailures: number): {
  failedAttempts: number;
  lockedUntil: Date | null;
  isNowLocked: boolean;
} {
  const nextFailures = currentFailures + 1;

  if (nextFailures >= 5) {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return {
      failedAttempts: nextFailures,
      lockedUntil,
      isNowLocked: true,
    };
  }

  return {
    failedAttempts: nextFailures,
    lockedUntil: null,
    isNowLocked: false,
  };
}
