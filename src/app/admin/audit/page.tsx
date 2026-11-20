"use client";

import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  Download,
  RotateCcw,
  Shield,
  Eye,
  X,
  Filter,
} from "lucide-react";
import { PageTransition } from "@/components/admin/PageTransition";

interface AuditLogEntry {
  id: string;
  time: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string;
  ipHash?: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  // Inspect detail modal
  const [inspectTarget, setInspectTarget] = useState<AuditLogEntry | null>(null);

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load audit logs.");
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit trail.");
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, entityFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadLogs();
  }

  function formatIndiaDateTime(isoString: string): string {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#6A2CFF]" />
              <h1 className="font-display font-black text-2xl text-[#15101F] tracking-tight">
                Security & Audit Trail
              </h1>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Immutable Log • Append-Only Database Trigger Enforced • Formula-Safe CSV Export
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadLogs}
              className="p-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2] transition-colors"
              title="Refresh log feed"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <a
              href="/api/admin/audit/export"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6A2CFF] hover:bg-[#5820DC] text-white font-mono text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#15101F]/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#15101F]/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, action, entity..."
              className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl pl-10 pr-4 py-2 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#15101F]/60">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3 py-2 text-xs font-mono text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
            >
              <option value="">All Actions</option>
              <option value="auth.admin_login_success">Login Success</option>
              <option value="auth.admin_login_failed">Login Failed</option>
              <option value="auth.admin_logout">Logout</option>
              <option value="team.create_staff">Create Staff</option>
              <option value="team.update_role">Update Role</option>
              <option value="team.activate_staff">Activate Staff</option>
              <option value="team.deactivate_staff">Deactivate Staff</option>
              <option value="team.force_password_reset">Force Reset</option>
              <option value="settings.update_store_details">Update Settings</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3 py-2 text-xs font-mono text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
            >
              <option value="">All Entity Types</option>
              <option value="STAFF_USER">Staff User</option>
              <option value="APP_SETTING">App Setting</option>
              <option value="ORDER">Order</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Audit Log Table */}
        <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#15101F]/10 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#15101F]">
              Recorded Audit Events ({logs.length})
            </span>
            <span className="text-[11px] font-mono text-[#15101F]/50 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tamper-Proof & Append-Only</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F0E8] border-b border-[#15101F]/10 text-[11px] font-mono uppercase tracking-wider text-[#15101F]/60">
                <tr>
                  <th className="py-3 px-5">Timestamp (IST)</th>
                  <th className="py-3 px-5">Actor & Role</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Entity</th>
                  <th className="py-3 px-5">IP Hash</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15101F]/5 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#15101F]/50">
                      Loading audit log trail...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#15101F]/50">
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3.5 px-5 text-[11px] text-[#15101F]/70 whitespace-nowrap">
                        {formatIndiaDateTime(log.time)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#15101F]">{log.actor}</div>
                        <div className="text-[10px] text-[#6A2CFF] uppercase font-bold">
                          {log.actorRole}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#15101F]/5 border border-[#15101F]/10 text-[11px] font-bold text-[#15101F]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[11px] text-[#15101F]/70">
                        <span>{log.entityType}</span>
                        {log.entityId && (
                          <span className="block text-[10px] text-[#15101F]/40 truncate max-w-[120px]">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-[11px] text-[#15101F]/50">
                        {log.ipHash || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectTarget(log)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F5F0E8] hover:bg-white border border-[#15101F]/15 text-[11px] font-semibold text-[#15101F] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#6A2CFF]" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Inspect Audit Record Detail */}
        {inspectTarget && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#15101F]/10 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#15101F]/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#15101F]">
                    Audit Record Details
                  </h3>
                  <div className="text-[11px] font-mono text-[#15101F]/60 mt-0.5">
                    ID: {inspectTarget.id} • Request: {inspectTarget.requestId || "—"}
                  </div>
                </div>
                <button
                  onClick={() => setInspectTarget(null)}
                  className="text-[#15101F]/40 hover:text-[#15101F]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F5F0E8]/70 border border-[#15101F]/10">
                  <div>
                    <span className="text-[#15101F]/50 block text-[10px] uppercase">Actor</span>
                    <span className="font-bold text-[#15101F]">{inspectTarget.actor}</span>
                    <span className="text-[#6A2CFF] block text-[10px]">({inspectTarget.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-[#15101F]/50 block text-[10px] uppercase">Action</span>
                    <span className="font-bold text-[#15101F]">{inspectTarget.action}</span>
                  </div>
                  <div>
                    <span className="text-[#15101F]/50 block text-[10px] uppercase">Timestamp (IST)</span>
                    <span className="text-[#15101F]">{formatIndiaDateTime(inspectTarget.time)}</span>
                  </div>
                  <div>
                    <span className="text-[#15101F]/50 block text-[10px] uppercase">IP Hash</span>
                    <span className="text-[#15101F]">{inspectTarget.ipHash || "—"}</span>
                  </div>
                </div>

                {inspectTarget.before && (
                  <div>
                    <span className="text-xs font-mono uppercase text-[#15101F] font-bold block mb-1">
                      Before State
                    </span>
                    <pre className="p-3.5 rounded-2xl bg-[#15101F] text-[#DDD4E6] text-[11px] overflow-x-auto">
                      {JSON.stringify(inspectTarget.before, null, 2)}
                    </pre>
                  </div>
                )}

                {inspectTarget.after && (
                  <div>
                    <span className="text-xs font-mono uppercase text-[#15101F] font-bold block mb-1">
                      After State
                    </span>
                    <pre className="p-3.5 rounded-2xl bg-[#15101F] text-[#D8FF3F] text-[11px] overflow-x-auto">
                      {JSON.stringify(inspectTarget.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#15101F]/10 flex justify-end">
                <button
                  onClick={() => setInspectTarget(null)}
                  className="px-5 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31]"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
