"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Check,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { AdminThemeToggle } from "./AdminThemeToggle";

interface AdminTopBarProps {
  userName?: string | null;
  userRole?: string | null;
  onOpenMobileMenu?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  readTime?: string | null;
  createdAt: string;
}

export function AdminTopBar({
  userName = "Staff Member",
  userRole = "SUPER_ADMIN",
  onOpenMobileMenu,
}: AdminTopBarProps) {
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Soft fail
      }
    }
    loadNotifications();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readTime: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Soft fail
    }
  }

  return (
    <>
      <header className="m-4 mb-0 px-4 sm:px-6 py-3.5 bg-[#15101F]/80 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg flex items-center justify-between gap-4 text-white">
        {/* Left: Mobile trigger & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Wide search trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#1C1628] border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-xs font-sans group shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#CDB8FF] group-hover:text-white transition-colors" />
              <span>Search people, orders, catalogue, audit...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-mono text-white/60">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Round icon buttons, theme toggle and user menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Theme Mode Toggle */}
          <AdminThemeToggle />

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserMenuOpen(false);
              }}
              className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#6A2CFF] text-[10px] font-mono font-bold text-white flex items-center justify-center border-2 border-[#15101F]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#1C1628] border border-white/15 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#6A2CFF]/30 text-[#CDB8FF] text-[10px]">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-mono text-[#D8FF3F] hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-white/40">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border transition-colors ${
                          !n.readTime
                            ? "bg-white/5 border-[#6A2CFF]/40 text-white"
                            : "bg-transparent border-white/5 text-white/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold">{n.title}</div>
                          {!n.readTime && (
                            <span className="w-2 h-2 rounded-full bg-[#6A2CFF] shrink-0 mt-1" />
                          )}
                        </div>
                        <div className="text-xs text-[#DDD4E6]/80 mt-1 font-sans">{n.body}</div>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setNotificationsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#CDB8FF] hover:underline mt-2"
                          >
                            <span>Open destination</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 text-center">
                  <Link
                    href="/admin/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-mono text-[#CDB8FF] hover:text-white"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-full bg-[#6A2CFF] text-white font-mono text-xs font-bold flex items-center justify-center">
                {userName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden sm:block text-left text-xs pr-1">
                <div className="font-semibold text-white truncate max-w-[120px]">{userName}</div>
                <div className="text-[10px] font-mono text-[#D8FF3F] uppercase tracking-wide">
                  {userRole}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#1C1628] border border-white/15 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/10">
                  <div className="text-xs font-bold text-white truncate">{userName}</div>
                  <div className="text-[10px] font-mono text-[#D8FF3F] uppercase tracking-wide">
                    {userRole}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-rose-300 hover:text-rose-100 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Log Out Securely</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        userRole={userRole}
      />
    </>
  );
}
