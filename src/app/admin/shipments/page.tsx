"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Navigation,
  Search,
  ExternalLink,
  Printer,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

interface ShipmentItem {
  id: string;
  orderNumber: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  state: string;
  pincode: string;
  awb?: string | null;
  courier?: string | null;
  labelUrl?: string | null;
  status: string;
  collectCodAmountPaise: number;
  trackingHistory: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
  createdAt: string;
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shipments");
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
      }
    } catch {
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const filtered = shipments.filter(
    (s) =>
      s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      (s.awb && s.awb.toLowerCase().includes(search.toLowerCase())) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.pincode.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-paper dark:bg-ink/40 border border-ink/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Navigation className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-bricolage text-ink dark:text-paper">
              Courier Shipments & AWB Registry
            </h1>
          </div>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Real-time tracking of single and multi-address dispatches, carrier waybills, and delivery milestones across India.
          </p>
        </div>

        <button
          onClick={fetchShipments}
          className="p-2 rounded-xl border border-ink/15 hover:bg-ink/5 text-ink transition-colors"
          title="Refresh Shipments"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search by AWB, shipment #, recipient, city, or PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-ink/15 bg-paper dark:bg-ink/20 focus:outline-none focus:ring-2 focus:ring-violet/30"
          />
        </div>

        <div className="text-xs text-ink/60">
          Total Shipments: <strong className="text-ink font-bold">{shipments.length}</strong>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="rounded-2xl border border-ink/10 bg-paper dark:bg-ink/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink/5 dark:bg-ink/40 border-b border-ink/10 font-mono text-[11px] text-ink/60">
              <tr>
                <th className="py-3 px-4">SHIPMENT & AWB</th>
                <th className="py-3 px-4">ORDER REF</th>
                <th className="py-3 px-4">RECIPIENT & DESTINATION</th>
                <th className="py-3 px-4">CARRIER</th>
                <th className="py-3 px-4">DELIVERY STATUS</th>
                <th className="py-3 px-4">PAYMENT</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/40">
                    Loading shipments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/40">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-ink/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-ink dark:text-paper">{s.shipmentNumber}</div>
                      <div className="font-mono text-[11px] text-violet font-semibold">{s.awb || "AWB Pending"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <Link
                        href={`/admin/orders/${s.orderNumber}`}
                        className="text-ink hover:text-violet inline-flex items-center gap-1 hover:underline"
                      >
                        {s.orderNumber}
                        <ExternalLink className="w-3 h-3 text-ink/40" />
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink dark:text-paper">{s.recipientName}</div>
                      <div className="text-[11px] text-ink/60">
                        {s.city}, {s.state} ({s.pincode})
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink/80 font-medium">
                      {s.courier || "Standard Courier"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          s.status === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                            : s.status === "RTO"
                              ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                              : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                        }`}
                      >
                        {s.status === "DELIVERED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : s.status === "RTO" ? (
                          <RotateCcw className="w-3 h-3" />
                        ) : (
                          <Truck className="w-3 h-3" />
                        )}
                        <span>{s.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.collectCodAmountPaise > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                          Collect Rs {Math.round(s.collectCodAmountPaise / 100)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">Prepaid</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <a
                        href={s.labelUrl || `/api/admin/shipments/${s.shipmentNumber}/label`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
                        title="Print 4x6 Label PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-violet" />
                        <span>Label</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setSelectedShipment(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-ink text-white hover:bg-ink/80 transition-colors"
                      >
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Timeline Drawer / Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-paper dark:bg-ink p-6 border border-ink/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="font-bold font-bricolage text-base text-ink dark:text-paper">
                  Tracking History
                </h3>
                <div className="text-xs font-mono text-violet font-semibold">
                  {selectedShipment.awb || selectedShipment.shipmentNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-ink/40 hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs max-h-72 overflow-y-auto">
              {selectedShipment.trackingHistory && selectedShipment.trackingHistory.length > 0 ? (
                selectedShipment.trackingHistory.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative pb-3 border-l-2 border-violet/20 pl-4 ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet absolute -left-[6px] top-1" />
                    <div>
                      <div className="font-bold text-ink dark:text-paper">{t.status}</div>
                      <div className="text-ink/70">{t.description}</div>
                      <div className="text-[10px] text-ink/40 font-mono pt-1">
                        {t.location} • {new Date(t.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-ink/40 py-6">No tracking milestones yet recorded.</div>
              )}
            </div>

            <div className="pt-2 border-t border-ink/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
