"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Layers,
  History,
  FileText,
  Send,
  MessageSquare,
  RefreshCw,
  Printer,
  XCircle,
  Download,
  Edit3,
  X,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { RtoRiskBadge } from "@/components/admin/RtoRiskBadge";
import { MaskedOrderDetail } from "@/server/orders/orders-service";
import { OrderStatus } from "@/server/orders/state-machine";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);

  const [order, setOrder] = useState<MaskedOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ITEMS" | "TIMELINE" | "NOTES" | "ISSUES">("ITEMS");
  const [issues, setIssues] = useState<Array<{
    id: string;
    reason: string;
    comment: string;
    photoUrls?: string[];
    status: string;
    createdAt: string;
  }>>([]);
  const [issueReplyText, setIssueReplyText] = useState("");
  const [submittingIssueAction, setSubmittingIssueAction] = useState(false);

  // State Transition Modal
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<OrderStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  // Address Editing Modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPin, setAddrPin] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // Refund Modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmountRs, setRefundAmountRs] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Mark Order as Paid Modal
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [markPaidMethod, setMarkPaidMethod] = useState<"COD" | "UPI" | "BANK_TRANSFER">("COD");
  const [markPaidAmountRs, setMarkPaidAmountRs] = useState("");
  const [markPaidReference, setMarkPaidReference] = useState("");
  const [markPaidNote, setMarkPaidNote] = useState("");
  const [submittingMarkPaid, setSubmittingMarkPaid] = useState(false);


  // Mockup Email sending State
  const [sendingMockup, setSendingMockup] = useState(false);

  // Internal Note form
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderNumber}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data.order);
      if (data.order?.shippingAddress) {
        setAddrLine1(data.order.shippingAddress.line1 || "");
        setAddrLine2(data.order.shippingAddress.line2 || "");
        setAddrCity(data.order.shippingAddress.city || "");
        setAddrState(data.order.shippingAddress.state || "");
        setAddrPin(data.order.shippingAddress.pin || "");
      }

      // Fetch problem reports / issues
      try {
        const issuesRes = await fetch(`/api/admin/orders/${orderNumber}/issues`);
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          setIssues(issuesData.issues || []);
        }
      } catch { }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load order";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  const handleIssueAction = async (action: "reply" | "resolve" | "refund", customMsg?: string) => {
    const message = customMsg || issueReplyText;
    if (!message.trim()) {
      toast.error("Please enter a note or message.");
      return;
    }
    setSubmittingIssueAction(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(data.message || `Action ${action} executed.`);
      setIssueReplyText("");
      fetchOrderDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSubmittingIssueAction(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Format currency in INR
  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  // Format date in Asia/Kolkata
  const formatIST = (isoString?: string | null) => {
    if (!isoString) return "—";
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
      return "—";
    }
  };

  const handleOpenTransitionModal = (target: OrderStatus) => {
    setSelectedTargetStatus(target);
    setTransitionReason("");
    setTransitionModalOpen(true);
  };

  const handleExecuteTransition = async () => {
    if (!selectedTargetStatus || !order) return;
    if (selectedTargetStatus === "CANCELLED" && !transitionReason.trim()) {
      toast.error("A detailed reason is required to cancel an order.");
      return;
    }

    setTransitioning(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedTargetStatus,
          reason: transitionReason,
          expectedVersion: order.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transition failed");

      toast.success(`Order moved to ${selectedTargetStatus}`);
      setTransitionModalOpen(false);
      fetchOrderDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transition failed";
      toast.error(msg);
    } finally {
      setTransitioning(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!addrLine1.trim() || !addrCity.trim() || !addrState.trim() || !addrPin.trim()) {
      toast.error("Please fill in Line 1, City, State, and PIN code.");
      return;
    }

    setSavingAddress(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            line1: addrLine1.trim(),
            line2: addrLine2.trim() || undefined,
            city: addrCity.trim(),
            state: addrState.trim(),
            pin: addrPin.trim(),
            country: "India",
          },
          expectedVersion: order.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update address");

      toast.success("Delivery address updated and audited.");
      setAddressModalOpen(false);
      fetchOrderDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSendMockupEmail = async () => {
    if (!order) return;
    setSendingMockup(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/send-mockup`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send mockup");

      toast.success(data.emailSent ? "Mockup sent to customer email!" : "Mockup sent! (Approval link generated)");
      fetchOrderDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send mockup";
      toast.error(msg);
    } finally {
      setSendingMockup(false);
    }
  };

  const handleMarkPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingMarkPaid(true);
    try {
      const amountPaise = markPaidAmountRs ? Math.round(parseFloat(markPaidAmountRs) * 100) : order.total;
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/collect-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: markPaidMethod,
          amountPaise,
          reference: markPaidReference.trim() || undefined,
          expectedVersion: order.version,
          notes: markPaidNote.trim() || "Payment marked as paid by admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark order as paid");

      toast.success("Payment recorded successfully!");
      setMarkPaidModalOpen(false);
      fetchOrderDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment";
      toast.error(msg);
    } finally {
      setSubmittingMarkPaid(false);
    }
  };

    const handleRecordRefund = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!order) return;
      const amountRs = parseFloat(refundAmountRs);
      if (isNaN(amountRs) || amountRs <= 0) {
        toast.error("Please enter a valid refund amount.");
        return;
      }
      if (!refundReason.trim() || refundReason.trim().length < 5) {
        toast.error("Please enter a reason with at least 5 characters.");
        return;
      }

      setSubmittingRefund(true);
      try {
        const amountPaise = Math.round(amountRs * 100);
        const res = await fetch(`/api/admin/orders/${order.orderNumber}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountPaise,
            reason: refundReason.trim(),
            idempotencyKey: `ref_${order.orderNumber}_${Date.now()}`,
            type: "MANUAL",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Refund recording failed");

        toast.success("Refund recorded successfully.");
        setRefundModalOpen(false);
        setRefundAmountRs("");
        setRefundReason("");
        fetchOrderDetail();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Refund failed";
        toast.error(msg);
      } finally {
        setSubmittingRefund(false);
      }
    };

    const handleAddInternalNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newNote.trim() || !order) return;

      setAddingNote(true);
      try {
        const res = await fetch(`/api/admin/orders/${order.orderNumber}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: newNote }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add note");

        toast.success("Internal note added.");
        setNewNote("");
        fetchOrderDetail();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Note failed";
        toast.error(msg);
      } finally {
        setAddingNote(false);
      }
    };

    if (loading) {
      return (
        <div className="py-24 text-center text-zinc-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#6A2CFF] mb-3" />
          <p className="text-sm font-medium">Loading order details and pipeline history...</p>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="py-20 text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#15101F] dark:text-[#F5F0E8]">Order Not Found</h2>
          <p className="text-sm text-zinc-500">Order #{orderNumber} does not exist or has been archived.</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>
        </div>
      );
    }

    // Address editable strictly before dispatch
    const canEditAddress = !["DISPATCHED", "DELIVERED", "CANCELLED", "REFUNDED", "RTO"].includes(order.status);

    // WhatsApp wa.me prefilled message
    const customerPhoneClean = (order.customerPhone || "").replace(/\D/g, "");
    const proofUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/proof/${order.approvalTokenHash || order.orderNumber}`;
    const waText = `Hello ${order.customerName}, your custom merchandise mockup for Order #${order.orderNumber} is ready! Please review and approve your proof here: ${proofUrl}`;
    const waMeLink = `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(waText)}`;

    // Filter events and notes
    const events = order.events || [];
    const internalNotes = events.filter((e) => e.type === "INTERNAL_NOTE");

    return (
      <div className="space-y-6 pb-16">
        {/* Top Breadcrumb & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-[#15101F] dark:text-[#F5F0E8]">
                  {order.orderNumber}
                </h1>
                <OrderStatusBadge status={order.status} />
                <RtoRiskBadge
                  score={order.rtoRiskScore ?? undefined}
                  reasons={order.rtoRiskReasons}
                  overridden={Boolean(order.rtoRiskOverrideReason)}
                />
              </div>
              <p className="text-xs text-[#8A829E] mt-1 font-mono">
                Created {formatIST(order.createdAt)} • Version {order.version} (Optimistic Locking Active)
              </p>
            </div>
          </div>

          {/* Action Controls & GST Invoice Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* GST Invoice PDF Download */}
            <a
              href={`/api/admin/orders/${order.orderNumber}/invoice`}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#15101F] dark:text-[#F5F0E8] transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#6A2CFF]" />
              <span>Tax Invoice (PDF)</span>
            </a>

            {/* Permitted Next Action Buttons (Driven strictly by canTransition) */}
            {order.allowedTransitions && order.allowedTransitions.length > 0 ? (
              order.allowedTransitions.map((t) => {
                const isDanger = t.target === "CANCELLED" || t.target === "REFUNDED" || t.target === "RTO";
                return (
                  <button
                    key={t.target}
                    onClick={() => handleOpenTransitionModal(t.target)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm ${isDanger
                      ? "border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                      : "bg-[#6A2CFF] text-white hover:bg-[#5822db]"
                      }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-zinc-400 italic">No next actions permitted</span>
            )}
          </div>
        </div>

        {/* Proof Flow Communication Strip */}
        <div className="p-4 rounded-2xl bg-[#6A2CFF]/5 border border-[#6A2CFF]/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-[#6A2CFF] dark:text-[#CDB8FF] uppercase tracking-wider">
                Proof Review & Approval Flow
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-white/10 text-[#6A2CFF]">
                {order.status === "CUSTOMER_APPROVED"
                  ? "Client Approved"
                  : order.status === "REVISION_REQUESTED"
                    ? "Revision Requested"
                    : order.status === "MOCKUP_SENT"
                      ? "Mockup with Client"
                      : "In Preparation"}
              </span>
            </div>
            {events.find((e) => e.status === "REVISION_REQUESTED" || e.status === "CUSTOMER_APPROVED") && (
              <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">
                Latest client decision ({formatIST(events.find((e) => e.status === "REVISION_REQUESTED" || e.status === "CUSTOMER_APPROVED")?.createdAt)}): &ldquo;{events.find((e) => e.status === "REVISION_REQUESTED" || e.status === "CUSTOMER_APPROVED")?.message}&rdquo;
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendMockupEmail}
              disabled={sendingMockup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/15 text-xs font-semibold text-[#15101F] dark:text-white transition-all shadow-sm"
            >
              {sendingMockup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-[#6A2CFF]" />}
              <span>Send Mockup by Email</span>
            </button>

            {customerPhoneClean && (
              <a
                href={waMeLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>wa.me WhatsApp</span>
              </a>
            )}

            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Public Proof View</span>
            </a>
          </div>
        </div>

        {/* Main Grid: Details + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Tabs (Items, Timeline, Notes) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
              {[
                { id: "ITEMS", label: `Order Items (${order.items.length})`, icon: Layers },
                { id: "TIMELINE", label: `Timeline (${events.length})`, icon: History },
                { id: "NOTES", label: `Notes (${internalNotes.length})`, icon: FileText },
                { id: "ISSUES", label: `Issues (${issues.length})`, icon: AlertCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${isActive
                      ? "bg-[#6A2CFF] text-white font-semibold shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: ORDER ITEMS */}
            {activeTab === "ITEMS" && (
              <div className="space-y-4">
                {order.items.map((item, idx) => {
                  const productName = (item.options?.productName as string) || item.productId;
                  const colorVariant = (item.options?.colorVariant as string) || (item.options?.color as string) || "Standard";
                  const lineTotal = item.qty * item.unitPrice;
                  const sizeBreakdown = (item.options?.sizeBreakdown || item.options?.sizes) as Record<string, number> | undefined;

                  return (
                    <div
                      key={item.id || idx}
                      className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-white/5 pb-3">
                        <div>
                          <h3 className="font-bold text-sm text-[#15101F] dark:text-[#F5F0E8]">
                            {productName}
                          </h3>
                          <p className="text-xs font-mono text-[#8A829E]">
                            Colour: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{colorVariant}</span> • Quantity: {item.qty} pcs
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-[#15101F] dark:text-[#F5F0E8]">
                            {formatINR(lineTotal)}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {formatINR(item.unitPrice)} each
                          </span>
                        </div>
                      </div>

                      {/* Size Split Breakdown */}
                      {sizeBreakdown && Object.keys(sizeBreakdown).length > 0 && (
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                          <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            Size Distribution Breakdown
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(sizeBreakdown).map(([size, count]) => (
                              <div
                                key={size}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-mono"
                              >
                                <span className="font-bold text-[#6A2CFF]">{size}:</span>
                                <span className="text-[#15101F] dark:text-[#F5F0E8]">{String(count)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Artwork & Mockup Side-by-Side Previews */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Customer Artwork */}
                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                              Original Artwork
                            </span>
                            {item.artworkUrl && (
                              <a
                                href={item.artworkUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6A2CFF] hover:underline"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download File</span>
                              </a>
                            )}
                          </div>
                          <div className="relative aspect-video rounded-lg bg-zinc-100 dark:bg-white/5 overflow-hidden flex items-center justify-center border border-dashed border-zinc-200 dark:border-white/10">
                            {item.artworkUrl ? (
                              <Image
                                src={item.artworkUrl}
                                alt="Customer Artwork"
                                fill
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="text-xs font-mono text-zinc-400">No artwork attached</span>
                            )}
                          </div>
                        </div>

                        {/* Generated Mockup */}
                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                              Production Mockup
                            </span>
                            {item.mockupUrl && (
                              <a
                                href={item.mockupUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6A2CFF] hover:underline"
                              >
                                <Download className="w-3 h-3" />
                                <span>Preview Full</span>
                              </a>
                            )}
                          </div>
                          <div className="relative aspect-video rounded-lg bg-zinc-100 dark:bg-white/5 overflow-hidden flex items-center justify-center border border-dashed border-zinc-200 dark:border-white/10">
                            {item.mockupUrl ? (
                              <Image
                                src={item.mockupUrl}
                                alt="Production Mockup"
                                fill
                                className="object-contain p-2"
                              />
                            ) : (
                              <span className="text-xs font-mono text-zinc-400">Mockup pending generation</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TIMELINE */}
            {activeTab === "TIMELINE" && (
              <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-[#15101F] dark:text-[#F5F0E8] border-b border-zinc-100 dark:border-white/5 pb-2">
                  Order Lifecycle Timeline
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-white/10">
                  {events.map((evt, idx) => (
                    <div key={`${evt.id}-${idx}`} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-[#15101F] border-[#6A2CFF]" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <OrderStatusBadge status={evt.status} size="sm" />
                          <span className="text-[11px] text-[#8A829E] font-mono">{formatIST(evt.createdAt)}</span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{evt.message}</p>
                        <span className="text-[10px] font-mono text-zinc-400">Actor: {evt.actor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: INTERNAL NOTES */}
            {activeTab === "NOTES" && (
              <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-[#15101F] dark:text-[#F5F0E8] border-b border-zinc-100 dark:border-white/5 pb-2">
                  Internal Private Staff Notes
                </h3>

                <div className="space-y-3">
                  {internalNotes.length > 0 ? (
                    internalNotes.map((note, idx) => (
                      <div
                        key={`${note.id}-${idx}`}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs space-y-1"
                      >
                        <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{note.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>{note.actor}</span>
                          <span>{formatIST(note.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No staff notes recorded yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a private operational note (customer never sees this)..."
                    rows={3}
                    className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    className="px-4 py-2 rounded-xl bg-[#6A2CFF] hover:bg-[#5822db] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    {addingNote ? "Adding..." : "Add Private Note"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: PROBLEM REPORTS & ISSUES */}
            {activeTab === "ISSUES" && (
              <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>Customer Reported Issues</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Manage defect claims, post-delivery disputes, and staff resolutions.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {issues.length} {issues.length === 1 ? "Report" : "Reports"}
                  </span>
                </div>

                {issues.length > 0 ? (
                  <div className="space-y-4">
                    {issues.map((iss) => (
                      <div
                        key={iss.id}
                        className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-[#15101F] dark:text-[#F5F0E8]">
                              Reason: {iss.reason}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              Reported on {formatIST(iss.createdAt)}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${iss.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : iss.status === "REFUNDED"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                              }`}
                          >
                            {iss.status}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-white/5 p-3 rounded-lg border border-zinc-200 dark:border-white/10">
                          {iss.comment}
                        </p>

                        {iss.photoUrls && iss.photoUrls.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                              Attached Photo Evidence ({iss.photoUrls.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {iss.photoUrls.map((url, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 hover:opacity-80 transition-opacity"
                                >
                                  <Image
                                    src={url}
                                    alt={`Defect photo ${pIdx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-400 italic">
                    No problem reports recorded for this order.
                  </div>
                )}

                {/* Action Form: Reply, Resolve, Refund */}
                <div className="pt-4 border-t border-zinc-100 dark:border-white/5 space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase text-[#15101F] dark:text-[#F5F0E8]">
                    Take Action & Respond to Customer
                  </label>
                  <textarea
                    value={issueReplyText}
                    onChange={(e) => setIssueReplyText(e.target.value)}
                    placeholder="Enter response, resolution details, or refund explanation for customer..."
                    rows={3}
                    className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40 font-sans"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={submittingIssueAction || !issueReplyText.trim()}
                      onClick={() => handleIssueAction("reply")}
                      className="px-3.5 py-2 rounded-xl bg-[#6A2CFF] hover:bg-[#5822db] text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                    >
                      Send Reply Email
                    </button>
                    <button
                      type="button"
                      disabled={submittingIssueAction || !issueReplyText.trim()}
                      onClick={() => handleIssueAction("resolve")}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                    >
                      Mark Resolved & Notify
                    </button>
                    <button
                      type="button"
                      disabled={submittingIssueAction || !issueReplyText.trim()}
                      onClick={() => handleIssueAction("refund")}
                      className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                    >
                      Approve Refund & Notify
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Col: Customer, Shipping Address & Payment Cards */}
          <div className="space-y-6">
            {/* Customer Profile Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-2">
                <User className="w-4 h-4 text-[#6A2CFF]" />
                <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-[#15101F] dark:text-[#F5F0E8]">
                  Customer Profile
                </h3>
              </div>
              <div className="text-xs space-y-1.5 font-mono">
                <div className="font-bold text-[#15101F] dark:text-[#F5F0E8] text-sm">
                  {order.customerName}
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">{order.customerEmail}</div>
                <div className="text-zinc-600 dark:text-zinc-400">{order.customerPhone || "—"}</div>
                {order.companyName && (
                  <div className="text-zinc-700 dark:text-zinc-300 font-semibold">
                    Company: {order.companyName}
                  </div>
                )}
                {order.gstin && (
                  <div className="text-zinc-500 text-[11px]">GSTIN: {order.gstin}</div>
                )}
              </div>
            </div>

            {/* Shipping Address Card (Editable before dispatch) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6A2CFF]" />
                  <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-[#15101F] dark:text-[#F5F0E8]">
                    Delivery Address
                  </h3>
                </div>
                {canEditAddress ? (
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6A2CFF] hover:underline font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Address</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 italic">Locked</span>
                )}
              </div>

              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300 font-mono">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pin}
                </p>
                <p className="text-zinc-400 text-[11px]">India</p>
              </div>

              {order.courierName && (
                <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-white/5 text-xs font-mono">
                  <span className="text-zinc-400 block text-[10px] uppercase">Courier & Tracking:</span>
                  <span className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{order.courierName}</span>
                  {order.trackingNumber && (
                    <span className="text-zinc-500 block">AWB: {order.trackingNumber}</span>
                  )}
                </div>
              )}
            </div>

            {/* Payment & Financial Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#6A2CFF]" />
                  <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-[#15101F] dark:text-[#F5F0E8]">
                    Payment & Balance
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {order.paymentStatus === "PAID" ? "Paid" : "Cash on Delivery, Pending"}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Payment Method</span>
                  <span className="font-bold text-[#15101F] dark:text-[#F5F0E8]">
                    {order.paymentStatus === "PAID" ? (order.paymentMethod || "COD") : "Cash on Delivery / Pay Later"}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500">
                  <span>GST (18%)</span>
                  <span>{formatINR(order.gst)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#15101F] dark:text-[#F5F0E8] border-t border-zinc-100 dark:border-white/5 pt-2">
                  <span>Total Amount</span>
                  <span>{formatINR(order.total)}</span>
                </div>

                {/* Mark as Paid Action */}
                {order.paymentStatus !== "PAID" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMarkPaidAmountRs((order.total / 100).toFixed(0));
                        setMarkPaidReference("");
                        setMarkPaidNote("Collected on delivery");
                        setMarkPaidModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs font-mono transition-colors shadow-sm"
                    >
                      Mark as Paid
                    </button>
                  </div>
                )}

                {/* Recorded Payment Reference */}
                {order.paymentStatus === "PAID" && (order as unknown as Record<string, string>)["paymentReference"] && (
                  <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-white/5">
                    <span>Reference: {(order as unknown as Record<string, string>)["paymentReference"]}</span>
                  </div>
                )}

                {/* Record Refund Trigger */}
                <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setRefundModalOpen(true)}
                    disabled={order.paymentStatus !== "PAID"}
                    className="w-full py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Record Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* MODAL 1: STATE TRANSITION & CANCELLATION REASON */}
          {transitionModalOpen && selectedTargetStatus && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#15101F] rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="font-bold text-base text-[#15101F] dark:text-[#F5F0E8]">
                    {selectedTargetStatus === "CANCELLED" ? "Cancel Order" : "Change Order Status"}
                  </h3>
                  <button onClick={() => setTransitionModalOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  Moving order to status: <strong className="text-[#6A2CFF]">{selectedTargetStatus}</strong>
                </p>

                {selectedTargetStatus === "CANCELLED" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                      Cancellation Justification (Required) *
                    </label>
                    <textarea
                      value={transitionReason}
                      onChange={(e) => setTransitionReason(e.target.value)}
                      placeholder="Explain why this order is being cancelled (audited log entry)..."
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-500 block">Audit Note / Comment (Optional)</label>
                    <input
                      type="text"
                      value={transitionReason}
                      onChange={(e) => setTransitionReason(e.target.value)}
                      placeholder="Optional transition note..."
                      className="w-full p-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setTransitionModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteTransition}
                    disabled={transitioning}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${selectedTargetStatus === "CANCELLED" ? "bg-rose-600 hover:bg-rose-700" : "bg-[#6A2CFF] hover:bg-[#5822db]"
                      }`}
                  >
                    {transitioning ? "Updating..." : "Confirm Transition"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: EDIT DELIVERY ADDRESS */}
          {addressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <form onSubmit={handleSaveAddress} className="bg-white dark:bg-[#15101F] rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="font-bold text-base text-[#15101F] dark:text-[#F5F0E8]">
                    Edit Delivery Address
                  </h3>
                  <button type="button" onClick={() => setAddressModalOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-zinc-500 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      value={addrLine1}
                      onChange={(e) => setAddrLine1(e.target.value)}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={addrLine2}
                      onChange={(e) => setAddrLine2(e.target.value)}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-500 mb-1">City *</label>
                      <input
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">State *</label>
                      <input
                        type="text"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">PIN Code (6 digits) *</label>
                    <input
                      type="text"
                      value={addrPin}
                      onChange={(e) => setAddrPin(e.target.value)}
                      maxLength={6}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-4 py-1.5 rounded-xl bg-[#6A2CFF] hover:bg-[#5822db] text-white text-xs font-bold"
                  >
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODAL 3: RECORD REFUND */}
          {refundModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <form onSubmit={handleRecordRefund} className="bg-white dark:bg-[#15101F] rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="font-bold text-base text-[#15101F] dark:text-[#F5F0E8]">
                    Record Refund
                  </h3>
                  <button type="button" onClick={() => setRefundModalOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-zinc-500 mb-1">Refund Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={refundAmountRs}
                      onChange={(e) => setRefundAmountRs(e.target.value)}
                      placeholder={`Max ₹${(order.total / 100).toFixed(0)}`}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Reason for Refund (min 5 chars) *</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explain refund reason (e.g., Client cancelled prior to printing)..."
                      rows={3}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setRefundModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRefund}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    {submittingRefund ? "Recording..." : "Record Refund"}
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* MODAL 4: MARK ORDER AS PAID */}
          {markPaidModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <form onSubmit={handleMarkPaidSubmit} className="bg-white dark:bg-[#15101F] rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                  <h3 className="font-bold text-base text-[#15101F] dark:text-[#F5F0E8]">
                    Mark Order as Paid
                  </h3>
                  <button type="button" onClick={() => setMarkPaidModalOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-zinc-500 mb-1">Payment Method *</label>
                    <select
                      value={markPaidMethod}
                      onChange={(e) => setMarkPaidMethod(e.target.value as "COD" | "UPI" | "BANK_TRANSFER")}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                    >
                      <option value="COD">COD Collected (Cash)</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Amount Collected (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={markPaidAmountRs}
                      onChange={(e) => setMarkPaidAmountRs(e.target.value)}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Reference / Transaction ID (Optional)</label>
                    <input
                      type="text"
                      value={markPaidReference}
                      onChange={(e) => setMarkPaidReference(e.target.value)}
                      placeholder="e.g. UPI-123456789 or Receipt #42"
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Reason / Note (Audited) *</label>
                    <textarea
                      value={markPaidNote}
                      onChange={(e) => setMarkPaidNote(e.target.value)}
                      placeholder="e.g. Cash collected by delivery associate upon parcel delivery."
                      rows={2}
                      className="w-full p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[#15101F] dark:text-[#F5F0E8]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setMarkPaidModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMarkPaid}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    {submittingMarkPaid ? "Recording..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        );
}
