import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  Factory,
  Users,
  ScrollText,
  Settings,
  LucideIcon,
} from "lucide-react";
import { Permission } from "./permissions";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  badgeCount?: number;
}

export interface NavSection {
  id: string;
  label: string; // Small uppercase DM Mono label
  items: NavItem[];
}

/**
 * Single Source of Truth Navigation Registry.
 * Strict Rule: A sidebar link appears ONLY when its page is finished.
 * In Part 1: Only Overview and System items that exist now are shown.
 */
export const ADMIN_NAVIGATION: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "overview-dashboard",
        label: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        permission: "admin:view_overview",
      },
    ],
  },
  {
    id: "pipeline",
    label: "Operations",
    items: [
      {
        id: "pipeline-orders",
        label: "Orders",
        href: "/admin/orders",
        icon: ShoppingBag,
        permission: "admin:view_orders",
      },
      {
        id: "pipeline-designs",
        label: "Design Approvals",
        href: "/admin/designs",
        icon: Palette,
        permission: "admin:manage_proofs",
      },
      {
        id: "pipeline-production",
        label: "Production",
        href: "/admin/production",
        icon: Factory,
        permission: "admin:manage_production",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "system-team",
        label: "Team & Roles",
        href: "/admin/team",
        icon: Users,
        permission: "admin:manage_team",
      },
      {
        id: "system-audit",
        label: "Audit Log",
        href: "/admin/audit",
        icon: ScrollText,
        permission: "admin:view_audit",
      },
      {
        id: "system-settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "admin:manage_settings",
      },
    ],
  },
];
