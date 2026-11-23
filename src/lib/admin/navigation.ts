import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Star,
  Users,
  Tag,
  FileText,
  Settings,
  ScrollText,
  Globe,
  BookOpen,
  Image as ImageIcon,
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
  label: string;
  items: NavItem[];
}

/**
 * Single Admin Navigation Registry.
 * Only the core client admin stations are exposed.
 */
export const ADMIN_NAVIGATION: NavSection[] = [
  {
    id: "core",
    label: "Store",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        id: "orders",
        label: "Orders",
        href: "/admin/orders",
        icon: ShoppingBag,
      },
      {
        id: "products",
        label: "Products",
        href: "/admin/products",
        icon: Package,
      },
      {
        id: "categories",
        label: "Categories",
        href: "/admin/categories",
        icon: Layers,
      },
      {
        id: "reviews",
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star,
      },
      {
        id: "customers",
        label: "Customers",
        href: "/admin/customers",
        icon: Users,
      },
      {
        id: "coupons",
        label: "Coupons",
        href: "/admin/coupons",
        icon: Tag,
      },
      {
        id: "quotes",
        label: "Quotes",
        href: "/admin/quotes",
        icon: FileText,
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      {
        id: "cms",
        label: "Storefront CMS",
        href: "/admin/cms",
        icon: Globe,
      },
      {
        id: "pages",
        label: "Pages",
        href: "/admin/pages",
        icon: FileText,
      },
      {
        id: "blog",
        label: "Blog",
        href: "/admin/blog",
        icon: BookOpen,
      },
      {
        id: "media",
        label: "Media Library",
        href: "/admin/media",
        icon: ImageIcon,
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
      {
        id: "audit",
        label: "Activity Log",
        href: "/admin/audit",
        icon: ScrollText,
      },
    ],
  },
];
