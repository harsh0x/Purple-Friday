import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "./prisma";
import { checkAccountLockout, recordFailedAttempt } from "./security/auth-policy";

export type AdminRole = "SUPER_ADMIN" | "GRAPHIC_DESIGNER" | "FACTORY_MANAGER" | "SUPPORT_AGENT" | "ADMIN";
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
  createdAt: Date;
  updatedAt: Date;
}

const MOCK_USERS = new Map<string, StoredMockUser>();

// Seed default initial Super Admin user (idempotent)
const adminEmail = (process.env.ADMIN_EMAIL || "admin@purplefriday.in").toLowerCase();
const adminPass = process.env.ADMIN_INITIAL_PASSWORD || "ChangeThisPasswordInProduction123!";
const initialAdminHash = bcrypt.hashSync(adminPass, 12);

MOCK_USERS.set(adminEmail, {
  id: "usr_superadmin_seed",
  email: adminEmail,
  passwordHash: initialAdminHash,
  name: "Purple Friday Superadmin",
  phone: "+919876543210",
  role: "SUPER_ADMIN",
  active: true,
  lastLogin: null,
  failedAttempts: 0,
  lockedUntil: null,
  mustChangePassword: true, // Force password change on first login
  version: 1,
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
          role: user.role as AllRole,
          active: user.active,
          lastLogin: user.lastLogin,
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
          mustChangePassword: user.mustChangePassword,
          version: user.version,
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
          role: user.role as AllRole,
          active: user.active,
          lastLogin: user.lastLogin,
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
          mustChangePassword: user.mustChangePassword,
          version: user.version,
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

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: AllRole;
  phone?: string;
  mustChangePassword?: boolean;
}): Promise<SafeUser> {
  const normEmail = data.email.toLowerCase().trim();
  const existing = await findUserByEmail(normEmail);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  // Hash password with bcrypt cost 12
  const passwordHash = await bcrypt.hash(data.password, 12);
  const role = data.role || "CUSTOMER";
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
          active: true,
          mustChangePassword: data.mustChangePassword || false,
          version: 1,
        },
      });
      return {
        id: created.id,
        email: created.email,
        name: created.name || "",
        role: created.role as AllRole,
        phone: created.phone || undefined,
        active: created.active,
        mustChangePassword: created.mustChangePassword,
        version: created.version,
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
    role,
    active: true,
    lastLogin: null,
    failedAttempts: 0,
    lockedUntil: null,
    mustChangePassword: data.mustChangePassword || false,
    version: 1,
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
    throw new Error("This account has been deactivated. Please contact an administrator.");
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
  };
}

/**
 * List all staff members (non-CUSTOMER users)
 */
export async function getStaffMembers(): Promise<SafeUser[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ["SUPER_ADMIN", "GRAPHIC_DESIGNER", "FACTORY_MANAGER", "SUPPORT_AGENT", "ADMIN"] },
        },
        orderBy: { createdAt: "desc" },
      });

      return users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || "",
        role: u.role as AllRole,
        phone: u.phone || undefined,
        active: u.active,
        lastLogin: u.lastLogin,
        mustChangePassword: u.mustChangePassword,
        version: u.version,
      }));
    }
  } catch {
    // Fallback to memory
  }

  const staff: SafeUser[] = [];
  for (const u of MOCK_USERS.values()) {
    if (u.role !== "CUSTOMER") {
      staff.push({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        phone: u.phone,
        active: u.active,
        lastLogin: u.lastLogin,
        mustChangePassword: u.mustChangePassword,
        version: u.version,
      });
    }
  }
  return staff;
}

/**
 * Updates a staff member's role with optimistic concurrency check
 */
export async function updateStaffRole(userId: string, newRole: AdminRole, expectedVersion: number): Promise<SafeUser> {
  const user = await findUserById(userId);
  if (!user) throw new Error("Staff member not found.");
  if (user.version !== expectedVersion) {
    throw new Error("Someone else changed this record. Please refresh and try again.");
  }

  const nextVersion = user.version + 1;
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          role: newRole as UserRole,
          version: nextVersion,
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name || "",
        role: updated.role as AllRole,
        active: updated.active,
        mustChangePassword: updated.mustChangePassword,
        version: updated.version,
      };
    }
  } catch {
    // Memory fallback
  }

  user.role = newRole;
  user.version = nextVersion;
  user.updatedAt = new Date();
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
 * Deactivates or activates a staff user with optimistic concurrency check
 */
export async function toggleStaffActive(userId: string, active: boolean, expectedVersion: number): Promise<SafeUser> {
  const user = await findUserById(userId);
  if (!user) throw new Error("Staff member not found.");
  if (user.version !== expectedVersion) {
    throw new Error("Someone else changed this record. Please refresh and try again.");
  }

  const nextVersion = user.version + 1;
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          active,
          version: nextVersion,
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name || "",
        role: updated.role as AllRole,
        active: updated.active,
        mustChangePassword: updated.mustChangePassword,
        version: updated.version,
      };
    }
  } catch {
    // Memory fallback
  }

  user.active = active;
  user.version = nextVersion;
  user.updatedAt = new Date();
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
 * Forces a staff password reset on next login with optimistic concurrency check
 */
export async function forceStaffPasswordReset(userId: string, expectedVersion: number): Promise<SafeUser> {
  const user = await findUserById(userId);
  if (!user) throw new Error("Staff member not found.");
  if (user.version !== expectedVersion) {
    throw new Error("Someone else changed this record. Please refresh and try again.");
  }

  const nextVersion = user.version + 1;
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          mustChangePassword: true,
          version: nextVersion,
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name || "",
        role: updated.role as AllRole,
        active: updated.active,
        mustChangePassword: updated.mustChangePassword,
        version: updated.version,
      };
    }
  } catch {
    // Memory fallback
  }

  user.mustChangePassword = true;
  user.version = nextVersion;
  user.updatedAt = new Date();
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
 * Updates staff user password and clears mustChangePassword flag
 */
export async function updateStaffPassword(userId: string, newPasswordPlain: string): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw new Error("Staff member not found.");

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
