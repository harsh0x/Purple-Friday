import crypto from "crypto";
import { describe, it, expect } from "vitest";
import {
  hasPermission,
  requirePermission,
  getRoleHomeScreen,
  isStaffRole,
  AdminForbiddenError,
  ALL_PERMISSIONS,
  Permission,
} from "../lib/admin/permissions";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  SESSION_MAX_AGE_MS,
  IDLE_TIMEOUT_MS,
} from "../lib/admin/admin-session";
import { recordFailedAttempt, checkAccountLockout } from "../lib/security/auth-policy";
import { writeAudit, hashIp } from "../lib/admin/audit";

describe("Admin RBAC & Roles Matrix", () => {
  it("SUPER_ADMIN must have every permission without exception", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission("SUPER_ADMIN", perm)).toBe(true);
      expect(() => requirePermission("SUPER_ADMIN", perm)).not.toThrow();
    }
    expect(isStaffRole("SUPER_ADMIN")).toBe(true);
    expect(getRoleHomeScreen("SUPER_ADMIN")).toBe("/admin");
  });

  it("Legacy ADMIN role maps to full administrative permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission("ADMIN", perm)).toBe(true);
    }
    expect(isStaffRole("ADMIN")).toBe(true);
    expect(getRoleHomeScreen("ADMIN")).toBe("/admin");
  });

  it("GRAPHIC_DESIGNER can manage proofs but CANNOT access prices, financials, settings, or team", () => {
    const role = "GRAPHIC_DESIGNER";
    expect(hasPermission(role, "admin:manage_proofs")).toBe(true);
    expect(() => requirePermission(role, "admin:manage_proofs")).not.toThrow();

    // Strictly forbidden permissions
    const forbidden: Permission[] = [
      "admin:view_overview",
      "admin:manage_pricing",
      "admin:manage_products",
      "admin:manage_team",
      "admin:manage_settings",
      "admin:manage_integrations",
      "admin:view_audit",
    ];

    for (const perm of forbidden) {
      expect(hasPermission(role, perm)).toBe(false);
      expect(() => requirePermission(role, perm)).toThrow(AdminForbiddenError);
    }

    expect(isStaffRole(role)).toBe(true);
    expect(getRoleHomeScreen(role)).toBe("/admin/designs");
  });

  it("FACTORY_MANAGER can manage production and dispatch but CANNOT view prices, payments, or team", () => {
    const role = "FACTORY_MANAGER";
    expect(hasPermission(role, "admin:manage_production")).toBe(true);
    expect(hasPermission(role, "admin:manage_dispatch")).toBe(true);

    const forbidden: Permission[] = [
      "admin:view_overview",
      "admin:manage_pricing",
      "admin:manage_team",
      "admin:manage_settings",
      "admin:view_audit",
      "admin:manage_quotes",
    ];

    for (const perm of forbidden) {
      expect(hasPermission(role, perm)).toBe(false);
      expect(() => requirePermission(role, perm)).toThrow(AdminForbiddenError);
    }

    expect(isStaffRole(role)).toBe(true);
    expect(getRoleHomeScreen(role)).toBe("/admin/production");
  });

  it("SUPPORT_AGENT can read orders, manage orders, and moderate reviews, but CANNOT edit prices, products, or roles", () => {
    const role = "SUPPORT_AGENT";
    expect(hasPermission(role, "admin:view_orders")).toBe(true);
    expect(hasPermission(role, "admin:manage_orders")).toBe(true);
    expect(hasPermission(role, "admin:moderate_reviews")).toBe(true);

    const forbidden: Permission[] = [
      "admin:view_overview",
      "admin:manage_pricing",
      "admin:manage_products",
      "admin:manage_team",
      "admin:manage_settings",
      "admin:view_audit",
    ];

    for (const perm of forbidden) {
      expect(hasPermission(role, perm)).toBe(false);
      expect(() => requirePermission(role, perm)).toThrow(AdminForbiddenError);
    }

    expect(isStaffRole(role)).toBe(true);
    expect(getRoleHomeScreen(role)).toBe("/admin/support");
  });

  it("CUSTOMER has zero admin permissions and can NEVER open /admin", () => {
    const role = "CUSTOMER";
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission(role, perm)).toBe(false);
      expect(() => requirePermission(role, perm)).toThrow(AdminForbiddenError);
    }
    expect(isStaffRole(role)).toBe(false);
    expect(getRoleHomeScreen(role)).toBe("/");
  });
});

describe("Admin Authentication, Lockout & Session Lifecycle", () => {
  it("enforces 5 failed attempts lockout for 15 minutes", () => {
    let attempts = 0;
    for (let i = 1; i <= 4; i++) {
      const res = recordFailedAttempt(attempts);
      attempts = res.failedAttempts;
      expect(res.isNowLocked).toBe(false);
    }

    // 5th attempt triggers 15-minute lock
    const finalAttempt = recordFailedAttempt(attempts);
    expect(finalAttempt.isNowLocked).toBe(true);
    expect(finalAttempt.lockedUntil).not.toBeNull();

    const lockStatus = checkAccountLockout({
      failedAttempts: finalAttempt.failedAttempts,
      lockedUntil: finalAttempt.lockedUntil,
    });
    expect(lockStatus.isLocked).toBe(true);
    expect(lockStatus.remainingMinutes).toBeGreaterThanOrEqual(14);
  });

  it("generates and verifies valid admin session tokens", () => {
    const token = createAdminSessionToken({
      id: "usr_admin_1",
      email: "designer@purplefriday.in",
      name: "Lead Designer",
      role: "GRAPHIC_DESIGNER",
    });

    const result = verifyAdminSessionToken(token);
    expect(result.valid).toBe(true);
    expect(result.session?.role).toBe("GRAPHIC_DESIGNER");
    expect(result.session?.email).toBe("designer@purplefriday.in");
  });

  it("rejects session tokens exceeding 8 hours max lifetime", () => {
    const now = Date.now();
    // Forge token past 8 hours
    const payload = {
      userId: "usr_superadmin",
      email: "admin@purplefriday.in",
      name: "Super Admin",
      role: "SUPER_ADMIN" as const,
      mustChangePassword: false,
      issuedAt: now - SESSION_MAX_AGE_MS - 1000,
      expiresAt: now - 1000,
      lastActive: now,
    };

    const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const secret = process.env.NEXTAUTH_SECRET || "pf_super_secret_jwt_key_2026_dev_fallback";
    const sig = crypto.createHmac("sha256", secret).update(serialized).digest("base64url");
    const expiredToken = `${serialized}.${sig}`;

    const result = verifyAdminSessionToken(expiredToken);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("8-hour cap");
  });

  it("rejects session tokens idle for more than 30 minutes", () => {
    const now = Date.now();
    const payload = {
      userId: "usr_agent",
      email: "support@purplefriday.in",
      name: "Support Staff",
      role: "SUPPORT_AGENT" as const,
      mustChangePassword: false,
      issuedAt: now - 60 * 60 * 1000,
      expiresAt: now + 7 * 60 * 60 * 1000,
      lastActive: now - IDLE_TIMEOUT_MS - 5000, // 30 mins + 5s idle
    };

    const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const secret = process.env.NEXTAUTH_SECRET || "pf_super_secret_jwt_key_2026_dev_fallback";
    const sig = crypto.createHmac("sha256", secret).update(serialized).digest("base64url");
    const idleToken = `${serialized}.${sig}`;

    const result = verifyAdminSessionToken(idleToken);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("inactivity");
  });

  it("rejects session tokens containing CUSTOMER role", () => {
    const token = createAdminSessionToken({
      id: "usr_cust_1",
      email: "customer@example.com",
      name: "John Doe",
      role: "CUSTOMER",
    });

    const result = verifyAdminSessionToken(token);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Customer");
  });
});

describe("Audit Logging & Immutability", () => {
  it("anonymizes IP address deterministically", () => {
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("192.168.1.1");
    const hash3 = hashIp("10.0.0.1");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(16);
  });

  it("creates immutable audit record with actor, role, action, and before/after summaries", async () => {
    const log = await writeAudit({
      actor: "admin@purplefriday.in",
      actorRole: "SUPER_ADMIN",
      action: "team.update_role",
      entityType: "STAFF_USER",
      entityId: "usr_staff_42",
      before: { role: "SUPPORT_AGENT" },
      after: { role: "GRAPHIC_DESIGNER" },
      ipAddress: "122.161.45.10",
    });

    expect(log.id).toBeDefined();
    expect(log.actor).toBe("admin@purplefriday.in");
    expect(log.actorRole).toBe("SUPER_ADMIN");
    expect(log.action).toBe("team.update_role");
    expect(log.entityType).toBe("STAFF_USER");
    expect(log.entityId).toBe("usr_staff_42");
    expect(log.before).toEqual({ role: "SUPPORT_AGENT" });
    expect(log.after).toEqual({ role: "GRAPHIC_DESIGNER" });
    expect(log.ipHash).toBeDefined();
  });
});
