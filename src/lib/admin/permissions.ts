export type AdminRole = "ADMIN" | "SUPER_ADMIN";
export type AllRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

export type Permission = "admin:access" | "admin:manage";

export class AdminForbiddenError extends Error {
  statusCode: number;

  constructor(message?: string) {
    super(message || "Forbidden: Single Admin access required.");
    this.name = "AdminForbiddenError";
    this.statusCode = 403;
  }
}

/**
 * Checks if a role is the admin
 */
export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase();
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
}

export function hasPermission(role?: string | null, _permission?: string): boolean {
  void _permission;
  return isStaffRole(role);
}

/**
 * Server guard: throws an AdminForbiddenError if the actor is not an active Admin.
 * Exactly one admin exists on Purple Friday.
 */
export function requireAdmin(
  actor: { role?: string | null; active?: boolean } | string | null | undefined
): void {
  const role = typeof actor === "string" ? actor : actor?.role;
  const active = typeof actor === "object" && actor !== null && "active" in actor ? actor.active : true;

  if (!isStaffRole(role) || active === false) {
    throw new AdminForbiddenError("Access denied. Admin authorization required.");
  }
}

// Backward compatibility alias while migrating API callers
export function requirePermission(
  actor: { role?: string | null; active?: boolean } | string | null | undefined,
  _permission?: string
): void {
  void _permission;
  requireAdmin(actor);
}
