"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  CheckSquare,
  Square,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderSlaBadge } from "@/components/admin/OrderSlaBadge";
import { MaskedOrderSummary } from "@/server/orders/orders-service";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ORDER_PLACED", label: "Order Placed" },
  { value: "ARTWORK_UPLOADED", label: "Artwork Uploaded" },
  { value: "MOCKUP_SENT", label: "Mockup Sent" },
  { value: "REVISION_REQUESTED", label: "Revision Requested" },
  { value: "CUSTOMER_APPROVED", label: "Customer Approved" },
  { value: "IN_PRINTING", label: "In Printing" },
  { value: "QC_PASSED", label: "QC Passed" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "RTO", label: "RTO (Returned)" },
];

export default function AdminOrdersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentStatus = searchParams.get("status") || "ALL";
  const currentQuery = searchParams.get("q") || "";
  const currentOverdue = searchParams.get("overdue") === "true";

  const [orders, setOrders] = useState<MaskedOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setPages] = useState(1);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingProof: 0,
    inProduction: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter input state
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isOverdueOnly, setIsOverdueOnly] = useState(currentOverdue);

  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDesignerId, setSelectedDesignerId] = useState("usr_des_ananya");
  const [assigning, setAssigning] = useState(false);

  // Format currency in INR
  const formatINR = (paise?: number) => {
    if (paise === undefined) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  // Format date in Asia/Kolkata
  const formatIST = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Sync state to URL and fetch
  const pushParams = useCallback(
    (page: number, q: string, status: string, overdue: boolean) => {
      const p = new URLSearchParams();
      if (page > 1) p.set("page", String(page));
      if (q.trim()) p.set("q", q.trim());
      if (status !== "ALL") p.set("status", status);
      if (overdue) p.set("overdue", "true");
      router.push(`/admin/orders?${p.toString()}`);
    },
    [router]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", String(currentPage));
      query.set("pageSize", "10");
      if (currentQuery) query.set("q", currentQuery);
      if (currentStatus !== "ALL") query.set("status", currentStatus);
      if (currentOverdue) query.set("overdue", "true");

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentQuery, currentStatus, currentOverdue]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams(1, searchInput, selectedStatus, isOverdueOnly);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    pushParams(1, searchInput, val, isOverdueOnly);
  };

  const handleOverdueToggle = () => {
    const next = !isOverdueOnly;
    setIsOverdueOnly(next);
    pushParams(1, searchInput, selectedStatus, next);
  };

  const handleExportCsv = async () => {
    toast.info("Generating DDE-sanitized CSV export...");
    try {
      const query = new URLSearchParams();
      query.set("export", "csv");
      if (currentQuery) query.set("q", currentQuery);
      if (currentStatus !== "ALL") query.set("status", currentStatus);
      if (currentOverdue) query.set("overdue", "true");

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purple_friday_orders_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("CSV export downloaded successfully");
    } catch {
      toast.error("CSV export failed");
    }
  };

  // Checkbox selection
  const toggleSelectOrder = (orderNum: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderNum) ? prev.filter((n) => n !== orderNum) : [...prev, orderNum]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.orderNumber));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedOrders.length === 0) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_ASSIGN_DESIGNER",
          orderNumbers: selectedOrders,
          designerId: selectedDesignerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assignment failed");
      toast.success(`Assigned ${data.count} order(s) to designer.`);
      setAssignModalOpen(false);
      setSelectedOrders([]);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk assign failed";
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#15101F] dark:text-[#F5F0E8]">
            Order Management & Pipeline
          </h1>
          <p className="text-sm text-[#4A4358] dark:text-[#CDB8FF]/70 mt-1">
            Real-time tracking from digital vector ingest to factory dispatch SLA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#15101F] dark:text-[#F5F0E8] transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#6A2CFF]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-all shadow-sm disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8A829E]">Total Orders</span>
          <p className="text-2xl font-bold text-[#15101F] dark:text-[#F5F0E8] mt-1">{stats.totalOrders}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8A829E]">Pending Proof</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingProof}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8A829E]">In Printing</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.inProduction}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8A829E]">Overdue SLA</span>
          <p className={`text-2xl font-bold mt-1 ${stats.overdueCount > 0 ? "text-rose-600 animate-pulse" : "text-emerald-600"}`}>
            {stats.overdueCount}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by PF order #, customer name, phone, email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/90 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
            />
          </form>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-white/90 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40 appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#15101F] text-black dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            <button
              onClick={handleOverdueToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                isOverdueOnly
                  ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                  : "bg-white/70 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue Only</span>
            </button>

            {/* Clear filters if active */}
            {(currentStatus !== "ALL" || currentQuery || currentOverdue) && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSelectedStatus("ALL");
                  setIsOverdueOnly(false);
                  pushParams(1, "", "ALL", false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Bar (when rows selected) */}
        {selectedOrders.length > 0 && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#6A2CFF]/10 border border-[#6A2CFF]/20 animate-in fade-in duration-200">
            <span className="text-xs font-medium text-[#6A2CFF] dark:text-[#CDB8FF]">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAssignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#6A2CFF] text-white hover:bg-[#5822db] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Designer</span>
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Data Table */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 text-[#8A829E] uppercase font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                  >
                    {selectedOrders.length > 0 && selectedOrders.length === orders.length ? (
                      <CheckSquare className="w-4 h-4 text-[#6A2CFF]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Order # / Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Products / Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatch SLA</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Designer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5 text-[#15101F] dark:text-[#F5F0E8]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6A2CFF] mb-2" />
                    <span>Loading pipeline orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-zinc-400">
                    <SlidersHorizontal className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No orders found matching filters</p>
                    <p className="text-xs text-zinc-400 mt-1">Try widening your search terms or clearing status filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isSelected = selectedOrders.includes(o.orderNumber);
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors ${
                        isSelected ? "bg-[#6A2CFF]/5 dark:bg-[#6A2CFF]/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleSelectOrder(o.orderNumber)}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#6A2CFF]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <Link
                          href={`/admin/orders/${o.orderNumber}`}
                          className="font-bold text-[#6A2CFF] dark:text-[#CDB8FF] hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <div className="text-[11px] text-[#8A829E] mt-0.5">{formatIST(o.createdAt)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">{o.customerName}</div>
                        <div className="text-[11px] text-[#8A829E] truncate max-w-[160px]">{o.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs">{o.productNames.join(", ")}</div>
                        <div className="text-[11px] text-[#8A829E] mt-0.5">{o.itemCount} units total</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={o.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderSlaBadge
                          status={o.status}
                          isOverdue={o.isOverdue}
                          hoursRemaining={o.hoursRemaining}
                          isPaused={o.isPaused}
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {o.totalPaise !== undefined ? (
                          <>
                            <div className="font-semibold">{formatINR(o.totalPaise)}</div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              {o.paymentStatus}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-400 italic">Masked (RBAC)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.assignedDesignerName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-[11px] text-[#6A2CFF] dark:text-[#CDB8FF] border border-[#6A2CFF]/20">
                            {o.assignedDesignerName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${o.orderNumber}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-white/10 hover:border-[#6A2CFF]/40 text-[#6A2CFF] dark:text-[#CDB8FF] transition-all hover:bg-[#6A2CFF]/5"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50/30 dark:bg-white/5 text-xs text-zinc-500">
          <div>
            Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{orders.length}</span> of{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{total}</span> orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pushParams(currentPage - 1, currentQuery, currentStatus, currentOverdue)}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => pushParams(currentPage + 1, currentQuery, currentStatus, currentOverdue)}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#F5F0E8] dark:bg-[#15101F] border border-zinc-300 dark:border-white/15 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8]">
              Assign {selectedOrders.length} Order(s) to Designer
            </h3>
            <p className="text-xs text-[#4A4358] dark:text-[#CDB8FF]/70">
              Selected orders will be assigned for artwork review, vector placement, and client proof generation.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A829E]">Select Graphic Designer</label>
              <select
                value={selectedDesignerId}
                onChange={(e) => setSelectedDesignerId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
              >
                <option value="usr_des_ananya">Ananya Deshmukh (Lead Merch Atelier)</option>
                <option value="usr_des_rahul">Rahul Mehta (Print & Vector Specialist)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={assigning}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
              >
                {assigning ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
