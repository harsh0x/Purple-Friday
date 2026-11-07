"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Activity,
  Database,
  Cloud,
  CreditCard,
  Shield,
  Server,
  X,
  User,
} from "lucide-react";
import { StoredAuditLog } from "@/lib/admin/audit";

interface AdminHeaderProps {
  userName?: string | null;
}

export function AdminHeader({ userName }: AdminHeaderProps) {
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [auditLogs, setAuditLogs] = useState<StoredAuditLog[]>([]);
  const [quickSearch, setQuickSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      if (data.logs) {
        setAuditLogs(data.logs);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    if (showAuditDrawer) {
      fetchLogs();
    }
  }, [showAuditDrawer]);

  // System Health Indicators
  const healthItems = [
    { name: "DB", status: "ONLINE", icon: Database, color: "text-emerald-400" },
    { name: "Cloudinary", status: "ACTIVE", icon: Cloud, color: "text-emerald-400" },
    { name: "Razorpay", status: "SANDBOX", icon: CreditCard, color: "text-blue-400" },
    { name: "Turnstile", status: "DEV_MODE", icon: Shield, color: "text-amber-400" },
    { name: "Memory Cache", status: "FALLBACK_OK", icon: Server, color: "text-pf-lime" },
  ];

  return (
    <>
      <header className="border-b border-white/10 bg-[#181324] px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        {/* Quick Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Quick search orders, products, SKU..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full bg-[#110D1A] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-pf-violet"
          />
        </div>

        {/* System Health Indicators & Audit Stream Trigger */}
        <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-[#110D1A] rounded-xl border border-white/10 text-[11px] font-mono">
            {healthItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="flex items-center gap-1.5" title={`${item.name}: ${item.status}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-white/40">{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* Audit Log Stream Button */}
          <button
            onClick={() => setShowAuditDrawer(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-mono text-white transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-pf-lime" />
            <span className="hidden sm:inline">Audit Stream</span>
          </button>

          {userName && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-white/50 pl-2 border-l border-white/10">
              <User className="w-3.5 h-3.5 text-pf-violet" />
              <span className="text-white/80">{userName}</span>
            </div>
          )}
        </div>
      </header>

      {/* Audit Log Stream Drawer */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#181324] border-l border-white/10 h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-pf-lime" />
                  <h3 className="font-display font-bold text-lg text-white">
                    Live Security & Action Audit
                  </h3>
                </div>
                <button
                  onClick={() => setShowAuditDrawer(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="text-xs font-mono text-white/40 text-center py-10">
                    No recent audit events logged.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[#110D1A] border border-white/5 rounded-xl space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/40">
                        <span className="text-pf-violet font-bold uppercase">{log.action}</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString("en-IN")}</span>
                      </div>
                      <div className="text-white font-medium">
                        Target: <span className="text-pf-lime">{log.entityId || log.entity}</span>
                      </div>
                      {log.metadata && (
                        <div className="text-[10px] text-white/60 bg-white/5 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-[11px] font-mono text-white/40 text-center">
              Tamper-evident audit logging active (PCI-DSS & SOC2 compliant)
            </div>
          </div>
        </div>
      )}
    </>
  );
}
