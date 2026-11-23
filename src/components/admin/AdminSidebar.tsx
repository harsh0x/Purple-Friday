"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAVIGATION } from "@/lib/admin/navigation";
import { useAdminTheme } from "./AdminThemeContext";
import { X, ArrowUpRight } from "lucide-react";

interface AdminSidebarProps {
  userRole?: string | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { transparentSidebar } = useAdminTheme();

  const sidebarContent = (
      <div className="flex flex-col h-full justify-between overflow-hidden">
        {/* Brand & Store Header */}
        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-sans font-black text-xl text-[#F4F3F8] tracking-tight group"
            >
              <span className="w-3 h-3 rounded-full bg-[#D9F99D] shadow-sm animate-pulse" />
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

          <div className="text-xs font-sans font-medium text-[#9E98B3] pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
            <span>Admin Portal</span>
            <span className="text-[#D9F99D] font-semibold">Store Management</span>
          </div>

          {/* Grouped Navigation: The single scrolling container in sidebar */}
          <nav className="flex-1 min-h-0 space-y-5 overflow-y-auto pr-1.5 admin-sidebar-scroll">
            {ADMIN_NAVIGATION.map((section) => {
              return (
                <div key={section.id} className="space-y-1.5">
                  <div className="px-3 text-[11px] font-sans uppercase tracking-wider text-[#9E98B3] font-bold">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                      {
                        section.items.map((item) => {
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
                              className={`flex items-center justify-between px-3.5 py-2 rounded-2xl text-[13px] font-sans transition-all duration-200 ${isActive
                                  ? "bg-[#7C3AED] text-white font-semibold shadow-md shadow-[#7C3AED]/30 translate-x-1"
                                  : "text-[#F4F3F8]/80 hover:text-white hover:bg-white/5 font-medium"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon
                                  className={`w-4 h-4 transition-colors shrink-0 ${isActive ? "text-white" : "text-[#CDB8FF]"
                                    }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-bold ${isActive ? "bg-white text-[#7C3AED]" : "bg-[#7C3AED] text-white"
                                    }`}
                                >
                                  {item.badgeCount}
                                </span>
                              )}
                            </Link>
                          );
                        })
                      }
                </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Pinned Bottom Block */}
        <div className="pt-4 border-t border-white/10 space-y-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-sans font-medium text-[#CDB8FF] hover:text-[#D9F99D] hover:bg-white/5 transition-colors"
          >
            <span>View Public Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      );

      return (
      <>
        {/* Desktop Floating Rounded Sidebar - 100dvh with single scrolling nav */}
        <aside
          className={`hidden md:flex flex-col w-64 lg:w-72 shrink-0 m-4 p-5 rounded-3xl transition-all duration-300 sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden z-30 text-white ${transparentSidebar ? "admin-sidebar-liquid-glass" : "admin-sidebar-solid"
            }`}
        >
          {sidebarContent}
        </aside>

            {/* Mobile / Tablet Drawer */}
            {isOpenMobile && (
              <div
                className="fixed inset-0 z-50 md:hidden bg-[#0F0D15]/80 backdrop-blur-sm"
                  onClick={onCloseMobile}
                >
                  <div
                    className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] h-[100dvh] p-6 shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200 text-white ${transparentSidebar ? "admin-sidebar-liquid-glass" : "admin-sidebar-solid"
                      }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                {sidebarContent}
              </div>
        </div>
      )}
    </>
  );
}
