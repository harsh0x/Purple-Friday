"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
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

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext blocked by browser autoplay policy
  }
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  const lastIdRef = useRef<string | null>(null);
  const unreadCountRef = useRef(0);

  // Sync ref
  useEffect(() => {
      unreadCountRef.current = unreadCount;
    }, [unreadCount]);

  // Load sound preference & browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("pf_admin_sound_alert");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "true");
      }
      if ("Notification" in window) {
        setBrowserPermission(Notification.permission);
      }
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("pf_admin_sound_alert", String(next));
      if (next) playNotificationChime();
      return next;
    });
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === "granted") {
        toast.success("Desktop alerts enabled for incoming operational events.");
      }
    }
  };

  const updateTabTitle = useCallback((count: number) => {
    if (typeof document !== "undefined") {
      document.title = count > 0 ? `(${count}) Purple Friday Admin` : "Purple Friday Admin";
    }
  }, []);

  // Poll for near real-time notifications
  const pollNotifications = useCallback(async () => {
    // Stop polling if the admin tab is currently hidden
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    try {
      const afterParam = lastIdRef.current ? `?after=${encodeURIComponent(lastIdRef.current)}` : "";
      const res = await fetch(`/api/admin/notifications${afterParam}`);
      if (!res.ok) return;

      const data = await res.json();
      const newItems: NotificationItem[] = data.notifications || [];
      const newUnread: number = typeof data.unreadCount === "number" ? data.unreadCount : 0;

      if (newItems.length > 0) {
        lastIdRef.current = newItems[0].id;

        // Show toast & sound & browser notification for each new item
        newItems.forEach((item) => {
          toast.info(item.title, {
            description: item.body,
            action: item.link
              ? {
                label: "View",
                onClick: () => router.push(item.link!),
              }
              : undefined,
          });

          if (soundEnabled) {
            playNotificationChime();
          }

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(item.title, {
                body: item.body,
                icon: "/favicon.ico",
              });
            } catch {
              // Notification creation blocked
            }
          }
        });

        setNotifications((prev) => {
          const merged = [...newItems, ...prev];
          return merged.slice(0, 10);
        });
      }

      setUnreadCount(newUnread);
      updateTabTitle(newUnread);
    } catch {
      // Soft polling failure
    }
  }, [router, soundEnabled, updateTabTitle]);

  // Initial load & Polling setup
  useEffect(() => {
    async function initialLoad() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const data = await res.json();
          const items: NotificationItem[] = data.notifications || [];
          setNotifications(items.slice(0, 10));
          const count = data.unreadCount || 0;
          setUnreadCount(count);
          updateTabTitle(count);
          if (items.length > 0) {
            lastIdRef.current = items[0].id;
          }
        }
      } catch {
        // Soft fail
      }
    }

  initialLoad();

  // Poll every 8 seconds while visible
  const intervalId = setInterval(() => {
    pollNotifications();
  }, 8000);

  // Refresh immediately when tab gains focus or visibility
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      pollNotifications();
    }
  };

  const handleFocus = () => {
    pollNotifications();
  };

  window.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleFocus);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
  };
}, [pollNotifications, updateTabTitle]);

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
    updateTabTitle(0);
    toast.success("All notifications marked as read.");
  } catch {
    // Soft fail
  }
}

return (
  <>
    <header className="m-2 sm:m-4 mb-0 px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-[#15101F]/80 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg flex items-center justify-between gap-2.5 sm:gap-4 text-white">
      {/* Left: Mobile trigger & Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Wide search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#1C1628] border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-xs font-sans group shadow-inner min-w-0"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-[#CDB8FF] group-hover:text-white transition-colors shrink-0" />
            <span className="truncate text-left">
              <span className="sm:hidden">Search admin...</span>
              <span className="hidden sm:inline">Search people, orders, catalogue, audit...</span>
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-mono text-white/60 shrink-0">
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSound}
                      className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title={soundEnabled ? "Mute notification chime" : "Enable notification chime"}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5 text-pf-lime" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </button>
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
                </div>

                {/* Optional Browser Notification Permission Prompt */}
                {browserPermission === "default" && (
                  <div className="my-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-white/70">Enable desktop alerts?</span>
                    <button
                      onClick={requestBrowserPermission}
                      className="px-2.5 py-1 bg-[#6A2CFF] hover:bg-[#7C3AED] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-colors"
                    >
                      Allow
                    </button>
                  </div>
                )}

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
  </header >

    {/* Global Command Palette */ }
    < CommandPalette
isOpen = { commandPaletteOpen }
onClose = {() => setCommandPaletteOpen(false)}
userRole = { userRole }
  />
    </>
  );
}
