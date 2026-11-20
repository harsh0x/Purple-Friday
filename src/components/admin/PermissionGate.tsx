"use client";

import React from "react";
import { Permission, hasPermission } from "@/lib/admin/permissions";

interface PermissionGateProps {
  permission: Permission;
  role?: string | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * UI Component Guard: Renders children only if current user has the specified permission.
 * Remember: Server checks are always required on actions and API routes.
 */
export function PermissionGate({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGateProps) {
  if (!role || !hasPermission(role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
