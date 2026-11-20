import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  Factory,
  Truck,
  Navigation,
  CreditCard,
  Package,
  Boxes,
  Layers,
  FileText,
  Tag,
  Users,
  ScrollText,
  Settings,
  BarChart3,
  Percent,
  Contact,
  CalendarClock,
  Star,
  LifeBuoy,
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
 * In Part 5: Analytics, Margin, Customers, Forecasting, Reviews, and Support are now active.
 */
export const ADMIN_NAVIGATION: NavSection[] = [
  {
    id: "overview",
    label: "Overview & Intelligence",
    items: [
      {
        id: "overview-dashboard",
        label: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        permission: "admin:view_overview",
      },
      {
        id: "overview-analytics",
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        permission: "admin:view_overview",
      },
      {
        id: "overview-margin",
        label: "True Net Margin",
        href: "/admin/margin",
        icon: Percent,
        permission: "admin:manage_pricing",
      },
      {
        id: "overview-customers",
        label: "Customers & RFM",
        href: "/admin/customers",
        icon: Contact,
        permission: "admin:view_orders",
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
      {
        id: "pipeline-quotes",
        label: "Quotes",
        href: "/admin/quotes",
        icon: FileText,
        permission: "admin:view_orders",
      },
      {
        id: "pipeline-dispatch",
        label: "Dispatch",
        href: "/admin/dispatch",
        icon: Truck,
        permission: "admin:manage_dispatch",
      },
      {
        id: "pipeline-shipments",
        label: "Shipments",
        href: "/admin/shipments",
        icon: Navigation,
        permission: "admin:manage_dispatch",
      },
      {
        id: "pipeline-payments",
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
        permission: "admin:manage_pricing",
      },
      {
        id: "pipeline-support",
        label: "Support Desk",
        href: "/admin/support",
        icon: LifeBuoy,
        permission: "admin:view_orders",
      },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue & Inventory",
    items: [
      {
        id: "catalogue-products",
        label: "Products",
        href: "/admin/products",
        icon: Package,
        permission: "admin:manage_products",
      },
      {
        id: "catalogue-inventory",
        label: "Inventory",
        href: "/admin/inventory",
        icon: Boxes,
        permission: "admin:manage_products",
      },
      {
        id: "catalogue-forecasting",
        label: "Forecasting",
        href: "/admin/forecasting",
        icon: CalendarClock,
        permission: "admin:manage_products",
      },
      {
        id: "catalogue-kits",
        label: "Kits",
        href: "/admin/kits",
        icon: Layers,
        permission: "admin:manage_products",
      },
      {
        id: "catalogue-coupons",
        label: "Coupons",
        href: "/admin/coupons",
        icon: Tag,
        permission: "admin:manage_products",
      },
      {
        id: "catalogue-reviews",
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star,
        permission: "admin:moderate_reviews",
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
