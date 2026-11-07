"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCoupon } from "@/lib/admin/admin-store";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("1000");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [expiresAt, setExpiresAt] = useState("2026-12-31");
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) {
      toast.error("Please fill in coupon code and discount value");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          minSubtotal: Number(minSubtotal),
          firstOrderOnly,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          active: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${data.coupon.code} created!`);
        setCoupons((prev) => [data.coupon, ...prev]);
        setShowCreateModal(false);
        setCode("");
        setValue("");
      } else {
        toast.error(data.error || "Failed to create coupon");
      }
    } catch {
      toast.error("Network error creating coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCoupon = async (coupon: AdminCoupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...coupon,
          active: !coupon.active,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${coupon.code} ${!coupon.active ? "activated" : "deactivated"}`);
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
        );
      }
    } catch {
      toast.error("Error toggling coupon");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon ${code}?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${code} deleted.`);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      toast.error("Error deleting coupon");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-tight">
            Discount Coupons & Promos
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Configure order threshold vouchers, first-order promotions, and corporate partner discounts
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#181324] rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#110D1A] text-white/40 uppercase border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min. Subtotal</th>
                <th className="py-3 px-4">Restrictions</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-white/40 font-mono">
                    Loading promotional vouchers...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-white/40 font-mono">
                    No active discount coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span className="font-mono text-sm px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-pf-lime">
                        {c.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {c.type === "PERCENTAGE" ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                    </td>

                    <td className="py-3.5 px-4 text-white/70">
                      ₹{c.minSubtotal.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.firstOrderOnly ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300">
                          1st Order Only
                        </span>
                      ) : (
                        <span className="text-white/40">No user limit</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-white/80">
                      {c.usageCount} orders
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleCoupon(c)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${c.active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/10 text-white/40 border border-white/20"
                          }`}
                      >
                        {c.active ? "Active" : "Disabled"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="text-white/40 hover:text-rose-400 p-1.5 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181324] border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Create New Promotion Voucher
              </h3>
              <p className="text-xs font-mono text-white/50 mt-1">
                Vouchers are validated securely on server checkout
              </p>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. DIWALI20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-pf-violet uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FLAT")}
                    className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                    Value {type === "PERCENTAGE" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    placeholder="15"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-pf-violet"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Minimum Cart Subtotal (₹)
                </label>
                <input
                  type="number"
                  value={minSubtotal}
                  onChange={(e) => setMinSubtotal(e.target.value)}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-[#110D1A] border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="firstOrderCheck"
                  checked={firstOrderOnly}
                  onChange={(e) => setFirstOrderOnly(e.target.checked)}
                  className="rounded border-white/20 bg-[#110D1A] text-pf-violet focus:ring-0"
                />
                <label htmlFor="firstOrderCheck" className="text-xs font-mono text-white/80 cursor-pointer">
                  Limit to customer&apos;s first purchase only
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-mono hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet/90 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}