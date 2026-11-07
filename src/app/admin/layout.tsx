import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import {
  BarChart3,
  Package,
  Layers,
  Tag,
  Star,
  FileQuestion,
  ArrowUpRight,
  Settings,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    redirect("/auth/login?error=Forbidden");
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: BarChart3 },
    { label: "Orders", href: "/admin/orders", icon: Package },
    { label: "Products & Tiers", href: "/admin/products", icon: Layers },
    { label: "Coupons", href: "/admin/coupons", icon: Tag },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Quote Briefs", href: "/admin/quotes", icon: FileQuestion },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#110D1A] text-white flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#181324] border-r border-white/10 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pf-lime animate-pulse" />
            <Link href="/admin" className="font-display font-black text-xl text-white tracking-tight">
              PF <span className="text-pf-violet">ADMIN</span>
            </Link>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 pb-2 border-b border-white/10">
            Control Room • India Hub
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Icon className="w-4 h-4 text-pf-violet" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="text-xs font-mono text-white/50">
            Logged in as <span className="text-white font-bold">{session?.user?.name}</span>
          </div>

          <Link
            href="/"
            className="flex items-center justify-between text-xs font-mono text-pf-lime hover:underline"
          >
            <span>Visit Storefront</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Admin Workspace with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader userName={session?.user?.name} />
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
