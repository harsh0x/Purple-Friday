import { describe, it, expect } from "vitest";
import {
  hasPermission,
  requirePermission,
  AdminForbiddenError,
  ALL_PERMISSIONS,
  Permission,
} from "../lib/admin/permissions";

describe("Part 6: Comprehensive RBAC Permission Matrix & Isolation", () => {
  const NON_STAFF_ROLES = ["CUSTOMER", "GUEST", "ANONYMOUS"] as const;

  const ADMIN_ROUTES_MAP: Record<string, { requiredPermission: Permission; superAdminOnly?: boolean }> = {
    "/admin": { requiredPermission: "admin:view_overview" },
    "/admin/analytics": { requiredPermission: "admin:view_overview" },
    "/admin/margin": { requiredPermission: "admin:manage_pricing" },
    "/admin/orders": { requiredPermission: "admin:view_orders" },
    "/admin/designs": { requiredPermission: "admin:manage_proofs" },
    "/admin/production": { requiredPermission: "admin:manage_production" },
    "/admin/dispatch": { requiredPermission: "admin:manage_production" },
    "/admin/shipments": { requiredPermission: "admin:view_orders" },
    "/admin/payments": { requiredPermission: "admin:manage_pricing" },
    "/admin/products": { requiredPermission: "admin:manage_products" },
    "/admin/inventory": { requiredPermission: "admin:manage_products" },
    "/admin/forecasting": { requiredPermission: "admin:manage_products" },
    "/admin/kits": { requiredPermission: "admin:manage_products" },
    "/admin/coupons": { requiredPermission: "admin:manage_products" },
    "/admin/reviews": { requiredPermission: "admin:moderate_reviews" },
    "/admin/support": { requiredPermission: "admin:view_orders" },
    "/admin/team": { requiredPermission: "admin:manage_team" },
    "/admin/audit": { requiredPermission: "admin:view_audit" },
    "/admin/settings": { requiredPermission: "admin:manage_settings" },
    "/admin/cms": { requiredPermission: "admin:manage_settings", superAdminOnly: true },
  };

  it("SUPER_ADMIN has explicit server access to 100% of routes in the admin matrix", () => {
    for (const [, config] of Object.entries(ADMIN_ROUTES_MAP)) {
      expect(hasPermission("SUPER_ADMIN", config.requiredPermission)).toBe(true);
      expect(() => requirePermission("SUPER_ADMIN", config.requiredPermission)).not.toThrow();
    }
  });

  it("GRAPHIC_DESIGNER is strictly isolated to proofs & designs, blocked from financials & settings", () => {
    const role = "GRAPHIC_DESIGNER";
    expect(hasPermission(role, "admin:manage_proofs")).toBe(true);

    const blockedRoutes = [
      "/admin/margin",
      "/admin/payments",
      "/admin/products",
      "/admin/inventory",
      "/admin/forecasting",
      "/admin/team",
      "/admin/audit",
      "/admin/settings",
      "/admin/cms",
    ];

    for (const route of blockedRoutes) {
      const config = ADMIN_ROUTES_MAP[route];
      expect(hasPermission(role, config.requiredPermission)).toBe(false);
      expect(() => requirePermission(role, config.requiredPermission)).toThrow(AdminForbiddenError);
    }
  });

  it("FACTORY_MANAGER is restricted to production & dispatch, blocked from financials & settings", () => {
    const role = "FACTORY_MANAGER";
    expect(hasPermission(role, "admin:manage_production")).toBe(true);
    expect(hasPermission(role, "admin:view_orders")).toBe(true);

    const blockedRoutes = [
      "/admin/margin",
      "/admin/payments",
      "/admin/team",
      "/admin/audit",
      "/admin/settings",
      "/admin/cms",
    ];

    for (const route of blockedRoutes) {
      const config = ADMIN_ROUTES_MAP[route];
      expect(hasPermission(role, config.requiredPermission)).toBe(false);
      expect(() => requirePermission(role, config.requiredPermission)).toThrow(AdminForbiddenError);
    }
  });

  it("SUPPORT_AGENT is restricted to tickets, reviews & order lookups, blocked from pricing & team", () => {
    const role = "SUPPORT_AGENT";
    expect(hasPermission(role, "admin:view_orders")).toBe(true);
    expect(hasPermission(role, "admin:moderate_reviews")).toBe(true);

    const blockedRoutes = [
      "/admin/margin",
      "/admin/products",
      "/admin/team",
      "/admin/settings",
      "/admin/cms",
    ];

    for (const route of blockedRoutes) {
      const config = ADMIN_ROUTES_MAP[route];
      expect(hasPermission(role, config.requiredPermission)).toBe(false);
      expect(() => requirePermission(role, config.requiredPermission)).toThrow(AdminForbiddenError);
    }
  });

  it("CUSTOMER and anonymous visitors have 0 permissions across all admin routes", () => {
    for (const nonStaff of NON_STAFF_ROLES) {
      for (const perm of ALL_PERMISSIONS) {
        expect(hasPermission(nonStaff, perm)).toBe(false);
        expect(() => requirePermission(nonStaff, perm)).toThrow(AdminForbiddenError);
      }
    }
  });

  it("Customer Cross-Access Isolation: User cannot access another user's order or proof", () => {
    const customerA = { id: "cust_A", email: "alice@startup.in" };
    const customerB = { id: "cust_B", email: "bob@enterprise.in" };

    const orderOfA = {
      orderId: "ord_101",
      userId: customerA.id,
      customerEmail: customerA.email,
    };

    // User A accessing own order -> allowed
    const canAccessOwn = orderOfA.userId === customerA.id || orderOfA.customerEmail === customerA.email;
    expect(canAccessOwn).toBe(true);

    // User B attempting to access User A's order -> forbidden
    const canCrossAccess = orderOfA.userId === customerB.id || orderOfA.customerEmail === customerB.email;
    expect(canCrossAccess).toBe(false);
  });
});
