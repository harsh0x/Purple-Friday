import { AdminRole, AllRole } from "../auth-service";
export type { AdminRole, AllRole };

export type Permission =
  | "admin:view_overview"
  | "admin:manage_team"
  | "admin:view_audit"
  | "admin:manage_settings"
  | "admin:manage_integrations"
  | "admin:manage_products"
  | "admin:manage_pricing"
  | "admin:view_orders"
  | "admin:manage_orders"
  | "admin:manage_proofs"
  | "admin:manage_production"
  | "admin:manage_dispatch"
  | "admin:moderate_reviews"
  | "admin:manage_quotes"
  | "admin:manage_coupons";

export const ALL_PERMISSIONS: readonly Permission[] = [
  "admin:view_overview",
  "admin:manage_team",
  "admin:view_audit",
  "admin:manage_settings",
  "admin:manage_integrations",
  "admin:manage_products",
  "admin:manage_pricing",
  "admin:view_orders",
  "admin:manage_orders",
  "admin:manage_proofs",
  "admin:manage_production",
  "admin:manage_dispatch",
  "admin:moderate_reviews",
  "admin:manage_quotes",
  "admin:manage_coupons",
] as const;

/**
 * Strict Role-to-Permissions Mapping (Roles Matrix)
 */
export const ROLE_PERMISSIONS: Record<AllRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS, // Legacy compatibility alias for Super Admin
  GRAPHIC_DESIGNER: [
    "admin:manage_proofs",
  ],
  FACTORY_MANAGER: [
    "admin:manage_production",
    "admin:manage_dispatch",
  ],
  SUPPORT_AGENT: [
    "admin:view_orders",
    "admin:manage_orders",
    "admin:moderate_reviews",
  ],
  CUSTOMER: [],
};

/**
 * Returns the designated home screen route for each role
 */
export function getRoleHomeScreen(role?: string | null): string {
  if (!role) return "/admin/login";

  switch (role.toUpperCase()) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin";
    case "GRAPHIC_DESIGNER":
      return "/admin/designs";
    case "FACTORY_MANAGER":
      return "/admin/production";
    case "SUPPORT_AGENT":
      return "/admin/support";
    case "CUSTOMER":
    default:
      return "/";
  }
}

/**
 * Checks whether a given role holds a specific permission
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase() as AllRole;
  const perms = ROLE_PERMISSIONS[normalized] || [];
  return perms.includes(permission);
}

/**
 * Checks if a role is any staff member (non-customer)
 */
export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase();
  return ["SUPER_ADMIN", "ADMIN", "GRAPHIC_DESIGNER", "FACTORY_MANAGER", "SUPPORT_AGENT"].includes(normalized);
}

export class AdminForbiddenError extends Error {
  statusCode: number;
  requiredPermission: Permission;

  constructor(permission: Permission, message?: string) {
    super(message || `Forbidden: Missing required permission [${permission}].`);
    this.name = "AdminForbiddenError";
    this.statusCode = 403;
    this.requiredPermission = permission;
  }
}

/**
 * Server guard: throws an AdminForbiddenError if the actor lacks the required permission
 */
export function requirePermission(
  actor: { role?: string | null } | string | null | undefined,
  permission: Permission
): void {
  const role = typeof actor === "string" ? actor : actor?.role;
  if (!hasPermission(role, permission)) {
    throw new AdminForbiddenError(
      permission,
      `Access denied. Role "${role || "UNAUTHENTICATED"}" is not permitted to perform "${permission}".`
    );
  }
}
