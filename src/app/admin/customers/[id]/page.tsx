"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  MapPin,
  ShoppingBag,
  Star,
  FileText,
  Save,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/admin/PageTransition";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { StoredOrderRecord } from "@/server/orders/state-machine";
import { StoredReview } from "@/server/reviews/review-service";
import { CustomerProfile } from "@/server/customers/customer-service";

export default function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const decodedId = decodeURIComponent(id);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<StoredOrderRecord[]>([]);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [privateNote, setPrivateNote] = useState<string>("");
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(decodedId)}`);
      if (!res.ok) throw new Error("Customer profile not found");
      const data = await res.json();
      setProfile(data.profile);
      setOrders(data.orders || []);
      setReviews(data.reviews || []);
      setPrivateNote(data.privateNote || "");
      setNoteDraft(data.privateNote || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load customer profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [decodedId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(decodedId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save note");
      setPrivateNote(noteDraft);
      toast.success("Private customer note saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving note";
      toast.error(msg);
    } finally {
      setSavingNote(false);
    }
  };

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const formatIST = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#6A2CFF] mb-3" />
        <p className="text-xs font-mono">Loading customer profile and history...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#15101F] dark:text-[#F5F0E8]">Customer Not Found</h2>
        <p className="text-xs text-zinc-500">No account matches this identifier.</p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-16">
        {/* Top Breadcrumb & Summary Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/customers"
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#15101F] dark:text-[#F5F0E8]">
                  {profile.customerName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                  Verified Customer (Read-Only)
                </span>
              </div>
              <p className="text-xs text-[#8A829E] mt-0.5 font-mono">
                Customer ID: {profile.customerId} • Last active {formatIST(profile.lastOrderDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A829E]">Total Orders</span>
            <p className="text-2xl font-bold text-[#15101F] dark:text-[#F5F0E8] mt-1">{profile.orderCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A829E]">Lifetime Spend</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatINR(profile.totalSpendPaise)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A829E]">Reviews Submitted</span>
            <p className="text-2xl font-bold text-[#6A2CFF] dark:text-[#CDB8FF] mt-1">{reviews.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A829E]">Average Order</span>
            <p className="text-2xl font-bold text-[#15101F] dark:text-[#F5F0E8] mt-1">
              {formatINR(profile.orderCount > 0 ? Math.round(profile.totalSpendPaise / profile.orderCount) : 0)}
            </p>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer Profile & Private Admin Note */}
          <div className="space-y-6">
            {/* Customer Details Card (STRICTLY READ-ONLY) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] pb-2 border-b border-zinc-100 dark:border-white/5">
                Contact & Account Details
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-mono text-[#8A829E] block uppercase">Email Address</span>
                  <a
                    href={`mailto:${profile.customerEmail}`}
                    className="font-mono text-xs text-[#6A2CFF] hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{profile.customerEmail}</span>
                  </a>
                </div>

                {profile.customerPhone && (
                  <div>
                    <span className="text-[11px] font-mono text-[#8A829E] block uppercase">Phone Number</span>
                    <a
                      href={`tel:${profile.customerPhone}`}
                      className="font-mono text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{profile.customerPhone}</span>
                    </a>
                  </div>
                )}

                {profile.companyName && (
                  <div>
                    <span className="text-[11px] font-mono text-[#8A829E] block uppercase">Company / Organization</span>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Building className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{profile.companyName}</span>
                    </div>
                  </div>
                )}

                {profile.city && (
                  <div>
                    <span className="text-[11px] font-mono text-[#8A829E] block uppercase">City / Location</span>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{profile.city}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Private Admin Note Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#6A2CFF]" />
                  <span>Private Admin Note</span>
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">Internal Only</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Staff notes regarding credit terms, VIP treatment, preferred carriers, or past order issues. Customer never sees this.
              </p>
              <form onSubmit={handleSaveNote} className="space-y-3">
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="E.g., Corporate buyer for Q3 swag. Prefers GST invoices emailed directly to accounts@company.com..."
                  className="w-full p-3 text-xs rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40 font-mono"
                />
                <button
                  type="submit"
                  disabled={savingNote || noteDraft === privateNote}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingNote ? "Saving..." : "Save Private Note"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right 2 Columns: Orders List & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders Table */}
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#6A2CFF]" />
                  <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8]">
                    Order History ({orders.length})
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 text-[#8A829E] uppercase font-mono tracking-wider">
                    <tr>
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5 text-right">Total</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-400 font-mono">
                          No orders on record.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#6A2CFF]">
                            <Link href={`/admin/orders/${o.orderNumber}`} className="hover:underline">
                              {o.orderNumber}
                            </Link>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-zinc-500">{formatIST(o.createdAt)}</td>
                          <td className="p-3.5">
                            <OrderStatusBadge status={o.status} size="sm" />
                          </td>
                          <td className="p-3.5 text-zinc-600 dark:text-zinc-300">
                            {o.items?.reduce((sum, it) => sum + it.qty, 0) || 0} pcs
                          </td>
                          <td className="p-3.5 text-right font-mono font-semibold text-[#15101F] dark:text-[#F5F0E8]">
                            {formatINR(o.total)}
                          </td>
                          <td className="p-3.5 text-right">
                            <Link
                              href={`/admin/orders/${o.orderNumber}`}
                              className="inline-flex items-center gap-1 text-[11px] text-[#6A2CFF] hover:underline"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8]">
                  Verified Reviews Left by Customer ({reviews.length})
                </h3>
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-zinc-400 italic font-mono py-2">
                  Customer has not submitted product reviews yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  r.rating >= s ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{r.title}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            r.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{r.body}</p>
                      {r.adminReply && (
                        <div className="p-2.5 rounded-lg bg-[#6A2CFF]/5 border border-[#6A2CFF]/20 text-[11px] text-[#6A2CFF]">
                          <strong className="block text-[10px] uppercase font-mono">Purple Friday Official Response:</strong>
                          {r.adminReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
