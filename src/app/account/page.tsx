"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Package,
  User,
  Download,
  RotateCcw,
  LogOut,
  Building,
  Bell,
  MapPin,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { StoredOrder } from "@/lib/orders";

interface CustomerAddress {
  id: string;
  userId: string;
  label: "Home" | "Office" | "Other";
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  gstin?: string;
  isDefault: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  readTime?: string | null;
  createdAt: string;
}

export default function AccountPage() {
  const { data: session } = useSession();
  const cart = useCart();

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "profile" | "addresses" | "notifications" | "settings"
  >("overview");

  // Orders state
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // Addresses state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home" as "Home" | "Office" | "Other",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pin: "",
    gstin: "",
    isDefault: false,
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Security modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [emailForm, setEmailForm] = useState({ currentPassword: "", newEmail: "", otp: "" });
  const [submittingEmail, setSubmittingEmail] = useState(false);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ currentPassword: "", newPhone: "" });
  const [submittingPhone, setSubmittingPhone] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: "", otp: "" });
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [otpRequestedForDelete, setOtpRequestedForDelete] = useState(false);

  // Customer Web Push state
  const [customerPushActive, setCustomerPushActive] = useState(false);
  const [customerPushLoading, setCustomerPushLoading] = useState(false);

  const handleEnableCustomerPush = async () => {
    setCustomerPushLoading(true);
    try {
      if (!("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported on this browser.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied. Please allow notifications in browser settings.");
      }
      const keyRes = await fetch("/api/account/push/subscribe");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        throw new Error("Push notifications are not configured on server.");
      }

      const padding = "=".repeat((4 - (keyData.publicKey.length % 4)) % 4);
      const base64 = (keyData.publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });
      }

      const saveRes = await fetch("/api/account/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!saveRes.ok) throw new Error("Failed to register push subscription.");

      setCustomerPushActive(true);
      toast.success("Instant order and proof push alerts enabled!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to activate push alerts.";
      toast.error(msg);
    } finally {
      setCustomerPushLoading(false);
    }
  };

  // Fetch orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders/user");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        // Fallback silently
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, []);

  // Fetch addresses
  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === "addresses") {
      loadAddresses();
    }
  }, [activeTab]);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/account/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const handleReorder = (order: StoredOrder) => {
    order.items.forEach((item) => {
      cart.addItem({
        productId: item.productId,
        optionKey: `${item.productId}-${Date.now()}`,
        qty: item.qty,
        unitPrice: item.unitPrice,
        name: item.productName,
        template: item.template,
        designId: item.designId,
        options: item.options,
      });
    });
    toast.success(`Items from #${order.orderNumber} added to cart!`);
    cart.openCart();
  };

  // Address CRUD Handlers
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(addressForm.pin)) {
      toast.error("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(addressForm.phone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      if (editingAddress) {
        const res = await fetch(`/api/account/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update address.");
        toast.success("Address updated successfully.");
      } else {
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add address.");
        toast.success("Address added successfully.");
      }
      setIsAddressModalOpen(false);
      setEditingAddress(null);
      loadAddresses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving address.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete address.");
      toast.success("Address deleted.");
      loadAddresses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting address.");
    }
  };

  const handleSetDefaultAddress = async (addr: CustomerAddress) => {
    try {
      const res = await fetch(`/api/account/addresses/${addr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        toast.success("Default address updated.");
        loadAddresses();
      }
    } catch {
      toast.error("Failed to set default address.");
    }
  };

  // Change Email Handlers
  const handleRequestEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEmail(true);
    try {
      const res = await fetch("/api/account/email/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: emailForm.currentPassword,
          newEmail: emailForm.newEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request verification code.");
      toast.success("6-digit verification code sent to your new email.");
      setEmailStep(2);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error requesting code.");
    } finally {
      setSubmittingEmail(false);
    }
  };

  const handleConfirmEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEmail(true);
    try {
      const res = await fetch("/api/account/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: emailForm.newEmail,
          otp: emailForm.otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm email change.");
      toast.success("Email address updated! Please sign in with your new email.");
      setIsEmailModalOpen(false);
      signOut({ callbackUrl: "/login" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setSubmittingEmail(false);
    }
  };

  // Change Phone Handler
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phoneForm.newPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setSubmittingPhone(true);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update phone number.");
      toast.success("Mobile number updated successfully.");
      setIsPhoneModalOpen(false);
      setPhoneForm({ currentPassword: "", newPhone: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating phone.");
    } finally {
      setSubmittingPhone(false);
    }
  };

  // Change Password Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setSubmittingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password.");
      toast.success("Password changed! All other active sessions have been invalidated.");
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error changing password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Sign out all sessions
  const handleSignOutAll = async () => {
    if (!confirm("This will log you out of all browsers, devices, and sessions. Continue?")) return;
    try {
      await fetch("/api/account/sign-out-all", { method: "POST" });
      toast.success("All sessions terminated. Redirecting to home...");
      signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Failed to sign out of all sessions.");
    }
  };

  // Delete Account Handlers
  const handleRequestDeleteOtp = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/account/email/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: deleteForm.password,
          newEmail: session.user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code.");
      setOtpRequestedForDelete(true);
      toast.success(`Verification code sent to ${session.user.email}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error requesting code.");
    }
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDelete(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account.");
      toast.success("Account permanently anonymized and closed.");
      signOut({ callbackUrl: "/" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Account deletion failed.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch("/api/account/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, readTime: new Date().toISOString() })));
      setUnreadNotifCount(0);
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to update notifications.");
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      orderSearch === "" ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.items.some((i) => i.productName.toLowerCase().includes(orderSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (orderStatusFilter === "ALL") return true;
    if (orderStatusFilter === "AWAITING_APPROVAL")
      return ["MOCKUP_SENT", "CHANGES_REQUESTED", "PROOF_READY"].includes(o.status);
    if (orderStatusFilter === "IN_PRINTING")
      return ["IN_PRINTING", "CUSTOMER_APPROVED", "APPROVED", "QC_PASSED"].includes(o.status);
    if (orderStatusFilter === "DISPATCHED") return o.status === "DISPATCHED";
    if (orderStatusFilter === "DELIVERED") return o.status === "DELIVERED";
    if (orderStatusFilter === "CANCELLED") return ["CANCELLED", "REFUNDED"].includes(o.status);
    return true;
  });

  const pendingProofsCount = orders.filter((o) =>
    ["MOCKUP_SENT", "CHANGES_REQUESTED", "PROOF_READY"].includes(o.status)
  ).length;

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Greeting & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-pf-ink/10 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-pf-ink/40 uppercase tracking-widest">
              <span>⊕ CLIENT WORKSPACE</span>
              <span>•</span>
              <span>CUSTOMER CONSOLE</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-pf-ink tracking-tight mt-1">
              Welcome back, {session?.user?.name || "Member"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-pf-ink/60 font-mono">{session?.user?.email}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-white hover:bg-pf-paper border border-pf-ink/20 text-pf-ink rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="mt-8 flex border-b border-pf-ink/10 text-xs font-mono uppercase tracking-wider gap-4 sm:gap-8 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "orders"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
            {pendingProofsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingProofsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "profile"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "addresses"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Addresses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap relative ${
              activeTab === "notifications"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {unreadNotifCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-pf-violet text-white text-[10px] font-bold">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "settings"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* Urgent Proof Alert Banner if pending */}
            {pendingProofsCount > 0 && (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display font-bold text-base text-amber-900">
                      Pre-Press Proofs Awaiting Your Approval ({pendingProofsCount})
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Review vector simulation, alignment, and pantone separations so we can begin printing.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("orders");
                    setOrderStatusFilter("AWAITING_APPROVAL");
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold shrink-0 transition-colors"
                >
                  Inspect Proofs
                </button>
              </div>
            )}

            {/* Metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm">
                <div className="text-xs font-mono uppercase text-pf-ink/50 tracking-wider">Total Orders</div>
                <div className="font-mono font-bold text-3xl text-pf-ink mt-2">{orders.length}</div>
                <div className="text-xs text-pf-ink/60 mt-1">Life-to-date custom orders</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm">
                <div className="text-xs font-mono uppercase text-pf-ink/50 tracking-wider">Pending Action</div>
                <div className="font-mono font-bold text-3xl text-amber-600 mt-2">{pendingProofsCount}</div>
                <div className="text-xs text-pf-ink/60 mt-1">Requires design sign-off</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm">
                <div className="text-xs font-mono uppercase text-pf-ink/50 tracking-wider">Saved Addresses</div>
                <div className="font-mono font-bold text-3xl text-pf-violet mt-2">{addresses.length}</div>
                <div className="text-xs text-pf-ink/60 mt-1">GST & shipping destinations</div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-pf-ink">Recent Orders</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-mono text-pf-violet hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loadingOrders ? (
                <div className="bg-white p-8 rounded-2xl border border-pf-ink/10 text-center font-mono text-xs text-pf-ink/60 animate-pulse">
                  Loading order portfolio...
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-pf-ink/10 text-center space-y-3">
                  <Package className="w-8 h-8 text-pf-ink/30 mx-auto" />
                  <p className="text-sm text-pf-ink/70">No orders placed yet.</p>
                  <Link
                    href="/collections/all"
                    className="inline-block px-5 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl"
                  >
                    Start Customizing
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      className="bg-white p-5 rounded-2xl border border-pf-ink/10 shadow-sm hover:border-pf-violet/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-pf-ink">#{o.orderNumber}</span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-pf-lilac/30 text-pf-violet border border-pf-violet/20">
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-xs text-pf-ink/60 font-mono">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {o.items.length} Product Lines
                        </div>
                        <div className="text-xs text-pf-ink/80">
                          {o.items.map((i) => `${i.qty}x ${i.productName}`).join(", ")}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono font-bold text-sm text-pf-ink">
                          ₹{o.total.toLocaleString("en-IN")}
                        </span>
                        <Link
                          href={`/account/orders/${o.orderNumber}`}
                          className="px-3 py-1.5 bg-pf-paper hover:bg-pf-lilac/30 text-pf-ink text-xs font-mono uppercase tracking-wider font-bold rounded-lg border border-pf-ink/10 transition-colors flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS LIST WITH FILTERS & SEARCH */}
        {activeTab === "orders" && (
          <div className="mt-8 space-y-6">
            {/* Search and status filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search by order number or product name..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-4 py-2.5 bg-white border border-pf-ink/20 rounded-xl text-xs font-mono text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet max-w-sm w-full"
              />

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono uppercase tracking-wider pb-1">
                {[
                  { key: "ALL", label: "All" },
                  { key: "AWAITING_APPROVAL", label: "Awaiting Proof" },
                  { key: "IN_PRINTING", label: "In Printing" },
                  { key: "DISPATCHED", label: "Dispatched" },
                  { key: "DELIVERED", label: "Delivered" },
                  { key: "CANCELLED", label: "Cancelled" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setOrderStatusFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                      orderStatusFilter === f.key
                        ? "bg-pf-violet text-white border-pf-violet font-bold"
                        : "bg-white text-pf-ink/70 border-pf-ink/10 hover:border-pf-ink/30"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingOrders ? (
              <div className="bg-white p-8 rounded-2xl border border-pf-ink/10 text-center font-mono text-xs text-pf-ink/60 animate-pulse">
                Loading order portfolio...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-pf-ink/10 text-center space-y-3">
                <Package className="w-10 h-10 text-pf-ink/30 mx-auto" />
                <h3 className="font-display font-bold text-lg text-pf-ink">No Matching Orders</h3>
                <p className="text-sm text-pf-ink/70 max-w-sm mx-auto">
                  Try adjusting your search query or status filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm hover:border-pf-violet/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-pf-ink">#{o.orderNumber}</span>
                        <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="text-xs text-pf-ink/60 font-mono">
                        Date:{" "}
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        • {o.items.length} Product Lines
                      </div>

                      <div className="text-xs text-pf-ink/80 pt-1">
                        {o.items.map((i) => `${i.qty}x ${i.productName}`).join(", ")}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-pf-ink/10">
                      <div className="font-mono font-bold text-lg text-pf-violet">
                        ₹{o.total.toLocaleString("en-IN")}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/account/orders/${o.orderNumber}`}
                          className="px-3.5 py-1.5 bg-pf-paper hover:bg-pf-lilac/30 text-pf-ink text-xs font-mono uppercase tracking-wider font-bold rounded-lg border border-pf-ink/10 transition-colors"
                        >
                          View Order & Proof
                        </Link>

                        <a
                          href={`/api/orders/${o.orderNumber}/invoice`}
                          className="p-1.5 bg-pf-paper hover:bg-pf-lilac/30 text-pf-ink rounded-lg border border-pf-ink/10"
                          title="Download GST Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleReorder(o)}
                          className="p-1.5 bg-pf-paper hover:bg-pf-lilac/30 text-pf-ink rounded-lg border border-pf-ink/10"
                          title="Buy Again"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & SECURITY */}
        {activeTab === "profile" && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Credentials Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-6">
              <h3 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
                <User className="w-5 h-5 text-pf-violet" />
                <span>Security & Login Credentials</span>
              </h3>

              <div className="space-y-4 text-xs font-mono">
                {/* Email row */}
                <div className="p-4 bg-pf-paper/40 rounded-xl border border-pf-ink/10 flex items-center justify-between">
                  <div>
                    <div className="text-pf-ink/50 uppercase text-[10px]">Email Address</div>
                    <div className="font-bold text-pf-ink mt-0.5">{session?.user?.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep(1);
                      setEmailForm({ currentPassword: "", newEmail: "", otp: "" });
                      setIsEmailModalOpen(true);
                    }}
                    className="px-3 py-1 bg-white border border-pf-ink/20 rounded-lg text-[11px] font-bold text-pf-violet hover:bg-pf-paper transition-colors"
                  >
                    Change Email
                  </button>
                </div>

                {/* Mobile row */}
                <div className="p-4 bg-pf-paper/40 rounded-xl border border-pf-ink/10 flex items-center justify-between">
                  <div>
                    <div className="text-pf-ink/50 uppercase text-[10px]">Mobile Number</div>
                    <div className="font-bold text-pf-ink mt-0.5">
                      {(session?.user as { phone?: string })?.phone || "Not configured"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneForm({ currentPassword: "", newPhone: "" });
                      setIsPhoneModalOpen(true);
                    }}
                    className="px-3 py-1 bg-white border border-pf-ink/20 rounded-lg text-[11px] font-bold text-pf-violet hover:bg-pf-paper transition-colors"
                  >
                    Update Phone
                  </button>
                </div>

                {/* Password row */}
                <div className="p-4 bg-pf-paper/40 rounded-xl border border-pf-ink/10 flex items-center justify-between">
                  <div>
                    <div className="text-pf-ink/50 uppercase text-[10px]">Account Password</div>
                    <div className="font-bold text-pf-ink mt-0.5">••••••••••••</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setIsPasswordModalOpen(true);
                    }}
                    className="px-3 py-1 bg-white border border-pf-ink/20 rounded-lg text-[11px] font-bold text-pf-violet hover:bg-pf-paper transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Organization & GST Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-6">
              <h3 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
                <Building className="w-5 h-5 text-pf-violet" />
                <span>Organization & GST Profile</span>
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-pf-paper/40 rounded-xl border border-pf-ink/10">
                  <div className="text-pf-ink/50 uppercase text-[10px]">Company Name</div>
                  <div className="font-bold text-pf-ink mt-0.5">Purple Friday Corporate Member</div>
                </div>

                <div className="p-4 bg-pf-paper/40 rounded-xl border border-pf-ink/10">
                  <div className="text-pf-ink/50 uppercase text-[10px]">GSTIN Status</div>
                  <div className="font-bold text-emerald-700 mt-0.5">Input Tax Credit Eligible (B2B)</div>
                  <div className="text-[11px] text-pf-ink/60 mt-1">
                    GSTIN numbers can be configured per delivery address in the Addresses tab.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADDRESSES */}
        {activeTab === "addresses" && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-pf-ink">Saved Delivery Addresses</h2>
                <p className="text-xs text-pf-ink/60 mt-0.5">
                  Manage recipient locations for automated shipping & B2B GST tax invoices.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    label: "Office",
                    name: session?.user?.name || "",
                    phone: "",
                    line1: "",
                    line2: "",
                    city: "",
                    state: "",
                    pin: "",
                    gstin: "",
                    isDefault: addresses.length === 0,
                  });
                  setIsAddressModalOpen(true);
                }}
                className="px-4 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="bg-white p-8 rounded-2xl border border-pf-ink/10 text-center font-mono text-xs text-pf-ink/60 animate-pulse">
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-pf-ink/10 text-center space-y-3">
                <MapPin className="w-10 h-10 text-pf-ink/30 mx-auto" />
                <h3 className="font-display font-bold text-lg text-pf-ink">No Addresses Saved</h3>
                <p className="text-sm text-pf-ink/70 max-w-sm mx-auto">
                  Add delivery destinations for quick checkout and automated courier routing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className={`bg-white p-6 rounded-2xl border shadow-sm transition-colors relative flex flex-col justify-between ${
                      a.isDefault ? "border-pf-violet/40 bg-pf-paper/10" : "border-pf-ink/10"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-pf-lilac/30 text-pf-violet border border-pf-violet/20">
                          {a.label}
                        </span>
                        {a.isDefault && (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Default Address
                          </span>
                        )}
                      </div>

                      <div className="font-display font-bold text-base text-pf-ink">{a.name}</div>
                      <div className="text-xs text-pf-ink/80 font-mono leading-relaxed">
                        {a.line1}
                        {a.line2 && <>, {a.line2}</>}
                        <br />
                        {a.city}, {a.state} - {a.pin}
                      </div>

                      <div className="text-xs font-mono text-pf-ink/60 pt-1">Phone: {a.phone}</div>
                      {a.gstin && (
                        <div className="text-xs font-mono text-pf-violet font-semibold">
                          GSTIN: {a.gstin}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-pf-ink/10 flex items-center justify-between text-xs font-mono">
                      <div>
                        {!a.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(a)}
                            className="text-pf-ink/60 hover:text-pf-violet underline"
                          >
                            Set as default
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(a);
                            setAddressForm({
                              label: a.label,
                              name: a.name,
                              phone: a.phone,
                              line1: a.line1,
                              line2: a.line2 || "",
                              city: a.city,
                              state: a.state,
                              pin: a.pin,
                              gstin: a.gstin || "",
                              isDefault: a.isDefault,
                            });
                            setIsAddressModalOpen(true);
                          }}
                          className="text-pf-ink/70 hover:text-pf-violet"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(a.id)}
                          className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-pf-ink">In-App Notifications</h2>
                <p className="text-xs text-pf-ink/60 mt-0.5">
                  Order status updates, prepress proofs, and account alerts.
                </p>
              </div>

              {notifications.some((n) => !n.readTime) && (
                <button
                  type="button"
                  onClick={handleMarkAllNotifsRead}
                  className="px-3.5 py-1.5 bg-white border border-pf-ink/20 rounded-xl text-xs font-mono uppercase tracking-wider font-bold text-pf-ink hover:bg-pf-paper transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-pf-ink/10 text-center space-y-3">
                <Bell className="w-10 h-10 text-pf-ink/30 mx-auto" />
                <h3 className="font-display font-bold text-lg text-pf-ink">No Notifications</h3>
                <p className="text-sm text-pf-ink/70 max-w-sm mx-auto">
                  You are all caught up! Order updates and pre-flight alerts will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`bg-white p-5 rounded-2xl border transition-colors flex items-start justify-between gap-4 ${
                      !n.readTime ? "border-pf-violet/40 bg-pf-lilac/5" : "border-pf-ink/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.readTime && (
                          <span className="w-2 h-2 rounded-full bg-pf-violet shrink-0" />
                        )}
                        <h4 className="font-display font-bold text-sm text-pf-ink">{n.title}</h4>
                      </div>
                      <p className="text-xs text-pf-ink/70 font-sans">{n.body}</p>
                      <div className="text-[10px] font-mono text-pf-ink/40 pt-1">
                        {new Date(n.createdAt).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>

                    {n.link && (
                      <Link
                        href={n.link}
                        className="px-3 py-1 bg-pf-paper text-pf-ink rounded-lg text-xs font-mono uppercase tracking-wider font-bold hover:bg-pf-lilac/30 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS & DANGER ZONE */}
        {activeTab === "settings" && (
          <div className="mt-8 space-y-8 max-w-2xl">
            {/* Phone Web Push Notifications */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-pf-violet" />
                  <span>Instant Phone Push Notifications</span>
                </h3>
                {customerPushActive && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-pf-ink/70 leading-relaxed font-sans">
                Get real-time browser alerts the moment your pre-press design proof is ready for approval, when your order ships, and when out for delivery.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleEnableCustomerPush}
                  disabled={customerPushActive || customerPushLoading}
                  className="px-4 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors disabled:opacity-50"
                >
                  {customerPushActive
                    ? "Alerts Enabled"
                    : customerPushLoading
                    ? "Enabling Alerts..."
                    : "Turn On Instant Alerts"}
                </button>
                <p className="text-[11px] text-pf-ink/50 italic font-sans">
                  On iPhone, tap Share then &quot;Add to Home Screen&quot; to enable push alerts.
                </p>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                <Shield className="w-5 h-5 text-pf-violet" />
                <span>Active Sessions & Security</span>
              </h3>
              <p className="text-xs text-pf-ink/70 leading-relaxed font-sans">
                If you suspect unauthorized activity or left your account logged in on a public computer, you can invalidate all active session tokens across all devices immediately.
              </p>
              <button
                type="button"
                onClick={handleSignOutAll}
                className="px-4 py-2 bg-pf-ink text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-ink/90 transition-colors"
              >
                Sign Out Of All Devices
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4">
              <h3 className="font-display font-bold text-lg text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed font-sans">
                Permanently close and anonymize your account. Existing tax invoices and completed order records will be preserved for Indian statutory tax compliance, but personal profile data will be permanently purged.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteForm({ password: "", otp: "" });
                  setOtpRequestedForDelete(false);
                  setIsDeleteModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-rose-700 transition-colors"
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT ADDRESS */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-pf-ink">
                {editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Office", "Other"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: l })}
                      className={`py-1.5 rounded-lg border text-xs uppercase font-bold transition-colors ${
                        addressForm.label === l
                          ? "bg-pf-violet text-white border-pf-violet"
                          : "bg-pf-paper/50 text-pf-ink/70 border-pf-ink/20"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    10-Digit Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Address Line 1 (Street, Building, Flat)
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Address Line 2 (Landmark, Area - Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">6-Digit PIN</label>
                    <input
                      type="text"
                      required
                      placeholder="560001"
                      value={addressForm.pin}
                      onChange={(e) => setAddressForm({ ...addressForm, pin: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    GSTIN for Tax Invoice (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="29AAAAA0000A1Z5"
                    value={addressForm.gstin}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, gstin: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-mono uppercase text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefaultCheckbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded text-pf-violet focus:ring-pf-violet"
                  />
                  <label htmlFor="isDefaultCheckbox" className="text-xs text-pf-ink/80">
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-pf-ink/10">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-4 py-2 bg-pf-paper text-pf-ink text-xs uppercase tracking-wider rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-pf-violet text-white text-xs uppercase tracking-wider font-bold rounded-lg hover:bg-pf-violet/90"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHANGE EMAIL (2-STEP OTP) */}
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                <Mail className="w-5 h-5 text-pf-violet" />
                <span>Change Account Email</span>
              </h3>

              {emailStep === 1 ? (
                <form onSubmit={handleRequestEmailOtp} className="space-y-3 text-xs font-mono">
                  <p className="text-pf-ink/70 font-sans">
                    Enter your current password and your new email address. We will dispatch a 6-digit verification code.
                  </p>
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={emailForm.currentPassword}
                      onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      placeholder="new.email@example.com"
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEmail}
                      className="px-5 py-2 bg-pf-violet text-white font-bold rounded-lg hover:bg-pf-violet/90 disabled:opacity-50"
                    >
                      {submittingEmail ? "Sending Code..." : "Send Verification Code"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmEmailOtp} className="space-y-3 text-xs font-mono">
                  <p className="text-pf-ink/70 font-sans">
                    Enter the 6-digit code dispatched to <strong>{emailForm.newEmail}</strong>.
                  </p>
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={emailForm.otp}
                      onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value })}
                      placeholder="123456"
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-base tracking-widest font-mono text-center text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setEmailStep(1)}
                      className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEmail}
                      className="px-5 py-2 bg-pf-violet text-white font-bold rounded-lg hover:bg-pf-violet/90 disabled:opacity-50"
                    >
                      {submittingEmail ? "Verifying..." : "Confirm & Update Email"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL: CHANGE PHONE */}
        {isPhoneModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                <Phone className="w-5 h-5 text-pf-violet" />
                <span>Update Mobile Number</span>
              </h3>

              <form onSubmit={handleSavePhone} className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={phoneForm.currentPassword}
                    onChange={(e) => setPhoneForm({ ...phoneForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    New 10-Digit Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phoneForm.newPhone}
                    onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPhone}
                    className="px-5 py-2 bg-pf-violet text-white font-bold rounded-lg hover:bg-pf-violet/90 disabled:opacity-50"
                  >
                    {submittingPhone ? "Updating..." : "Save Phone Number"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHANGE PASSWORD */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-pf-ink flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-pf-violet" />
                <span>Change Account Password</span>
              </h3>

              <form onSubmit={handleSavePassword} className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    New Password (Min 8 Chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="px-5 py-2 bg-pf-violet text-white font-bold rounded-lg hover:bg-pf-violet/90 disabled:opacity-50"
                  >
                    {submittingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE ACCOUNT */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Confirm Account Deletion</span>
              </h3>

              <form onSubmit={handleConfirmDeleteAccount} className="space-y-3 text-xs font-mono">
                <p className="text-pf-ink/70 font-sans">
                  To permanently delete and anonymize your account, confirm your password and enter the OTP code sent to your registered email.
                </p>

                <div>
                  <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-xs text-pf-ink focus:outline-none focus:border-pf-violet"
                  />
                </div>

                {!otpRequestedForDelete ? (
                  <button
                    type="button"
                    onClick={handleRequestDeleteOtp}
                    disabled={!deleteForm.password}
                    className="w-full py-2 bg-pf-paper border border-pf-ink/20 text-pf-ink rounded-lg uppercase tracking-wider font-bold hover:bg-pf-paper/80 disabled:opacity-50"
                  >
                    Request Deletion OTP
                  </button>
                ) : (
                  <div>
                    <label className="block uppercase text-[10px] text-pf-ink/70 mb-1">
                      6-Digit Deletion OTP
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={deleteForm.otp}
                      onChange={(e) => setDeleteForm({ ...deleteForm, otp: e.target.value })}
                      placeholder="123456"
                      className="w-full px-3 py-2 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-base tracking-widest font-mono text-center text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-pf-paper text-pf-ink rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDelete || !otpRequestedForDelete}
                    className="px-5 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submittingDelete ? "Deleting..." : "Permanently Delete"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
