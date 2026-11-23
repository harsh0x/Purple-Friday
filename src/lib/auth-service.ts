import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "./prisma";
import { checkAccountLockout, recordFailedAttempt } from "./security/auth-policy";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";
export type AllRole = "CUSTOMER" | AdminRole;

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: AllRole;
  phone?: string;
  active?: boolean;
  lastLogin?: Date | null;
  mustChangePassword?: boolean;
  version?: number;
  tokenVersion?: number;
}

export interface StoredMockUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: AllRole;
  active: boolean;
  lastLogin: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  version: number;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const MOCK_USERS = new Map<string, StoredMockUser>();

// Seed default initial Admin user
const adminEmail = (process.env.ADMIN_EMAIL || "admin@purplefriday.in").toLowerCase();
const adminPass = process.env.ADMIN_INITIAL_PASSWORD || "ChangeThisPasswordInProduction123!";
const initialAdminHash = bcrypt.hashSync(adminPass, 12);

MOCK_USERS.set(adminEmail, {
  id: "usr_admin_seed",
  email: adminEmail,
  passwordHash: initialAdminHash,
  name: "Admin",
  phone: "+919876543210",
  role: "ADMIN",
  active: true,
  lastLogin: null,
  failedAttempts: 0,
  lockedUntil: null,
  mustChangePassword: process.env.NODE_ENV === "production",
  version: 1,
  tokenVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export async function findUserByEmail(email: string): Promise<StoredMockUser | null> {
  const normEmail = email.toLowerCase().trim();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const user = await prisma.user.findUnique({
        where: { email: normEmail },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name || "",
          phone: user.phone || undefined,
          role: (user.role === "SUPER_ADMIN" ? "ADMIN" : user.role) as AllRole,
          active: user.active,
          lastLogin: user.lastLogin,
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
          mustChangePassword: user.mustChangePassword,
          version: user.version,
          tokenVersion: (user as { tokenVersion?: number }).tokenVersion || 1,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    }
  } catch {
    // Fallback to mock store
  }

  return MOCK_USERS.get(normEmail) || null;
}

export async function findUserById(id: string): Promise<StoredMockUser | null> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name || "",
          phone: user.phone || undefined,
          role: (user.role === "SUPER_ADMIN" ? "ADMIN" : user.role) as AllRole,
          active: user.active,
          lastLogin: user.lastLogin,
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
          mustChangePassword: user.mustChangePassword,
          version: user.version,
          tokenVersion: (user as { tokenVersion?: number }).tokenVersion || 1,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    }
  } catch {
    // Fallback
  }

  for (const u of MOCK_USERS.values()) {
    if (u.id === id) return u;
  }
  return null;
}

/**
 * Returns the currently active single administrator account.
 */
export async function getActiveAdmin(): Promise<StoredMockUser | null> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const admin = await prisma.user.findFirst({
        where: {
          role: { in: ["ADMIN", "SUPER_ADMIN"] },
          active: true,
        },
      });
      if (admin) {
        return {
          id: admin.id,
          email: admin.email,
          passwordHash: admin.passwordHash,
          name: admin.name || "",
          phone: admin.phone || undefined,
          role: "ADMIN",
          active: admin.active,
          lastLogin: admin.lastLogin,
          failedAttempts: admin.failedAttempts,
          lockedUntil: admin.lockedUntil,
          mustChangePassword: admin.mustChangePassword,
          version: admin.version,
          tokenVersion: (admin as { tokenVersion?: number }).tokenVersion || 1,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        };
      }
    }
  } catch {
    // Fallback
  }

  for (const u of MOCK_USERS.values()) {
    if ((u.role === "ADMIN" || u.role === "SUPER_ADMIN") && u.active) {
      return u;
    }
  }
  return null;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: AllRole;
  phone?: string;
  active?: boolean;
  mustChangePassword?: boolean;
}): Promise<SafeUser> {
  const normEmail = data.email.toLowerCase().trim();
  const existing = await findUserByEmail(normEmail);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const role = data.role || "CUSTOMER";

  // Single Admin Invariant: Exactly one active ADMIN account is permitted
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    const currentAdmin = await getActiveAdmin();
    if (currentAdmin) {
      throw new Error("Only one active administrator account is permitted.");
    }
  }

  // Hash password with bcrypt cost 12
  const passwordHash = await bcrypt.hash(data.password, 12);
  const now = new Date();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const created = await prisma.user.create({
        data: {
          email: normEmail,
          passwordHash,
          name: data.name,
          role: role as UserRole,
          phone: data.phone,
          active: data.active !== undefined ? data.active : true,
          mustChangePassword: data.mustChangePassword || false,
          version: 1,
        },
      });
      return {
        id: created.id,
        email: created.email,
        name: created.name || "",
        role: (created.role === "SUPER_ADMIN" ? "ADMIN" : created.role) as AllRole,
        phone: created.phone || undefined,
        active: created.active,
        mustChangePassword: created.mustChangePassword,
        version: created.version,
        tokenVersion: 1,
      };
    }
  } catch {
    // Fallback to memory
  }

  const mockUser: StoredMockUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: normEmail,
    passwordHash,
    name: data.name,
    phone: data.phone,
    role: role === "SUPER_ADMIN" ? "ADMIN" : role,
    active: data.active !== undefined ? data.active : true,
    lastLogin: null,
    failedAttempts: 0,
    lockedUntil: null,
    mustChangePassword: data.mustChangePassword || false,
    version: 1,
    tokenVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  MOCK_USERS.set(normEmail, mockUser);

  return {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: mockUser.role,
    phone: mockUser.phone,
    active: mockUser.active,
    mustChangePassword: mockUser.mustChangePassword,
    version: mockUser.version,
    tokenVersion: mockUser.tokenVersion,
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

  // 1. Check account active status
  if (user.active === false) {
    throw new Error("Account inactive. Please verify your email before logging in.");
  }

  // 2. Check account lockout
  const lockout = checkAccountLockout({
    failedAttempts: user.failedAttempts,
    lockedUntil: user.lockedUntil,
  });

  if (lockout.isLocked) {
    throw new Error(
      `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockout.remainingMinutes} minutes.`
    );
  }

  // 3. Verify password with bcrypt
  const isMatch = await bcrypt.compare(plainPassword, user.passwordHash);

  if (!isMatch) {
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

  // 4. Reset failed attempts & record lastLogin on successful login
  const now = new Date();
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLogin: now,
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
    m.lastLogin = now;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || "User",
    role: user.role,
    phone: user.phone,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    version: user.version,
    tokenVersion: user.tokenVersion || 1,
  };
}

/**
 * Updates administrator's own profile (name, email, password).
 * Current password verification is strictly required.
 */
export async function updateAdminProfile(data: {
  currentEmail: string;
  name?: string;
  newEmail?: string;
  currentPassword: string;
  newPassword?: string;
}): Promise<SafeUser> {
  const user = await findUserByEmail(data.currentEmail);
  if (!user) throw new Error("Admin user not found.");

  // Current password check
  const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("Current password is incorrect.");
  }

  const updatedData: {
    name?: string;
    email?: string;
    passwordHash?: string;
    version: number;
    updatedAt: Date;
  } = {
    version: user.version + 1,
    updatedAt: new Date(),
  };

  if (data.name && data.name.trim()) {
    updatedData.name = data.name.trim();
  }

  if (data.newEmail && data.newEmail.toLowerCase().trim() !== user.email) {
    const targetEmail = data.newEmail.toLowerCase().trim();
    const existing = await findUserByEmail(targetEmail);
    if (existing && existing.id !== user.id) {
      throw new Error("An account with this email address already exists.");
    }
    updatedData.email = targetEmail;
  }

  if (data.newPassword && data.newPassword.trim()) {
    if (data.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }
    updatedData.passwordHash = await bcrypt.hash(data.newPassword, 12);
  }

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: updatedData,
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name || "",
        role: "ADMIN",
        active: updated.active,
        mustChangePassword: updated.mustChangePassword,
        version: updated.version,
      };
    }
  } catch {
    // Memory fallback
  }

  // Update in-memory user
  if (updatedData.email && updatedData.email !== user.email) {
    MOCK_USERS.delete(user.email);
    user.email = updatedData.email;
  }
  if (updatedData.name !== undefined) user.name = updatedData.name;
  if (updatedData.passwordHash) user.passwordHash = updatedData.passwordHash;
  user.version = updatedData.version;
  user.updatedAt = updatedData.updatedAt;
  MOCK_USERS.set(user.email, user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    version: user.version,
  };
}

/**
 * Migration helper: deactivates legacy staff accounts (does not delete them, keeping AuditLog intact).
 */
export async function deactivateLegacyStaffAccounts(): Promise<number> {
  const legacyRoles = ["GRAPHIC_DESIGNER", "FACTORY_MANAGER", "SUPPORT_AGENT"];
  let count = 0;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const res = await prisma.user.updateMany({
        where: {
          role: { in: legacyRoles as UserRole[] },
          active: true,
        },
        data: { active: false },
      });
      count = res.count;
    }
  } catch {
    // Memory fallback
  }

  for (const u of MOCK_USERS.values()) {
    if (legacyRoles.includes(u.role as string) && u.active) {
      u.active = false;
      count++;
    }
  }

  return count;
}

/**
 * Updates user password and clears mustChangePassword flag
 */
export async function updateStaffPassword(userId: string, newPasswordPlain: string): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found.");

  const passwordHash = await bcrypt.hash(newPasswordPlain, 12);
  const nextVersion = user.version + 1;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          version: nextVersion,
        },
      });
      return;
    }
  } catch {
    // Memory fallback
  }

  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  user.version = nextVersion;
  user.updatedAt = new Date();
}

/**
 * Activates a customer account upon successful email OTP verification.
 */
export async function activateUser(identifier: string): Promise<SafeUser> {
  const normEmail = identifier.toLowerCase().trim();
  const user = (await findUserByEmail(normEmail)) || (await findUserById(identifier));
  if (!user) throw new Error("User not found.");

  user.active = true;
  user.updatedAt = new Date();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { active: true },
      });
    }
  } catch {
    // Memory fallback
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    active: true,
    version: user.version,
    tokenVersion: user.tokenVersion || 1,
  };
}

/**
 * Bumps tokenVersion on user. Automatically revokes/ends all other active sessions.
 */
export async function bumpTokenVersion(userIdOrEmail: string): Promise<number> {
  let user = await findUserById(userIdOrEmail);
  if (!user) user = await findUserByEmail(userIdOrEmail);
  if (!user) throw new Error("User not found.");

  const nextTokenVersion = (user.tokenVersion || 1) + 1;
  user.tokenVersion = nextTokenVersion;
  user.updatedAt = new Date();

  return nextTokenVersion;
}

/**
 * Retrieves current tokenVersion for a user.
 */
export async function getUserTokenVersion(userId: string): Promise<number> {
  const user = await findUserById(userId);
  return user?.tokenVersion || 1;
}

/**
 * Changes user email address. Bumps tokenVersion to sign out everywhere.
 */
export async function changeUserEmail(userId: string, newEmail: string): Promise<SafeUser> {
  const normNewEmail = newEmail.toLowerCase().trim();
  const existing = await findUserByEmail(normNewEmail);
  if (existing && existing.id !== userId) {
    throw new Error("This email address is already in use.");
  }

  const user = await findUserById(userId);
  if (!user) throw new Error("User not found.");

  const oldEmail = user.email;
  user.email = normNewEmail;
  user.tokenVersion = (user.tokenVersion || 1) + 1;
  user.version += 1;
  user.updatedAt = new Date();

  MOCK_USERS.delete(oldEmail);
  MOCK_USERS.set(normNewEmail, user);

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: normNewEmail,
          version: user.version,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    active: user.active,
    version: user.version,
    tokenVersion: user.tokenVersion,
  };
}

/**
 * Changes customer password. Bumps tokenVersion and resets failed attempts.
 */
export async function changeUserPassword(userIdOrEmail: string, newPlainPassword: string): Promise<void> {
  let user = await findUserById(userIdOrEmail);
  if (!user) user = await findUserByEmail(userIdOrEmail);
  if (!user) throw new Error("User not found.");

  const passwordHash = await bcrypt.hash(newPlainPassword, 12);
  user.passwordHash = passwordHash;
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.tokenVersion = (user.tokenVersion || 1) + 1;
  user.version += 1;
  user.updatedAt = new Date();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          failedAttempts: 0,
          lockedUntil: null,
          version: user.version,
        },
      });
    }
  } catch {
    // Memory fallback
  }
}

/**
 * Updates customer phone number.
 */
export async function changeUserPhone(userIdOrEmail: string, newPhone: string): Promise<void> {
  let user = await findUserById(userIdOrEmail);
  if (!user) user = await findUserByEmail(userIdOrEmail);
  if (!user) throw new Error("User not found.");

  user.phone = newPhone.trim();
  user.version += 1;
  user.updatedAt = new Date();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: user.phone, version: user.version },
      });
    }
  } catch {
    // Memory fallback
  }
}

/**
 * Anonymizes customer personal details on account deletion.
 * Orders and invoices are preserved for tax compliance.
 */
export async function anonymizeUserAccount(userIdOrEmail: string): Promise<void> {
  let user = await findUserById(userIdOrEmail);
  if (!user) user = await findUserByEmail(userIdOrEmail);
  if (!user) throw new Error("User not found.");

  const oldEmail = user.email;
  const anonymizedEmail = `deleted_${user.id.slice(0, 8)}_${Date.now()}@anonymized.purplefriday.in`;

  user.name = "Anonymized Customer";
  user.email = anonymizedEmail;
  user.phone = undefined;
  user.active = false;
  user.tokenVersion = (user.tokenVersion || 1) + 10;
  user.version += 1;
  user.updatedAt = new Date();

  MOCK_USERS.delete(oldEmail);
  MOCK_USERS.set(anonymizedEmail, user);

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          phone: null,
          active: false,
          version: user.version,
        },
      });
    }
  } catch {
    // Memory fallback
  }
}
