"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Palette,
  ExternalLink,
  RefreshCw,
  Send,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { MaskedOrderSummary } from "@/server/orders/orders-service";

interface DesignQueueOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  assignedDesignerName?: string | null;
  items: Array<{
    id: string;
    productName: string;
    artworkUrl?: string | null;
    mockupUrl?: string | null;
    printMethod?: string | null;
    qty: number;
  }>;
  latestEventMessage?: string;
  version: number;
}

export default function DesignApprovalsQueuePage() {
  const [orders, setOrders] = useState<DesignQueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingOrderNum, setSendingOrderNum] = useState<string | null>(null);

  const fetchDesignQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ARTWORK_UPLOADED and REVISION_REQUESTED orders
      const [resUploaded, resRevision] = await Promise.all([
        fetch("/api/admin/orders?status=ARTWORK_UPLOADED&pageSize=50"),
        fetch("/api/admin/orders?status=REVISION_REQUESTED&pageSize=50"),
      ]);

      const dataUploaded = await resUploaded.json();
      const dataRevision = await resRevision.json();

      const combined = [
        ...((dataRevision.orders || []) as MaskedOrderSummary[]),
        ...((dataUploaded.orders || []) as MaskedOrderSummary[]),
      ];

      // Fetch detail for each to get line items artwork
      const detailed = await Promise.all(
        combined.map(async (o: MaskedOrderSummary) => {
          try {
            const detailRes = await fetch(`/api/admin/orders/${o.orderNumber}`);
            const detailData = await detailRes.json();
            const ord = detailData.order;
            return {
              id: ord.id,
              orderNumber: ord.orderNumber,
              status: ord.status,
              customerName: ord.customerName,
              customerEmail: ord.customerEmail,
              createdAt: ord.createdAt,
              updatedAt: ord.updatedAt,
              assignedDesignerName: ord.assignedDesignerId ? "Ananya Deshmukh" : null,
              items: (ord.items || []).map((it: { id: string; productId: string; artworkUrl?: string | null; mockupUrl?: string | null; printMethod?: string | null; qty: number }) => ({
                id: it.id,
                productName: it.productId.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
                artworkUrl: it.artworkUrl,
                mockupUrl: it.mockupUrl,
                printMethod: it.printMethod || "DTF",
                qty: it.qty,
              })),
              latestEventMessage: ord.events?.[0]?.message,
              version: ord.version,
            };
          } catch {
            return null;
          }
        })
      );

      // Sort oldest first (priority FIFO queue)
      const valid = detailed.filter(Boolean) as DesignQueueOrder[];
      valid.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      setOrders(valid);
    } catch {
      toast.error("Failed to load design approval queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignQueue();
  }, [fetchDesignQueue]);

  const handleSendMockup = async (orderNumber: string) => {
    setSendingOrderNum(orderNumber);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/send-mockup`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send mockup");

      toast.success(`Mockup proof sent to client for Order #${orderNumber}!`);
      fetchDesignQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send mockup";
      toast.error(msg);
    } finally {
      setSendingOrderNum(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-[#6A2CFF]" />
            <span>Design Approvals Queue</span>
          </h1>
          <p className="text-sm text-[#4A4358] dark:text-[#CDB8FF]/70 mt-1">
            Oldest uploaded artworks and client revision requests queued for digital proofing.
          </p>
        </div>

        <button
          onClick={fetchDesignQueue}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white text-zinc-700 dark:text-zinc-200 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue Cards */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#6A2CFF] mb-2" />
          <p className="text-sm">Loading design queue...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-[#15101F] dark:text-[#F5F0E8]">All Design Approvals Clear!</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            There are currently no orders waiting for artwork inspection or client proof revisions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((o) => {
            const isRevision = o.status === "REVISION_REQUESTED";
            const firstItem = o.items[0];
            return (
              <div
                key={o.id}
                className={`p-5 rounded-2xl border backdrop-blur-md shadow-sm transition-all ${
                  isRevision
                    ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-300 dark:border-amber-800"
                    : "bg-white/80 dark:bg-white/5 border-zinc-200/80 dark:border-white/10"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Order Info & Status */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/admin/orders/${o.orderNumber}`}
                        className="text-base font-bold font-mono text-[#6A2CFF] dark:text-[#CDB8FF] hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <OrderStatusBadge status={o.status} size="sm" />
                      {isRevision && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                          Client Revision Priority
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-300">
                      <span className="font-semibold">{o.customerName}</span> ({o.customerEmail})
                    </div>

                    {/* Latest Comment / Message */}
                    {o.latestEventMessage && (
                      <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-white/5 p-2.5 rounded-xl border border-zinc-200/60 dark:border-white/10">
                        {o.latestEventMessage}
                      </p>
                    )}
                  </div>

                  {/* Middle: Artwork Preview Thumbnail */}
                  {firstItem && (
                    <div className="flex items-center gap-4">
                      {firstItem.artworkUrl ? (
                        <div className="relative w-16 h-16 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                          <Image
                            src={firstItem.artworkUrl}
                            alt="Logo"
                            fill
                            unoptimized
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-zinc-300 flex items-center justify-center text-[10px] text-zinc-400 text-center p-1">
                          No Logo
                        </div>
                      )}
                      <div className="text-xs">
                        <div className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{firstItem.productName}</div>
                        <div className="text-[#8A829E] font-mono mt-0.5">Method: {firstItem.printMethod}</div>
                        <div className="text-[#8A829E] font-mono">{firstItem.qty} units</div>
                      </div>
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Link
                      href={`/admin/orders/${o.orderNumber}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white text-[#15101F] dark:text-[#F5F0E8] transition-colors"
                    >
                      <span>Open Atelier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleSendMockup(o.orderNumber)}
                      disabled={sendingOrderNum === o.orderNumber}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] hover:bg-[#5822db] text-white shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingOrderNum === o.orderNumber ? "Sending..." : "Send Mockup"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
