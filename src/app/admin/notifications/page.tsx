"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  RotateCcw,
  Search,
} from "lucide-react";
import { PageTransition } from "@/components/admin/PageTransition";
import { useAdminTheme } from "@/components/admin/AdminThemeContext";

interface NotificationItem {
  id: string;
  userOrRole: string;
  title: string;
  body: string;
  link?: string | null;
  readTime?: string | null;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === "dark";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "ORDERS" | "CUSTOMERS" | "REVIEWS_QUOTES" | "SYSTEM"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed to load notifications.");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_READ", id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readTime: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Soft fail
    }
  }

  async function handleMarkAllRead() {
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

  function formatIndiaDateTime(isoString: string): string {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Status filter
      if (statusFilter === "UNREAD" && n.readTime) return false;

      // Category filter
      if (categoryFilter === "ORDERS") {
        const isOrder =
          n.title.toLowerCase().includes("order") ||
          n.title.toLowerCase().includes("proof") ||
          (n.link && n.link.includes("/admin/orders"));
        if (!isOrder) return false;
      } else if (categoryFilter === "CUSTOMERS") {
        const isCustomer =
          n.title.toLowerCase().includes("customer") ||
          n.title.toLowerCase().includes("registration") ||
          (n.link && n.link.includes("/admin/customers"));
        if (!isCustomer) return false;
      } else if (categoryFilter === "REVIEWS_QUOTES") {
        const isReviewOrQuote =
          n.title.toLowerCase().includes("review") ||
          n.title.toLowerCase().includes("quote") ||
          (n.link && (n.link.includes("/admin/reviews") || n.link.includes("/admin/quotes")));
        if (!isReviewOrQuote) return false;
      } else if (categoryFilter === "SYSTEM") {
        const isSystem =
          n.title.toLowerCase().includes("stock") ||
          n.title.toLowerCase().includes("system") ||
          (n.link && n.link.includes("/admin/products"));
        if (!isSystem) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      }

      return true;
    });
  }, [notifications, statusFilter, categoryFilter, searchQuery]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#6A2CFF]" />
              <h1
                className={`font-display font-black text-2xl tracking-tight ${isDark ? "text-white" : "text-[#15101F]"
                  }`}
              >
                Notifications & Broadcasts
              </h1>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Role-Targeted Alerts • Real-Time Operational Stream • {unreadCount} Unread
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadNotifications}
              className={`p-2.5 rounded-2xl border transition-colors ${isDark
                ? "bg-[#1C1628] border-white/10 text-white hover:bg-white/10"
                : "bg-white border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2]"
                }`}
              title="Refresh notifications"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31] transition-colors shadow-sm"
              >
                <CheckCheck className="w-4 h-4 text-[#D8FF3F]" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Filters Strip */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "ALL", label: "All Events" },
              { key: "ORDERS", label: "Orders & Proofs" },
              { key: "CUSTOMERS", label: "Customers" },
              { key: "REVIEWS_QUOTES", label: "Reviews & Quotes" },
              { key: "SYSTEM", label: "Stock & System" },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key as typeof categoryFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${categoryFilter === cat.key
                  ? "bg-[#6A2CFF] text-white font-bold"
                  : isDark
                    ? "bg-[#1C1628] border border-white/10 text-white/70 hover:text-white"
                    : "bg-white border border-[#15101F]/10 text-[#15101F]/70 hover:text-[#15101F]"
                  }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

            <button
              onClick={() => setStatusFilter(statusFilter === "ALL" ? "UNREAD" : "ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${statusFilter === "UNREAD"
                ? "bg-amber-600 text-white font-bold"
                : isDark
                  ? "bg-[#1C1628] border border-white/10 text-white/70 hover:text-white"
                  : "bg-white border border-[#15101F]/10 text-[#15101F]/70 hover:text-[#15101F]"
                }`}
            >
              {statusFilter === "UNREAD" ? "Showing Unread" : "Unread Only"}
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none ${isDark
                ? "bg-[#1C1628] border-white/10 text-white placeholder-white/30 focus:border-[#6A2CFF]"
                : "bg-white border-[#15101F]/15 text-[#15101F] placeholder-[#15101F]/40 focus:border-[#6A2CFF]"
                }`}
            />
          </div>
        </div>

        {/* Notifications List Card */}
        <div
          className={`rounded-3xl border shadow-sm overflow-hidden divide-y ${isDark
            ? "bg-[#15101F] border-white/10 divide-white/5"
            : "bg-white border-[#15101F]/10 divide-[#15101F]/5"
            }`}
        >
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-white/50">
              Loading notification feed...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-white/50">
              No notifications matching your filters.
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isUnread = !n.readTime;
              return (
                <div
                  key={n.id}
                          className={`p - 4 rounded - 2xl border flex flex - col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isUnread
              ? isDark
                ? "bg-[#1F192E] border-pf-violet/30"
                : "bg-[#FAF7F2] border-pf-violet/30"
              : isDark
                ? "bg-[#15101F] border-white/10"
                : "bg-white border-[#15101F]/10"
          }`}
                        >
          <div className="flex items-start gap-3.5">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${isUnread ? "bg-[#6A2CFF]" : "bg-transparent border border-white/20"
                }`
              }
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-display font-bold text-sm ${isDark ? "text-white" : "text-[#15101F]"
                    }`}
                >
                  {n.title}
                </span>
                {isUnread && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6A2CFF]/15 text-[#6A2CFF]">
                    NEW
                  </span>
                )}
              </div>
              <p
                className={`text-xs max-w-2xl leading-relaxed ${isDark ? "text-white/70" : "text-[#15101F]/70"
                  }`}
              >
                {n.body}
              </p>
              <div className="flex items-center gap-3 text-[11px] font-mono text-white/40 pt-1">
                <span>{formatIndiaDateTime(n.createdAt)}</span>
                {n.readTime && <span>• Read</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {isUnread && (
              <button
                onClick={() => handleMarkRead(n.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${isDark
                  ? "border-white/10 hover:bg-white/10 text-white/80"
                  : "border-[#15101F]/15 hover:bg-[#FAF7F2] text-[#15101F]"
                  }`}
                title="Mark as read"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Read</span>
              </button>
            )}
            {n.link && (
              <Link
                href={n.link}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6A2CFF] hover:bg-[#7C3AED] text-white text-xs font-mono font-bold transition-all shadow-sm"
              >
                <span>View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
        );
            })
          )}
      </div>
    </div>
    </PageTransition >
          );
}
