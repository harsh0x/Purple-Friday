"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/admin/PageTransition";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  X,
  Download,
  ExternalLink,
  CheckCircle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerProfile } from "@/server/customers/customer-service";

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    userId?: string;
    customerEmail: string;
    type: string;
    summary: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/customers", window.location.origin);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setProfiles(json.profiles || []);
        if (json.recentEvents) {
          setRecentEvents(json.recentEvents);
        }
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleExportCsv = async () => {
    toast.info("Generating customer CSV export...");
    try {
      const url = new URL("/api/admin/customers", window.location.origin);
      url.searchParams.set("export", "csv");
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `purple_friday_customers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Customer CSV downloaded successfully");
    } catch {
      toast.error("Failed to export customers CSV");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#15101F] tracking-tight">
                Customers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                {profiles.length} Active Accounts
              </span>
            </div>
            <p className="mt-1 text-xs text-[#15101F]/60">
              Customer directory, lifetime order history, and contact details
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-2xl border border-[#15101F]/15 bg-white hover:bg-[#FAF7F2] text-[#15101F] transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#6A2CFF]" />
              <span>Export CSV</span>
            </button>
            <div className="relative shrink-0 sm:w-64">
              <Search className="w-4 h-4 text-[#15101F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#15101F]/15 bg-white text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
              />
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#15101F]/70 border-b border-[#15101F]/10">
                <tr>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Contact</th>
                  <th className="p-4 font-bold">Location</th>
                  <th className="p-4 font-bold text-right">Orders</th>
                  <th className="p-4 font-bold text-right">Lifetime Spend</th>
                  <th className="p-4 font-bold text-right">Last Order</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15101F]/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs font-mono text-[#15101F]/40">
                      Loading customer records...
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs font-mono text-[#15101F]/40">
                      No customer accounts matching filter.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => (
                    <tr
                      key={p.customerId}
                      className="hover:bg-[#FAF7F2]/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProfile(p)}
                    >
                      <td className="p-4">
                        <div className="font-bold text-[#15101F] text-sm group-hover:text-[#6A2CFF] transition-colors">
                          {p.customerName}
                        </div>
                        {p.companyName && (
                          <div className="text-[11px] text-[#15101F]/50 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" />
                            <span>{p.companyName}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-[#15101F]/70">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{p.customerEmail}</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        </div>
                        {p.customerPhone && <div className="text-[#15101F]/50 mt-0.5">{p.customerPhone}</div>}
                      </td>
                      <td className="p-4 text-[#15101F]/70">
                        {p.city ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#15101F]/40" />
                            {p.city}
                          </span>
                        ) : (
                          <span className="text-[#15101F]/30">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-[#15101F]">
                        {p.orderCount}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-[#15101F]">
                        {formatCurrency(p.totalSpendPaise)}
                      </td>
                      <td className="p-4 text-right font-mono text-[11px] text-[#15101F]/60">
                        {new Date(p.lastOrderDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(p.customerId)}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#15101F]/5 hover:bg-[#6A2CFF] hover:text-white text-[#15101F] text-xs font-mono font-bold transition-all"
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

        {/* Recent Changes from CustomerEvent */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#15101F]/10">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#6A2CFF]" />
              <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                Recent Customer Changes & Activity
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Audit log of self-serve customer profile and security updates
            </span>
          </div>

          {recentEvents.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#6A2CFF] uppercase text-[10px] px-2 py-0.5 rounded bg-[#6A2CFF]/10">
                        {evt.type.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-zinc-800 font-medium">{evt.customerEmail}</span>
                    </div>
                    <p className="text-zinc-600 font-sans">{evt.summary}</p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    {new Date(evt.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 font-mono italic py-4">
              No recent customer profile changes recorded yet.
            </p>
          )}
        </div>

        {/* Customer Detail Drawer Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#15101F]/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#15101F]/10">
                  <div>
                    <h3 className="font-display font-black text-xl text-[#15101F]">
                      {selectedProfile.customerName}
                    </h3>
                    {selectedProfile.companyName && (
                      <p className="text-xs text-[#15101F]/60 mt-0.5">{selectedProfile.companyName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#15101F]/50 hover:text-[#15101F]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* KPI Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/5">
                    <div className="text-[11px] font-mono text-[#15101F]/50">Total Orders</div>
                    <div className="font-mono font-black text-xl text-[#15101F] mt-1">
                      {selectedProfile.orderCount}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/5">
                    <div className="text-[11px] font-mono text-[#15101F]/50">Lifetime Spend</div>
                    <div className="font-mono font-black text-xl text-emerald-700 mt-1">
                      {formatCurrency(selectedProfile.totalSpendPaise)}
                    </div>
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#15101F]/50">
                    Contact Details
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <a
                      href={`mailto:${selectedProfile.customerEmail}`}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#15101F]/5 hover:border-[#6A2CFF]/30 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[#6A2CFF]" />
                      <span className="text-[#15101F] font-bold">{selectedProfile.customerEmail}</span>
                    </a>
                    {selectedProfile.customerPhone && (
                      <a
                        href={`tel:${selectedProfile.customerPhone}`}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#15101F]/5 hover:border-[#6A2CFF]/30 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#6A2CFF]" />
                        <span className="text-[#15101F] font-bold">{selectedProfile.customerPhone}</span>
                      </a>
                    )}
                    {selectedProfile.city && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#15101F]/5 text-[#15101F]/70">
                        <MapPin className="w-4 h-4 text-[#15101F]/40" />
                        <span>{selectedProfile.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Past Order History */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#15101F]/50 mb-3">
                    Order History ({selectedProfile.orders.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedProfile.orders.map((o) => (
                      <div
                        key={o.id}
                        className="p-3 rounded-xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-[#15101F]">{o.orderNumber}</div>
                          <div className="text-[10px] text-[#15101F]/50 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#15101F] border border-[#15101F]/10">
                            {o.status}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(o.totalPaise)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#15101F]/10">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="w-full py-2.5 rounded-2xl bg-[#15101F] hover:bg-[#6A2CFF] text-white text-xs font-mono font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}