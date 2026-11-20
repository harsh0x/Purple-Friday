"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { PageTransition } from "@/components/admin/PageTransition";

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#6A2CFF]" />
              <h1 className="font-display font-black text-2xl text-[#15101F] tracking-tight">
                Notifications & Broadcasts
              </h1>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Role-Targeted Alerts • SLA Reminders • {unreadCount} Unread
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadNotifications}
              className="p-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2] transition-colors"
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

        {/* Notifications List Card */}
        <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden divide-y divide-[#15101F]/5">
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-[#15101F]/50">
              Loading notification feed...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-[#15101F]/50">
              No notifications to display.
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.readTime;
              return (
                <div
                  key={n.id}
                  className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isUnread ? "bg-[#FAF7F2]" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        isUnread ? "bg-[#6A2CFF] shadow-sm shadow-[#6A2CFF]/50" : "bg-transparent"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#15101F]">{n.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#15101F]/5 text-[10px] font-mono text-[#15101F]/60">
                          {n.userOrRole}
                        </span>
                      </div>
                      <p className="text-xs text-[#15101F]/70 font-sans mt-1 max-w-xl">{n.body}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-[#15101F]/40">
                        <span>{formatIndiaDateTime(n.createdAt)}</span>
                        {n.link && (
                          <Link
                            href={n.link}
                            className="text-[#6A2CFF] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#15101F]/15 font-mono text-xs text-[#15101F] hover:bg-[#F5F0E8] transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageTransition>
  );
}
