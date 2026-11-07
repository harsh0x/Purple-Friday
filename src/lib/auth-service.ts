import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "./prisma";
import { checkAccountLockout, recordFailedAttempt } from "./security/auth-policy";

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
}

// In-Memory mock store fallback for development
interface StoredMockUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
  failedAttempts: number;
  lockedUntil: Date | null;
}

const MOCK_USERS = new Map<string, StoredMockUser>();

// Seed default initial Admin user
const adminEmail = (process.env.ADMIN_EMAIL || "admin@purplefriday.com").toLowerCase();
const adminPass = process.env.ADMIN_INITIAL_PASSWORD || "Admin@PF2026!";
const initialAdminHash = bcrypt.hashSync(adminPass, 12);

MOCK_USERS.set(adminEmail, {
  id: "usr_admin_seed",
  email: adminEmail,
  passwordHash: initialAdminHash,
  name: "Purple Friday Admin",
  role: "ADMIN",
  failedAttempts: 0,
  lockedUntil: null,
});

export async function findUserByEmail(email: string) {
  const normEmail = email.toLowerCase().trim();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const user = await prisma.user.findUnique({
        where: { email: normEmail },
      });
      if (user) return user;
    }
  } catch {
    // Fallback to mock store
  }

  return MOCK_USERS.get(normEmail) || null;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: "CUSTOMER" | "ADMIN";
}): Promise<SafeUser> {
  const normEmail = data.email.toLowerCase().trim();
  const existing = await findUserByEmail(normEmail);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  // Hash password with bcrypt cost 12
  const passwordHash = await bcrypt.hash(data.password, 12);
  const role = data.role || "CUSTOMER";

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const created = await prisma.user.create({
        data: {
          email: normEmail,
          passwordHash,
          name: data.name,
          role: role as UserRole,
        },
      });
      return {
        id: created.id,
        email: created.email,
        name: created.name || "",
        role: created.role as "CUSTOMER" | "ADMIN",
      };
    }
  } catch {
    // Fallback to memory
  }

  const mockUser: StoredMockUser = {
    id: `usr_${Date.now()}`,
    email: normEmail,
    passwordHash,
    name: data.name,
    role,
    failedAttempts: 0,
    lockedUntil: null,
  };
  MOCK_USERS.set(normEmail, mockUser);

  return {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: mockUser.role,
  };
}

export async function verifyUserCredentials(
  email: string,
  plainPassword: string
): Promise<SafeUser> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // 1. Check account lockout
  const lockout = checkAccountLockout({
    failedAttempts: user.failedAttempts,
    lockedUntil: user.lockedUntil,
  });

  if (lockout.isLocked) {
    throw new Error(
      `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockout.remainingMinutes} minutes.`
    );
  }

  // 2. Verify password with bcrypt
  const isMatch = await bcrypt.compare(plainPassword, user.passwordHash);

  if (!isMatch) {
    // Increment failed attempts and lock if 5th failure
    const update = recordFailedAttempt(user.failedAttempts);

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: update.failedAttempts,
            lockedUntil: update.lockedUntil,
          },
        });
      }
    } catch {
      // Memory fallback
    }

    if (MOCK_USERS.has(user.email)) {
      const m = MOCK_USERS.get(user.email)!;
      m.failedAttempts = update.failedAttempts;
      m.lockedUntil = update.lockedUntil;
    }

    if (update.isNowLocked) {
      throw new Error(
        "Account locked for 15 minutes due to 5 consecutive failed login attempts."
      );
    }

    throw new Error("Invalid email or password.");
  }

  // 3. Reset failed attempts on successful login
  if (user.failedAttempts > 0 || user.lockedUntil) {
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    } catch {
      // Memory fallback
    }

    if (MOCK_USERS.has(user.email)) {
      const m = MOCK_USERS.get(user.email)!;
      m.failedAttempts = 0;
      m.lockedUntil = null;
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || "Customer",
    role: user.role as "CUSTOMER" | "ADMIN",
  };
}
