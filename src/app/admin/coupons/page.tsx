"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CouponData } from "@/server/coupons/coupon-service";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [value, setValue] = useState("12");
  const [maxDiscountCap, setMaxDiscountCap] = useState("500");
  const [minSubtotal, setMinSubtotal] = useState("1000");
  const [firstOrderOnly, setFirstOrderOnly] = useState(true);
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [totalUsageLimit, setTotalUsageLimit] = useState("500");
  const [expiresAt, setExpiresAt] = useState("2026-12-31");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch {
      toast.error("Failed to load promo coupons");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleToggle = async (coupon: CouponData) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Coupon ${coupon.code} is now ${data.coupon.active ? "Active" : "Disabled"}`
        );
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: data.coupon.active } : c))
        );
      } else {
        toast.error(data.error || "Failed to toggle coupon");
      }
    } catch {
      toast.error("Network error toggling coupon");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) {
      toast.error("Coupon code and value are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
        minSubtotal: Number(minSubtotal) || 0,
        firstOrderOnly,
        perUserLimit: Number(perUserLimit) || 1,
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : undefined,
        applicableCategories: selectedCategories,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        active: true,
      };

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${data.coupon.code} created!`);
        setShowModal(false);
        setCode("");
        loadCoupons();
      } else {
        toast.error(data.error || "Failed to create coupon");
      }
    } catch {
      toast.error("Network error creating coupon");
    } finally {
      setSaving(false);
    }
  };

  const allCategories = [
    { slug: "polo-shirts", name: "Polo Shirts" },
    { slug: "t-shirts", name: "T-Shirts" },
    { slug: "hoodies", name: "Hoodies" },
    { slug: "magnetic-badges", name: "Magnetic Badges" },
    { slug: "caps", name: "Caps" },
    { slug: "corporate-gifts", name: "Corporate Gifts" },
  ];

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Tag className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              Coupons & Promotions
            </h1>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-1">
            Discount rules, maximum discount caps, minimum order thresholds, and race-safe atomic redemptions
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm flex items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
          <input
            type="text"
            placeholder="Search coupon code (e.g. FIRSTORDER)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-paper/30"
          />
        </div>

        <div className="text-xs font-mono text-ink/60">
          <span className="font-bold text-ink">{coupons.filter((c) => c.active).length}</span> active campaigns
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-ink/10 bg-paper/40 text-[11px] uppercase tracking-wider text-ink/60">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-3">Type & Discount</th>
                <th className="py-3 px-3">Min Cart</th>
                <th className="py-3 px-3">Max Cap</th>
                <th className="py-3 px-3">Redemption Quota</th>
                <th className="py-3 px-3">Rules & Restrictions</th>
                <th className="py-3 px-3">Expiry</th>
                <th className="py-3 px-4 text-right">Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink/40">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink/40">
                    No promotional coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const discountDisplay =
                    c.type === "PERCENTAGE" ? `${c.value}% OFF` : `₹${(c.value / 100).toFixed(0)} FLAT`;
                  const capDisplay = c.maxDiscountCapPaise
                    ? `₹${(c.maxDiscountCapPaise / 100).toFixed(0)} cap`
                    : "No Cap";
                  const isSpecialFirstOrder = c.code === "FIRSTORDER";

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-paper/20 transition-colors ${
                        !c.active ? "opacity-60 bg-paper/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                              isSpecialFirstOrder
                                ? "bg-spot-lime/20 text-ink border border-spot-lime"
                                : "bg-violet/10 text-violet border border-violet/20"
                            }`}
                          >
                            {c.code}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-ink">{discountDisplay}</span>
                      </td>

                      <td className="py-3.5 px-3 text-ink/80">
                        ₹{(c.minSubtotalPaise / 100).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-3 text-ink/70">{capDisplay}</td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-bold text-ink">
                            {c.usageCount} {c.totalUsageLimit ? `/ ${c.totalUsageLimit}` : "used"}
                          </span>
                          <span className="text-[10px] text-ink/40">
                            Limit: {c.perUserLimit} per customer
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {c.firstOrderOnly && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20">
                              First Order Only
                            </span>
                          )}
                          {c.applicableCategories && c.applicableCategories.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
                              {c.applicableCategories.length} categories
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-paper text-ink/50">
                              Site-wide
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[11px] text-ink/60">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggle(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            c.active
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                              : "bg-paper text-ink/40 border-ink/10 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          {c.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-ink/40" />
                              Disabled
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-ink/10 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Create Promo Coupon
                </h3>
                <p className="text-xs font-mono text-ink/50 mt-0.5">
                  Configure discount formula, maximum caps, and category targeting
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME15"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet font-bold"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Discount Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FLAT")}
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">
                    {type === "PERCENTAGE" ? "Percent (%)" : "Flat (₹)"} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={maxDiscountCap}
                    onChange={(e) => setMaxDiscountCap(e.target.value)}
                    placeholder="e.g. 500"
                    disabled={type === "FLAT"}
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet disabled:bg-paper"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Min Cart (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Global Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={totalUsageLimit}
                    onChange={(e) => setTotalUsageLimit(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Per User</label>
                  <input
                    type="number"
                    min={1}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(parseInt(e.target.value, 10) || 1)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-ink/10 hover:bg-paper/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstOrderOnly}
                  onChange={(e) => setFirstOrderOnly(e.target.checked)}
                  className="rounded text-violet focus:ring-violet h-4 w-4"
                />
                <div>
                  <span className="font-bold text-ink">First Order Only</span>
                  <p className="text-[10px] text-ink/50">Restricted strictly to new accounts</p>
                </div>
              </label>

              <div>
                <label className="block text-ink/70 mb-1">Applicable Categories</label>
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl border border-ink/10 bg-paper/20">
                  {allCategories.map((cat) => (
                    <label key={cat.slug} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.slug)}
                        onChange={() => toggleCategory(cat.slug)}
                        className="rounded text-violet"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-ink/40 mt-1">Leave all unchecked for site-wide applicability.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-ink/10 rounded-xl text-ink/60 hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-violet text-white rounded-xl hover:bg-violet-hover disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
