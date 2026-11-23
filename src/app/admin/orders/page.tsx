"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Truck,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { MaskedOrderSummary } from "@/server/orders/orders-service";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "AWAITING_APPROVAL", label: "Awaiting Approval" },
  { value: "ISSUE_REPORTED", label: "Issue Reported" },
  { value: "ORDER_PLACED", label: "Order Placed" },
  { value: "ARTWORK_UPLOADED", label: "Artwork Uploaded" },
  { value: "MOCKUP_SENT", label: "Mockup Sent" },
  { value: "REVISION_REQUESTED", label: "Revision Requested" },
  { value: "CUSTOMER_APPROVED", label: "Customer Approved" },
  { value: "IN_PRINTING", label: "In Printing" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "RTO", label: "RTO (Returned)" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "ALL", label: "All Payment Statuses" },
  { value: "PAID", label: "Paid" },
  { value: "ADVANCE_PAID", label: "Advance Paid (COD)" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_REFUNDED", label: "Partially Refunded" },
  { value: "REFUNDED", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "ALL", label: "All Methods" },
  { value: "COD", label: "Cash on Delivery / Pay Later" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

export default function AdminOrdersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentStatus = searchParams.get("status") || "ALL";
  const currentQuery = searchParams.get("q") || "";
  const currentOverdue = searchParams.get("overdue") === "true";
  const currentPaymentStatus = searchParams.get("paymentStatus") || "ALL";
  const currentPaymentMethod = searchParams.get("paymentMethod") || "ALL";
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const currentMinAmount = searchParams.get("minAmount") || "";
  const currentMaxAmount = searchParams.get("maxAmount") || "";
  const currentCityOrPin = searchParams.get("cityOrPin") || "";
  const currentCoupon = searchParams.get("coupon") || "";
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

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

  // Advanced Filters Drawer Toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    Boolean(
      currentDateFrom ||
      currentDateTo ||
      currentMinAmount ||
      currentMaxAmount ||
      currentCityOrPin ||
      currentCoupon ||
      currentPaymentMethod !== "ALL" ||
      currentPaymentStatus !== "ALL"
    )
  );

  // Filter input state
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(currentPaymentStatus);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(currentPaymentMethod);
  const [isOverdueOnly, setIsOverdueOnly] = useState(currentOverdue);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);
  const [minAmount, setMinAmount] = useState(currentMinAmount);
  const [maxAmount, setMaxAmount] = useState(currentMaxAmount);
  const [cityOrPin, setCityOrPin] = useState(currentCityOrPin);
  const [coupon, setCoupon] = useState(currentCoupon);

  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Bulk action modals
  const [bulkShipModalOpen, setBulkShipModalOpen] = useState(false);
  const [bulkCancelModalOpen, setBulkCancelModalOpen] = useState(false);
  const [bulkCourierName, setBulkCourierName] = useState("BlueDart");
  const [bulkTrackingNumber, setBulkTrackingNumber] = useState("");
  const [bulkCancelReason, setBulkCancelReason] = useState("");
  const [executingBulk, setExecutingBulk] = useState(false);

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
    (opts: {
      page?: number;
      q?: string;
      status?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      overdue?: boolean;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: string;
      maxAmount?: string;
      cityOrPin?: string;
      coupon?: string;
    }) => {
      const p = new URLSearchParams();
      const page = opts.page ?? currentPage;
      const q = opts.q ?? searchInput;
      const status = opts.status ?? selectedStatus;
      const paymentStatus = opts.paymentStatus ?? selectedPaymentStatus;
      const paymentMethod = opts.paymentMethod ?? selectedPaymentMethod;
      const overdue = opts.overdue ?? isOverdueOnly;
      const dFrom = opts.dateFrom ?? dateFrom;
      const dTo = opts.dateTo ?? dateTo;
      const minA = opts.minAmount ?? minAmount;
      const maxA = opts.maxAmount ?? maxAmount;
      const cPin = opts.cityOrPin ?? cityOrPin;
      const cCode = opts.coupon ?? coupon;

      if (page > 1) p.set("page", String(page));
      if (q.trim()) p.set("q", q.trim());
      if (status !== "ALL") p.set("status", status);
      if (paymentStatus !== "ALL") p.set("paymentStatus", paymentStatus);
      if (paymentMethod !== "ALL") p.set("paymentMethod", paymentMethod);
      if (overdue) p.set("overdue", "true");
      if (dFrom) p.set("dateFrom", dFrom);
      if (dTo) p.set("dateTo", dTo);
      if (minA) p.set("minAmount", minA);
      if (maxA) p.set("maxAmount", maxA);
      if (cPin.trim()) p.set("cityOrPin", cPin.trim());
      if (cCode.trim()) p.set("coupon", cCode.trim());

      router.push(`/admin/orders?${p.toString()}`);
    },
    [
      currentPage,
      searchInput,
      selectedStatus,
      selectedPaymentStatus,
      selectedPaymentMethod,
      isOverdueOnly,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      cityOrPin,
      coupon,
      router,
    ]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", String(currentPage));
      query.set("pageSize", "10");
      if (currentQuery) query.set("q", currentQuery);
      if (currentStatus !== "ALL") query.set("status", currentStatus);
      if (currentPaymentStatus !== "ALL") query.set("paymentStatus", currentPaymentStatus);
      if (currentPaymentMethod !== "ALL") query.set("paymentMethod", currentPaymentMethod);
      if (currentOverdue) query.set("overdue", "true");
      if (currentDateFrom) query.set("dateFrom", currentDateFrom);
      if (currentDateTo) query.set("dateTo", currentDateTo);
      if (currentMinAmount) query.set("minAmount", currentMinAmount);
      if (currentMaxAmount) query.set("maxAmount", currentMaxAmount);
      if (currentCityOrPin) query.set("cityOrPin", currentCityOrPin);
      if (currentCoupon) query.set("coupon", currentCoupon);
      query.set("sortBy", currentSortBy);
      query.set("sortOrder", currentSortOrder);

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
  }, [
    currentPage,
    currentQuery,
    currentStatus,
    currentPaymentStatus,
    currentPaymentMethod,
    currentOverdue,
    currentDateFrom,
    currentDateTo,
    currentMinAmount,
    currentMaxAmount,
    currentCityOrPin,
    currentCoupon,
    currentSortBy,
    currentSortOrder,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ page: 1, q: searchInput });
  };

  const handleExportCsv = async () => {
    toast.info("Generating safe CSV export (cells sanitized)...");
    try {
      const query = new URLSearchParams();
      query.set("export", "csv");
      if (currentQuery) query.set("q", currentQuery);
      if (currentStatus !== "ALL") query.set("status", currentStatus);
      if (currentPaymentStatus !== "ALL") query.set("paymentStatus", currentPaymentStatus);
      if (currentPaymentMethod !== "ALL") query.set("paymentMethod", currentPaymentMethod);
      if (currentOverdue) query.set("overdue", "true");
      if (currentDateFrom) query.set("dateFrom", currentDateFrom);
      if (currentDateTo) query.set("dateTo", currentDateTo);
      if (currentMinAmount) query.set("minAmount", currentMinAmount);
      if (currentMaxAmount) query.set("maxAmount", currentMaxAmount);
      if (currentCityOrPin) query.set("cityOrPin", currentCityOrPin);
      if (currentCoupon) query.set("coupon", currentCoupon);

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

  // Bulk actions execution
  const executeBulkStatusChange = async (
    targetStatus: "DISPATCHED" | "DELIVERED" | "CANCELLED",
    details?: { courierName?: string; trackingNumber?: string; reason?: string }
  ) => {
    if (selectedOrders.length === 0) return;
    setExecutingBulk(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_STATUS",
          orderNumbers: selectedOrders,
          targetStatus,
          ...details,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");

      toast.success(
        `Bulk updated: ${data.successCount} succeeded${data.failureCount > 0 ? `, ${data.failureCount} failed` : ""
        }`
      );
      setSelectedOrders([]);
      setBulkShipModalOpen(false);
      setBulkCancelModalOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk action failed";
      toast.error(msg);
    } finally {
      setExecutingBulk(false);
    }
  };

  const handlePrintInvoices = () => {
    if (selectedOrders.length === 0) return;
    for (const orderNum of selectedOrders) {
      window.open(`/api/admin/orders/${orderNum}/invoice`, "_blank");
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
            Real-time tracking, courier dispatch, payments, and SLA compliance.
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
          <p
            className={`text-2xl font-bold mt-1 ${stats.overdueCount > 0 ? "text-rose-600 animate-pulse" : "text-emerald-600"
              }`}
          >
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
              placeholder="Search by order #, customer, phone, tracking #, PIN..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/90 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
            />
          </form>

          {/* Core Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  pushParams({ page: 1, status: e.target.value });
                }}
                className="pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-white/90 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40 appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-white dark:bg-[#15101F] text-black dark:text-white"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                const next = !isOverdueOnly;
                setIsOverdueOnly(next);
                pushParams({ page: 1, overdue: next });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${isOverdueOnly
                ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                : "bg-white/70 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white"
                }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue Only</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${showAdvancedFilters
                ? "bg-[#6A2CFF]/10 border-[#6A2CFF]/30 text-[#6A2CFF]"
                : "bg-white/70 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-white"
                }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
            </button>

            {/* Clear filters if active */}
            {(currentStatus !== "ALL" ||
              currentQuery ||
              currentOverdue ||
              currentPaymentStatus !== "ALL" ||
              currentPaymentMethod !== "ALL" ||
              currentDateFrom ||
              currentDateTo ||
              currentMinAmount ||
              currentMaxAmount ||
              currentCityOrPin ||
              currentCoupon) && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSelectedStatus("ALL");
                    setSelectedPaymentStatus("ALL");
                    setSelectedPaymentMethod("ALL");
                    setIsOverdueOnly(false);
                    setDateFrom("");
                    setDateTo("");
                    setMinAmount("");
                    setMaxAmount("");
                    setCityOrPin("");
                    setCoupon("");
                    router.push("/admin/orders");
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Row */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-zinc-200/60 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {/* Payment Status */}
            <div>
              <label className="text-[10px] font-mono uppercase text-[#8A829E] block mb-1">Payment Status</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value);
                  pushParams({ page: 1, paymentStatus: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
              >
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-[#15101F]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[10px] font-mono uppercase text-[#8A829E] block mb-1">Payment Method</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => {
                  setSelectedPaymentMethod(e.target.value);
                  pushParams({ page: 1, paymentMethod: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
              >
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-[#15101F]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City or PIN */}
            <div>
              <label className="text-[10px] font-mono uppercase text-[#8A829E] block mb-1">City or PIN</label>
              <input
                type="text"
                value={cityOrPin}
                placeholder="e.g. Mumbai or 560103"
                onChange={(e) => setCityOrPin(e.target.value)}
                onBlur={() => pushParams({ page: 1, cityOrPin })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
              />
            </div>

            {/* Min / Max Amount */}
            <div>
              <label className="text-[10px] font-mono uppercase text-[#8A829E] block mb-1">Amount Range (₹)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  onBlur={() => pushParams({ page: 1, minAmount })}
                  className="w-1/2 px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  onBlur={() => pushParams({ page: 1, maxAmount })}
                  className="w-1/2 px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-[10px] font-mono uppercase text-[#8A829E] block mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  pushParams({ page: 1, dateFrom: e.target.value });
                }}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-[#8A829E] block mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  pushParams({ page: 1, dateTo: e.target.value });
                }}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8]"
              />
            </div>
          </div>
        )}

        {/* Bulk Action Bar (when rows selected) */}
        {selectedOrders.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#6A2CFF]/10 border border-[#6A2CFF]/20 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-[#6A2CFF] dark:text-[#CDB8FF]">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkShipModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#6A2CFF] text-white hover:bg-[#5822db] shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Bulk Shipped</span>
              </button>
              <button
                type="button"
                onClick={() => executeBulkStatusChange("DELIVERED")}
                disabled={executingBulk}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bulk Delivered</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkCancelModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Bulk Cancel</span>
              </button>
              <button
                type="button"
                onClick={handlePrintInvoices}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-white/15 bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoices</span>
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
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Courier & Tracking</th>
                <th className="py-3 px-4 text-right">Total</th>
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
                    <p className="text-xs text-zinc-400 mt-1">Try widening your search terms or resetting filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isSelected = selectedOrders.includes(o.orderNumber);
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors ${isSelected ? "bg-[#6A2CFF]/5 dark:bg-[#6A2CFF]/10" : ""
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
                        <div className="text-[11px] text-[#8A829E] truncate max-w-[150px]">{o.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs">{o.productNames.join(", ")}</div>
                        <div className="text-[11px] text-[#8A829E] mt-0.5">{o.itemCount} units total</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={o.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                          {o.paymentStatus || "PENDING"}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{o.paymentMethod || "COD"}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {o.trackingNumber ? (
                          <div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {o.courierName || "Courier"}
                            </span>
                            <div className="text-[11px] text-[#6A2CFF] mt-0.5">
                              {o.trackingUrl ? (
                                <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="hover:underline">
                                  {o.trackingNumber}
                                </a>
                              ) : (
                                o.trackingNumber
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Pending shipment</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        {formatINR(o.totalPaise)}
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
              onClick={() => pushParams({ page: currentPage - 1 })}
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
              onClick={() => pushParams({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Ship Modal */}
      {bulkShipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeBulkStatusChange("DISPATCHED", {
                courierName: bulkCourierName,
                trackingNumber: bulkTrackingNumber,
              });
            }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15101F] border border-zinc-200 dark:border-white/15 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#6A2CFF]" />
                <span>Bulk Mark Shipped ({selectedOrders.length} orders)</span>
              </h3>
              <button
                type="button"
                onClick={() => setBulkShipModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Courier Service *</label>
                <input
                  type="text"
                  required
                  value={bulkCourierName}
                  onChange={(e) => setBulkCourierName(e.target.value)}
                  placeholder="e.g. BlueDart, Delhivery, DTDC..."
                  className="w-full p-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">
                  AWB / Tracking Number (Batch prefix) *
                </label>
                <input
                  type="text"
                  required
                  value={bulkTrackingNumber}
                  onChange={(e) => setBulkTrackingNumber(e.target.value)}
                  placeholder="e.g. BLUEDART-BATCH-202611"
                  className="w-full p-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkShipModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={executingBulk}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
              >
                {executingBulk ? "Dispatching..." : "Confirm Dispatch"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Cancel Modal */}
      {bulkCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeBulkStatusChange("CANCELLED", { reason: bulkCancelReason });
            }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15101F] border border-rose-300 dark:border-rose-900 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Bulk Cancel ({selectedOrders.length} orders)</span>
              </h3>
              <button
                type="button"
                onClick={() => setBulkCancelModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-zinc-500">
                Cancellation Reason * (Required for audit)
              </label>
              <textarea
                rows={3}
                required
                value={bulkCancelReason}
                onChange={(e) => setBulkCancelReason(e.target.value)}
                placeholder="Explain reason for bulk cancellation..."
                className="w-full p-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkCancelModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={executingBulk || !bulkCancelReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {executingBulk ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
