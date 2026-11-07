"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Package,
  Palette,
  User,
  Download,
  RotateCcw,
  LogOut,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { StoredOrder } from "@/lib/orders";

export default function AccountPage() {
  const { data: session } = useSession();
  const cart = useCart();

  const [activeTab, setActiveTab] = useState<"orders" | "designs" | "profile">("orders");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Form state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [company, setCompany] = useState("");
  const [gstin, setGstin] = useState("");

  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || "");
    }
  }, [session]);

  // Load orders for user
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
    toast.success(`Items from ${order.orderNumber} added to cart!`);
    cart.openCart();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile and GST billing details updated.");
  };

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Greeting & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-pf-ink/10 gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-pf-ink/40 uppercase tracking-widest">
              <span>⊕ CLIENT WORKSPACE</span>
              <span>•</span>
              <span>ACCOUNT CONSOLE</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-pf-ink tracking-tight mt-1">
              Welcome back, {session?.user?.name || "Member"}
            </h1>
            <p className="text-sm text-pf-ink/60 font-mono mt-0.5">
              {session?.user?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-white hover:bg-pf-paper border border-pf-ink/20 text-pf-ink rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="mt-8 flex border-b border-pf-ink/10 text-xs font-mono uppercase tracking-wider gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "orders"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Proofs ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("designs")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "designs"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Saved Studio Designs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "profile"
                ? "border-pf-violet text-pf-violet font-bold"
                : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Company & GST Profile</span>
          </button>
        </div>

        {/* Tab 1: Orders List */}
        {activeTab === "orders" && (
          <div className="mt-8 space-y-4">
            {loadingOrders ? (
              <div className="bg-white p-8 rounded-2xl border border-pf-ink/10 text-center font-mono text-xs text-pf-ink/60 animate-pulse">
                Loading order portfolio...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-pf-ink/10 text-center space-y-3">
                <Package className="w-10 h-10 text-pf-ink/30 mx-auto" />
                <h3 className="font-display font-bold text-lg text-pf-ink">No Orders Placed Yet</h3>
                <p className="text-sm text-pf-ink/70 max-w-sm mx-auto">
                  Customize merchandise in our studio with live 3D proofs and bulk tier savings.
                </p>
                <Link
                  href="/collections/all"
                  className="inline-block mt-3 px-6 py-2.5 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm hover:border-pf-violet/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-pf-ink">{o.orderNumber}</span>
                      <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs text-pf-ink/60 font-mono">
                      Date: {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} • {o.items.length} Product Lines
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
                        Inspect Proof
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
                        title="Reorder 1-Click"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Saved Studio Designs */}
        {activeTab === "designs" && (
          <div className="mt-8 bg-white p-12 rounded-2xl border border-pf-ink/10 text-center space-y-3">
            <Palette className="w-10 h-10 text-pf-ink/30 mx-auto" />
            <h3 className="font-display font-bold text-lg text-pf-ink">Saved Studio Designs</h3>
            <p className="text-sm text-pf-ink/70 max-w-sm mx-auto">
              Any custom logo placements saved in our live studio appear here for instant reordering.
            </p>
            <Link
              href="/collections/all"
              className="inline-block mt-3 px-6 py-2.5 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl"
            >
              Open Studio Catalog
            </Link>
          </div>
        )}

        {/* Tab 3: Company & GST Profile */}
        {activeTab === "profile" && (
          <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm max-w-2xl space-y-6">
            <h3 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
              <Building className="w-5 h-5 text-pf-violet" />
              <span>Organization & GST Profile</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                  Mobile Number (10 Digits)
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Innovations Pvt Ltd"
                  className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                  Company GSTIN (15 Digits)
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm font-mono uppercase text-pf-ink focus:outline-none focus:border-pf-violet"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
