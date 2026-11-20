"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Building,
  CreditCard,
  Layers,
  History,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  MessageSquare,
  FileCheck,
  RefreshCw,
  ExternalLink,
  Printer,
  ShieldCheck,
  X,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderSlaBadge } from "@/components/admin/OrderSlaBadge";
import { MaskedOrderDetail } from "@/server/orders/orders-service";
import { OrderStatus } from "@/server/orders/state-machine";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);

  const [order, setOrder] = useState<MaskedOrderDetail | null>(null);
  const [viewerRole, setViewerRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ITEMS" | "TIMELINE" | "NOTES" | "AUDIT">("ITEMS");

  // State Transition Modal
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<OrderStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  // QC Rework Modal
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [reworkNotes, setReworkNotes] = useState("");
  const [submittingRework, setSubmittingRework] = useState(false);

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
      setViewerRole(data.viewerRole || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load order";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

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
      return isoString;
    }
  };

  const handleOpenTransitionModal = (target: OrderStatus) => {
    setSelectedTargetStatus(target);
    setTransitionReason("");
    setTransitionModalOpen(true);
  };

  const executeTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !selectedTargetStatus) return;

    setTransitioning(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedTargetStatus,
          reason: transitionReason.trim() || undefined,
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

  const handleRecordQcRework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !reworkNotes.trim()) return;

    setSubmittingRework(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/rework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reworkNotes: reworkNotes.trim(),
          expectedVersion: order.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to flag QC rework");

      toast.success("QC rework logged on factory floor.");
      setReworkModalOpen(false);
      setReworkNotes("");
      fetchOrderDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "QC rework failed";
      toast.error(msg);
    } finally {
      setSubmittingRework(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderNumber}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote.trim() }),
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

  const isFinancialMasked = ["GRAPHIC_DESIGNER", "FACTORY_MANAGER"].includes(viewerRole.toUpperCase());
  const canPerformQcRework =
    order.status === "IN_PRINTING" &&
    ["SUPER_ADMIN", "ADMIN", "FACTORY_MANAGER"].includes(viewerRole.toUpperCase());

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
              <OrderSlaBadge
                status={order.status}
                isOverdue={order.slaDueAt ? new Date(order.slaDueAt).getTime() < Date.now() : false}
                hoursRemaining={
                  order.slaDueAt
                    ? Math.round((new Date(order.slaDueAt).getTime() - Date.now()) / (3600 * 1000))
                    : null
                }
                isPaused={order.status === "MOCKUP_SENT" || order.status === "REVISION_REQUESTED"}
              />
            </div>
            <p className="text-xs text-[#8A829E] mt-1 font-mono">
              Created {formatIST(order.createdAt)} • Version {order.version} (Optimistic Locking Active)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Production Job Sheet PDF Download */}
          <a
            href={`/api/admin/orders/${order.orderNumber}/jobsheet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#15101F] dark:text-[#F5F0E8] transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#6A2CFF]" />
            <span>Job Sheet PDF</span>
          </a>

          {/* QC Rework Action for Factory Manager on IN_PRINTING */}
          {canPerformQcRework && (
            <button
              onClick={() => setReworkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Flag QC Rework</span>
            </button>
          )}

          {/* Permitted Next Action Buttons (Driven strictly by canTransition) */}
          {order.allowedTransitions && order.allowedTransitions.length > 0 ? (
            order.allowedTransitions.map((t) => {
              const isDanger = t.target === "CANCELLED" || t.target === "REFUNDED" || t.target === "RTO";
              return (
                <button
                  key={t.target}
                  onClick={() => handleOpenTransitionModal(t.target)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm ${
                    isDanger
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
            <span className="text-xs text-zinc-400 italic">No next actions permitted for role: {viewerRole}</span>
          )}
        </div>
      </div>

      {/* Main Grid: Order Details & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items, Mockups, Timeline, Audit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200/80 dark:border-white/10 pb-2">
            {[
              { id: "ITEMS", label: "Line Items & Mockups", icon: Layers },
              { id: "TIMELINE", label: "Status Timeline", icon: History },
              { id: "NOTES", label: "Internal Notes", icon: FileText },
              { id: "AUDIT", label: "Audit Trail", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${
                    isActive
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

          {/* TAB 1: Line Items & Mockups */}
          {activeTab === "ITEMS" && (
            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const options = item.options as Record<string, unknown>;
                const sizeBreakdown = options.sizeBreakdown as Record<string, number> | undefined;
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#8A829E]">Item #{idx + 1}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {item.printMethod || "DTF"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8] mt-0.5">
                          {item.productId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Qty: {item.qty} units
                        </span>
                        {!isFinancialMasked && (
                          <div className="text-xs font-mono text-[#8A829E]">
                            Unit: {formatINR(item.unitPrice)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Size Breakdown Pill Grid */}
                    {sizeBreakdown && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A829E]">
                          Apparel Size Breakdown
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(sizeBreakdown).map(([size, count]) => (
                            <div
                              key={size}
                              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-xs font-mono"
                            >
                              <span className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{size}:</span>{" "}
                              <span className="text-[#6A2CFF] dark:text-[#CDB8FF] font-semibold">{count} pcs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artwork vs Mockup Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {/* Customer Artwork */}
                      <div className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Customer Artwork</span>
                          {item.artworkUrl ? (
                            <a
                              href={item.artworkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#6A2CFF] dark:text-[#CDB8FF] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Original</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-zinc-400">Pending</span>
                          )}
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                          {item.artworkUrl ? (
                            <Image
                              src={item.artworkUrl}
                              alt="Customer artwork file"
                              fill
                              unoptimized
                              className="object-contain p-2"
                            />
                          ) : (
                            <span className="text-xs text-zinc-400">No artwork uploaded yet</span>
                          )}
                        </div>
                      </div>

                      {/* Rendered Mockup Proof */}
                      <div className="p-3.5 rounded-xl border border-purple-200/80 dark:border-[#6A2CFF]/30 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#6A2CFF] dark:text-[#CDB8FF]">
                            Generated Mockup Proof
                          </span>
                          {item.mockupUrl ? (
                            <a
                              href={item.mockupUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#6A2CFF] dark:text-[#CDB8FF] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Proof View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-amber-600">Pending Atelier</span>
                          )}
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-dashed border-[#6A2CFF]/30">
                          {item.mockupUrl ? (
                            <Image
                              src={item.mockupUrl}
                              alt="Generated Mockup Proof"
                              fill
                              unoptimized
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Layers className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                              <span className="text-xs text-zinc-400">Mockup not yet created</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Status Timeline (OrderEvents) */}
          {activeTab === "TIMELINE" && (
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] pb-2 border-b border-zinc-100 dark:border-white/5">
                Audit Timeline of Events & QC Flags
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-white/10">
                {order.events && order.events.length > 0 ? (
                  order.events.map((evt) => {
                    const isQc = evt.type === "QC_REWORK";
                    return (
                      <div key={evt.id} className="relative group">
                        <div
                          className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#15101F] ${
                            isQc ? "border-amber-500 bg-amber-500" : "border-[#6A2CFF]"
                          }`}
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#15101F] dark:text-[#F5F0E8]">{evt.type}</span>
                            <OrderStatusBadge status={evt.status} size="sm" />
                            <span className="text-[11px] text-[#8A829E] font-mono">{formatIST(evt.createdAt)}</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">{evt.message}</p>
                          <div className="text-[11px] text-[#8A829E] font-mono">
                            By {evt.actor} ({evt.actorRole})
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-400">No events logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Internal Notes */}
          {activeTab === "NOTES" && (
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8]">Internal Staff Notes</h3>

              {/* Existing notes */}
              {order.notes ? (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs whitespace-pre-line text-zinc-700 dark:text-zinc-300 font-mono">
                  {order.notes}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">No notes recorded on this order.</p>
              )}

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Append Note (Audit Logged)
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add packaging notes, supplier details, delivery special requests..."
                  className="w-full p-3 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{addingNote ? "Saving..." : "Save Internal Note"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Audit History */}
          {activeTab === "AUDIT" && (
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] pb-2 border-b border-zinc-100 dark:border-white/5">
                Append-Only Immutable Audit Trail
              </h3>
              <div className="space-y-3">
                {order.events &&
                  order.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 text-xs space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between text-zinc-500">
                        <span className="font-bold text-[#6A2CFF] dark:text-[#CDB8FF]">{evt.type}</span>
                        <span>{formatIST(evt.createdAt)}</span>
                      </div>
                      <div className="text-zinc-800 dark:text-zinc-200">{evt.message}</div>
                      <div className="text-[11px] text-zinc-400">Actor: {evt.actor}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Customer Details & Payment Summary */}
        <div className="space-y-6">
          {/* Customer & Delivery Address Card */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] pb-2 border-b border-zinc-100 dark:border-white/5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#6A2CFF]" />
              <span>Customer & Consignee</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-sm text-[#15101F] dark:text-[#F5F0E8] block">
                  {order.customerName}
                </span>
                <span className="text-zinc-500 font-mono block mt-0.5">{order.customerEmail}</span>
                {order.customerPhone && (
                  <span className="text-zinc-500 font-mono block mt-0.5">{order.customerPhone}</span>
                )}
              </div>

              {order.gstin && (
                <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                  <span className="text-[11px] font-mono text-[#8A829E] uppercase block">GSTIN</span>
                  <span className="font-mono font-semibold text-[#15101F] dark:text-[#F5F0E8]">{order.gstin}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-mono text-[#8A829E] uppercase block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#6A2CFF]" />
                  <span>Shipping Address</span>
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pin}
                  <br />
                  India
                </p>
              </div>

              {order.trackingNumber && (
                <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                  <span className="text-[11px] font-mono text-[#8A829E] uppercase block">Courier AWB / Tracking</span>
                  <span className="font-mono font-bold text-[#6A2CFF]">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Financial Summary (STRICTLY HIDDEN for GRAPHIC_DESIGNER & FACTORY_MANAGER) */}
          {!isFinancialMasked ? (
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-3 font-mono text-xs">
              <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] pb-2 border-b border-zinc-100 dark:border-white/5 flex items-center gap-2 font-sans">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Financial Summary</span>
              </h3>

              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>GST (18% Integrated)</span>
                <span>{formatINR(order.gst)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : formatINR(order.shipping)}</span>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex justify-between font-bold text-sm text-[#15101F] dark:text-[#F5F0E8]">
                <span>Total Paid</span>
                <span>{formatINR(order.total)}</span>
              </div>

              <div className="pt-2 text-[11px] text-zinc-500 space-y-1">
                <div>Method: {order.paymentMethod}</div>
                <div>Status: <span className="text-emerald-600 font-semibold uppercase">{order.paymentStatus}</span></div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Financial Data</span>
              <p className="text-xs text-zinc-400">Restricted per RBAC security policy for role: {viewerRole}</p>
            </div>
          )}

          {/* Cancellation Info if Cancelled */}
          {order.status === "CANCELLED" && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-1.5">
              <span className="font-bold text-rose-700 dark:text-rose-300 block">Cancellation Audit</span>
              <p className="text-rose-600 dark:text-rose-400">
                Reason: {order.cancellationReason || "No reason recorded"}
              </p>
              <div className="text-[11px] text-rose-500 font-mono">
                Cancelled by: {order.cancelledBy || "Staff"} at {formatIST(order.cancelledAt)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State Transition Confirmation / Justification Modal */}
      {transitionModalOpen && selectedTargetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={executeTransition}
            className="w-full max-w-md rounded-2xl bg-[#F5F0E8] dark:bg-[#15101F] border border-zinc-300 dark:border-white/15 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8]">
                Confirm Status Transition
              </h3>
              <button
                type="button"
                onClick={() => setTransitionModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#4A4358] dark:text-[#CDB8FF]/70">
              Moving order <span className="font-mono font-bold text-[#6A2CFF]">{order.orderNumber}</span> from{" "}
              <span className="font-bold">{order.status}</span> to{" "}
              <span className="font-bold text-emerald-600">{selectedTargetStatus}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A829E]">
                Written Reason / Justification{" "}
                {selectedTargetStatus === "CANCELLED" || selectedTargetStatus === "REVISION_REQUESTED" ? (
                  <span className="text-rose-500">* (Mandatory for audit trail)</span>
                ) : (
                  "(Optional notes)"
                )}
              </label>
              <textarea
                rows={3}
                required={selectedTargetStatus === "CANCELLED" || selectedTargetStatus === "REVISION_REQUESTED"}
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder={
                  selectedTargetStatus === "CANCELLED"
                    ? "Explain why the order is being cancelled (e.g. inventory shortage, customer request)..."
                    : "Add any handover comments..."
                }
                className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransitionModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={transitioning}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
              >
                {transitioning ? "Executing..." : "Confirm & Update"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QC Rework Modal */}
      {reworkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleRecordQcRework}
            className="w-full max-w-md rounded-2xl bg-[#F5F0E8] dark:bg-[#15101F] border border-amber-300 dark:border-amber-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Flag Quality Control Rework</span>
              </h3>
              <button
                type="button"
                onClick={() => setReworkModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-amber-800 dark:text-amber-300">
              This registers an immutable QC failure rework event on the factory floor for{" "}
              <span className="font-mono font-bold">{order.orderNumber}</span>. The status remains IN_PRINTING while the batch is rectified.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400">
                QC Inspection Failure Details *
              </label>
              <textarea
                rows={3}
                required
                value={reworkNotes}
                onChange={(e) => setReworkNotes(e.target.value)}
                placeholder="E.g., Screen print alignment shifted 4mm, color saturation lower than delta-E 2.0 tolerance, re-baking batch..."
                className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-amber-300 dark:border-amber-700 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReworkModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRework}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {submittingRework ? "Logging Rework..." : "Log QC Failure"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
