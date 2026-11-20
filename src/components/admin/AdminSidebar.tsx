"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAVIGATION } from "@/lib/admin/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import { X, ArrowUpRight, Activity } from "lucide-react";

interface AdminSidebarProps {
  userRole?: string | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  userRole,
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Brand & Hub Info */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-display font-black text-xl text-[#FAF7F2] tracking-tight group"
          >
            <span className="w-3 h-3 rounded-full bg-[#D8FF3F] shadow-sm animate-pulse" />
            <span>
              PF <span className="text-[#CDB8FF] group-hover:text-white transition-colors">ADMIN</span>
            </span>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="text-[11px] font-mono uppercase tracking-wider text-[#DDD4E6]/60 pb-3 border-b border-white/10 flex items-center justify-between">
          <span>Control Room</span>
          <span className="text-[#D8FF3F]">India Hub</span>
        </div>

        {/* Grouped Navigation */}
        <nav className="space-y-6 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
          {ADMIN_NAVIGATION.map((section) => {
            // Filter section items by role permission
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(userRole, item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1.5">
                <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#9F8CB8]/80 font-semibold">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          isActive
                            ? "bg-[#6A2CFF] text-white font-bold shadow-md shadow-[#6A2CFF]/30 translate-x-1"
                            : "text-[#DDD4E6]/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive ? "text-white" : "text-[#CDB8FF]"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isActive ? "bg-white text-[#6A2CFF]" : "bg-[#6A2CFF] text-white"
                            }`}
                          >
                            {item.badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Meter & Storefront Link */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        {/* Dispatch SLA Today Meter */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#DDD4E6]">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#D8FF3F]" />
              <span className="font-semibold uppercase tracking-wider">Dispatch SLA Today</span>
            </div>
            <span className="text-[#D8FF3F] font-bold">98.5%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6A2CFF] to-[#D8FF3F]"
              style={{ width: "98.5%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-[#9F8CB8]/70 flex justify-between">
            <span>Target: 95.0%</span>
            <span>All ateliers operational</span>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-mono text-[#CDB8FF] hover:text-[#D8FF3F] hover:bg-white/5 transition-colors"
        >
          <span>View Public Store</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Floating Rounded Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 m-4 p-5 bg-[#15101F]/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl text-white">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-[#15101F]/80 backdrop-blur-sm"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] p-6 bg-[#181224] border-r border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
