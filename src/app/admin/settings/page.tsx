"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Clock,
  Plug,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Save,
  Check,
  Palette,
  User,
  KeyRound,
  Bell,
  Smartphone,
} from "lucide-react";
import { PageTransition } from "@/components/admin/PageTransition";
import { useAdminTheme } from "@/components/admin/AdminThemeContext";
import {
  AdminAlertPreferences,
  DEFAULT_ADMIN_ALERT_PREFERENCES,
} from "@/lib/admin/app-settings";

interface StoreDetails {
  businessName: string;
  gstin: string;
  address: string;
  supportPhone: string;
  whatsappNumber: string;
  timeZone: string;
  currency: string;
}

interface IntegrationStatus {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  statusText: "Configured" | "Not configured";
  description: string;
  requiredEnvKeys: string[];
}

export default function AdminSettingsPage() {
  const { theme, toggleTheme, transparentSidebar, toggleTransparentSidebar } = useAdminTheme();
  const [store, setStore] = useState<StoreDetails>({
    businessName: "",
    gstin: "",
    address: "",
    supportPhone: "",
    whatsappNumber: "",
    timeZone: "Asia/Kolkata (IST, UTC+05:30)",
    currency: "INR (₹, paise)",
  });
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Admin Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Admin Notification Channels state
  const [alertPrefs, setAlertPrefs] = useState<AdminAlertPreferences>(DEFAULT_ADMIN_ALERT_PREFERENCES);
  const [isPushConfigured, setIsPushConfigured] = useState(false);
  const [pushSubscriptionActive, setPushSubscriptionActive] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [alertsSuccess, setAlertsSuccess] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load settings.");
      }
      const data = await res.json();
      if (data.store) setStore(data.store);
      if (data.integrations) setIntegrations(data.integrations);

      // Load notification alert preferences
      try {
        const notifRes = await fetch("/api/admin/settings/notifications");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.preferences) setAlertPrefs(notifData.preferences);
          setIsPushConfigured(Boolean(notifData.isPushConfigured));
        }
      } catch {}

      // Check push subscription status in browser
      if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
        if (Notification.permission === "granted") {
          const reg = await navigator.serviceWorker.getRegistration("/admin");
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub) setPushSubscriptionActive(true);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load configuration.");
    } finally {
      setLoading(false);
    }
  }

  function urlB64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleEnablePhoneAlerts() {
    if (!isPushConfigured) return;
    setPushSubscribing(true);
    setAlertsError(null);
    setAlertsSuccess(null);
    try {
      if (!("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported on this browser.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied. Please enable notifications in your browser settings.");
      }

      // Fetch VAPID public key
      const keyRes = await fetch("/api/admin/push/subscribe");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        throw new Error("Push notifications are not configured on server.");
      }

      const registration = await navigator.serviceWorker.register("/admin-sw.js", {
        scope: "/admin",
      });
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(keyData.publicKey),
        });
      }

      const saveRes = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!saveRes.ok) throw new Error("Failed to save push subscription.");

      setPushSubscriptionActive(true);
      setAlertsSuccess("Phone web push alerts enabled successfully!");
    } catch (err: unknown) {
      setAlertsError(err instanceof Error ? err.message : "Failed to activate phone alerts.");
    } finally {
      setPushSubscribing(false);
    }
  }

  async function handleSaveAlertPrefs(e: React.FormEvent) {
    e.preventDefault();
    setSavingAlerts(true);
    setAlertsError(null);
    setAlertsSuccess(null);
    try {
      const res = await fetch("/api/admin/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: alertPrefs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save alert preferences.");
      setAlertsSuccess("Notification alert channels saved and audited.");
    } catch (err: unknown) {
      setAlertsError(err instanceof Error ? err.message : "Failed to save alert settings.");
    } finally {
      setSavingAlerts(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSaveStore(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: store.businessName,
          gstin: store.gstin,
          address: store.address,
          supportPhone: store.supportPhone,
          whatsappNumber: store.whatsappNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store settings.");
      }

      setSuccess("Store configuration saved successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError("New password and confirm password do not match.");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch("/api/admin/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName || undefined,
          email: profileEmail || undefined,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update admin profile.");
      }

      setProfileSuccess("Admin profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to update admin profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <PageTransition>
          <div className="max-w-5xl space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#15101F]/10">
              <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#6A2CFF] uppercase tracking-wider mb-1 font-semibold">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Store Configuration</span>
                  </div>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                    Settings & Integrations
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadSettings}
                    disabled={loading}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#15101F]/15 hover:border-[#15101F]/30 text-[#15101F] text-xs font-mono font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Global Feedback Banner */}
              {success && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-mono">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Admin Account Profile Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#15101F]/10 mb-6">
                  <User className="w-5 h-5 text-[#6A2CFF]" />
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                      Admin Account Profile
                    </h2>
                    <p className="text-xs font-mono text-[#15101F]/50">
                      Update administrator credentials, name, and password
                    </p>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-mono">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                        Admin Name
                      </label>
                      <input
                        type="text"
                        placeholder="Administrator"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                        New Admin Email
                      </label>
                      <input
                        type="email"
                        placeholder="admin@purplefriday.in"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                        Current Password (Required for changes)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                        New Password (Optional)
                      </label>
                      <input
                        type="password"
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] hover:bg-[#5822D6] text-white text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{profileSaving ? "Updating Profile..." : "Update Admin Profile"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Appearance & Interface Styling */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#15101F]/10 mb-6">
                  <Palette className="w-5 h-5 text-[#6A2CFF]" />
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                      Admin Interface & Sidebar Styling
                    </h2>
                    <p className="text-xs font-mono text-[#15101F]/50">
                      Visual presentation, theme preferences, and sidebar opacity
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Liquid Glass Sidebar Mode Toggle */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#15101F]">Liquid Glass Sidebar Mode</span>
                          <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${transparentSidebar
                                ? "bg-purple-100 text-[#6A2CFF] border border-purple-200"
                                : "bg-zinc-200 text-zinc-700 border border-zinc-300"
                      }`}
                    >
                          {transparentSidebar ? "LIQUID GLASS (ON)" : "SOLID OPAQUE (OFF)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#15101F]/70 mt-1 font-sans leading-relaxed">
                        Refractive dark violet-tinted glass layers with 22px blur, 165% saturation boost, and specular rim highlights over ambient canvas depth.
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={transparentSidebar}
                      onClick={toggleTransparentSidebar}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6A2CFF] focus:ring-offset-2 ${transparentSidebar ? "bg-[#7C3AED]" : "bg-zinc-300"
                        }`}
                      aria-label="Toggle Liquid Glass Sidebar"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${transparentSidebar ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="text-[10px] font-mono text-[#15101F]/50 pt-2 border-t border-[#15101F]/5 flex items-center justify-between">
                    <span>Storage: localStorage (pf_admin_transparent_sidebar)</span>
                    <span className="font-semibold text-[#7C3AED]">
                      {transparentSidebar ? "Refractive Liquid Glass Active" : "Solid Opaque Active"}
                    </span>
                  </div>
                </div>

                {/* Color Palette Theme Toggle */}
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#15101F]">Admin Color Theme</span>
                        <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${theme === "dark"
                              ? "bg-[#15101F] text-[#D8FF3F] border border-white/20"
                              : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                        {theme === "dark" ? "DARK OBSIDIAN" : "LIGHT PAPER"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#15101F]/70 mt-1 font-sans leading-relaxed">
                      High-contrast dark obsidian canvas with electric violet accents, or warm paper surface.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={theme === "dark"}
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6A2CFF] focus:ring-offset-2 ${theme === "dark" ? "bg-[#7C3AED]" : "bg-zinc-300"
                      }`}
                    aria-label="Toggle Dark Mode"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${theme === "dark" ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                <div className="text-[10px] font-mono text-[#15101F]/50 pt-2 border-t border-[#15101F]/5 flex items-center justify-between">
                  <span>Storage: localStorage (pf_admin_theme)</span>
                  <span className="font-semibold text-[#7C3AED]">
                    {theme === "dark" ? "Dark Mode Active" : "Light Mode Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Entity Details Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#15101F]/10 mb-6">
              <Store className="w-5 h-5 text-[#6A2CFF]" />
              <div>
                <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                  Registered Store Entity Details
                </h2>
                <p className="text-xs font-mono text-[#15101F]/50">
                  Invoicing, GST tax reports, and customer receipt defaults
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs font-mono text-[#15101F]/50">
                Loading store details...
              </div>
            ) : (
            <form onSubmit={handleSaveStore} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Business / Trade Name
                  </label>
                  <input
                    type="text"
                    required
                    value={store.businessName}
                    onChange={(e) => setStore({ ...store, businessName: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    GSTIN (India Goods & Services Tax)
                  </label>
                  <input
                    type="text"
                    required
                    value={store.gstin}
                    onChange={(e) => setStore({ ...store, gstin: e.target.value.toUpperCase() })}
                    placeholder="29AADCP9876Q1Z5"
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Support Hotline
                  </label>
                  <input
                    type="text"
                    required
                    value={store.supportPhone}
                    onChange={(e) => setStore({ ...store, supportPhone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono"
                  />
                </div>

          <div>
              <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                WhatsApp Business Dispatch Number
          </label>
          <input
            type="text"
            required
            value={store.whatsappNumber}
            onChange={(e) => setStore({ ...store, whatsappNumber: e.target.value })}
            className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
          Registered Operating Store Address
        </label>
        <textarea
          required
          rows={2}
          value={store.address}
          onChange={(e) => setStore({ ...store, address: e.target.value })}
          className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl p-3 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
        />
      </div>

      {/* Read-Only System Constraints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#15101F]">
              <Clock className="w-4 h-4 text-[#6A2CFF]" />
              <span>Time Zone</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#15101F]">
              {store.timeZone}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#15101F]">
                <span className="text-xs font-bold font-mono text-[#6A2CFF]">₹</span>
                <span>Accounting Unit</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#15101F]">
                {store.currency}
              </span>
            </div>
          </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] hover:bg-[#5822D6] text-white text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving Store Details..." : "Save Store Details"}</span>
              </button>
            </div>
          </form>
          )}
        </div>

        {/* Operational Event Notifications & Phone Alerts */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#15101F]/10">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-[#6A2CFF]" />
              <div>
                <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                  Event Notification Channels
                </h2>
                <p className="text-xs font-mono text-[#15101F]/50">
                  Configure alert routing across Top-Bar Bell, Admin Email, and Phone Web Push
                </p>
              </div>
            </div>
            {/* Phone Web Push Activation Card / Status */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleEnablePhoneAlerts}
                disabled={!isPushConfigured || pushSubscriptionActive || pushSubscribing}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-sm ${
                  !isPushConfigured
                    ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                    : pushSubscriptionActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "bg-[#6A2CFF] text-white hover:bg-[#5822D6]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {!isPushConfigured
                    ? "Not configured"
                    : pushSubscriptionActive
                    ? "Phone Alerts Active"
                    : pushSubscribing
                    ? "Enabling Push..."
                    : "Turn on phone alerts"}
                </span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 font-sans italic">
            Note: On iPhone, the admin must first use &quot;Add to Home Screen&quot; in Safari to receive Web Push alerts.
          </p>

          {alertsSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-mono">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{alertsSuccess}</span>
            </div>
          )}

          {alertsError && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{alertsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAlertPrefs} className="space-y-4">
            <div className="overflow-x-auto border border-zinc-200 dark:border-white/10 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 font-mono uppercase text-zinc-500 text-[10px]">
                    <th className="p-3.5">Operational Event</th>
                    <th className="p-3.5 text-center">In-App Bell</th>
                    <th className="p-3.5 text-center">Admin Email</th>
                    <th className="p-3.5 text-center">Phone Web Push</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                  {[
                    { key: "ORDER_PLACED" as const, label: "New Order Received", desc: "Customer places a new merchandise or corporate order." },
                    { key: "ORDER_PAID" as const, label: "Payment / Advance Paid", desc: "Online gateway payment or partial COD advance verified." },
                    { key: "CUSTOMER_REGISTERED" as const, label: "Customer Registered", desc: "New customer verifies email OTP and activates account." },
                    { key: "NEW_REVIEW" as const, label: "Customer Review", desc: "Verified buyer submits a product review and rating." },
                    { key: "NEW_QUOTE" as const, label: "Bulk Quote Request (RFQ)", desc: "Client requests custom bulk merchandise quotation." },
                    { key: "ORDER_CANCELLED" as const, label: "Order Cancelled", desc: "Customer self-cancels within pre-print window." },
                    { key: "PROBLEM_REPORTED" as const, label: "Problem / Issue Reported", desc: "Post-delivery defect report or customer dispute." },
                    { key: "PROOF_DECISION" as const, label: "Proof Approval / Revision", desc: "Customer approves digital mockup or requests changes." },
                    { key: "CUSTOMER_PROFILE_CHANGED" as const, label: "Customer Profile Changed", desc: "Customer updates email, phone, or saved address." },
                    { key: "LOW_STOCK_ALERT" as const, label: "Low Inventory Alert", desc: "Product stock falls below operational safety threshold." },
                  ].map((evt) => (
                    <tr key={evt.key} className="hover:bg-zinc-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{evt.label}</div>
                        <div className="text-[11px] text-zinc-500 font-sans mt-0.5">{evt.desc}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/50 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          <span>ALWAYS ON</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={alertPrefs[evt.key]?.email ?? true}
                          onChange={(e) =>
                            setAlertPrefs({
                              ...alertPrefs,
                              [evt.key]: {
                                email: e.target.checked,
                                phone: alertPrefs[evt.key]?.phone ?? false,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-[#6A2CFF] focus:ring-[#6A2CFF] cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={alertPrefs[evt.key]?.phone ?? false}
                          onChange={(e) =>
                            setAlertPrefs({
                              ...alertPrefs,
                              [evt.key]: {
                                email: alertPrefs[evt.key]?.email ?? true,
                                phone: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-[#6A2CFF] focus:ring-[#6A2CFF] cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingAlerts}
                className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] hover:bg-[#5822D6] text-white text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingAlerts ? "Saving Preferences..." : "Save Notification Preferences"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Third-Party Integrations Health Check */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#15101F]/10 mb-6">
            <Plug className="w-5 h-5 text-[#6A2CFF]" />
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                Third-Party Platform Integrations
              </h2>
              <p className="text-xs font-mono text-[#15101F]/50">
                Payment gateway, logistics adapters, and notification services
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-start justify-between gap-3"
              >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#15101F]">{item.name}</span>
                        <span className="text-[10px] font-mono text-[#15101F]/40 uppercase">
                          ({item.category})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#15101F]/60 mt-1 font-sans">{item.description}</p>
                      <div className="mt-2 text-[10px] font-mono text-[#15101F]/40">
                        Env: {item.requiredEnvKeys.join(", ")}
                      </div>
                    </div>

                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white border border-[#15101F]/10 shadow-2xs">
                        {item.configured ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-amber-700">MOCK/OFF</span>
                          </>
                        )}
                      </div>
                    </div>
            ))}
                  </div>
                </div>
              </div>
    </PageTransition>
          );
}
