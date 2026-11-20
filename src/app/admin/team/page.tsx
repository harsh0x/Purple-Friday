"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  CheckCircle,
  X,
  Plus,
} from "lucide-react";
import { PageTransition } from "@/components/admin/PageTransition";

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "GRAPHIC_DESIGNER" | "FACTORY_MANAGER" | "SUPPORT_AGENT" | "ADMIN";
  phone?: string;
  active?: boolean;
  lastLogin?: string | null;
  mustChangePassword?: boolean;
  version?: number;
}

const ROLE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    color: "bg-[#6A2CFF] text-white border-[#6A2CFF]",
    desc: "Full governance, prices, team, integrations, audit",
  },
  ADMIN: {
    label: "Super Admin (Legacy)",
    color: "bg-[#6A2CFF] text-white border-[#6A2CFF]",
    desc: "Full platform control",
  },
  GRAPHIC_DESIGNER: {
    label: "Graphic Designer",
    color: "bg-[#CDB8FF]/40 text-[#15101F] border-[#CDB8FF]",
    desc: "Proof review, artwork files, design approval queue",
  },
  FACTORY_MANAGER: {
    label: "Factory Manager",
    color: "bg-[#D8FF3F]/40 text-[#15101F] border-[#D8FF3F]",
    desc: "Production queue, QC, job sheets, dispatch tracking",
  },
  SUPPORT_AGENT: {
    label: "Support Agent",
    color: "bg-white text-[#15101F] border-[#15101F]/20",
    desc: "Order lookup, customer tracking, review moderation",
  },
};

export default function TeamAndRolesPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffMember["role"]>("GRAPHIC_DESIGNER");
  const [invitePassword, setInvitePassword] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Role Change Modal
  const [roleChangeTarget, setRoleChangeTarget] = useState<StaffMember | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<StaffMember["role"]>("GRAPHIC_DESIGNER");
  const [roleUpdating, setRoleUpdating] = useState(false);

  async function loadStaff() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/team");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load staff list.");
      }
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function formatIndiaDate(isoString?: string | null): string {
    if (!isoString) return "Never logged in";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  }

  async function handleInviteStaff(e: React.FormEvent) {
    e.preventDefault();
    setInviteSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          password: invitePassword,
          phone: invitePhone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite staff member.");
      }

      setActionSuccess(`Staff member ${data.user.name} created successfully.`);
      setInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInvitePhone("");
      loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create staff member.");
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleRoleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!roleChangeTarget) return;

    setRoleUpdating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROLE",
          userId: roleChangeTarget.id,
          role: selectedNewRole,
          expectedVersion: roleChangeTarget.version || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff role.");
      }

      setActionSuccess(`Updated role for ${roleChangeTarget.name} to ${selectedNewRole}.`);
      setRoleChangeTarget(null);
      loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setRoleUpdating(false);
    }
  }

  async function handleToggleActive(user: StaffMember) {
    const nextActive = !user.active;
    const confirmMsg = nextActive
      ? `Reactivate account for ${user.name}?`
      : `Deactivate account for ${user.name}? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    setError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_ACTIVE",
          userId: user.id,
          active: nextActive,
          expectedVersion: user.version || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle status.");
      }

      setActionSuccess(`Account for ${user.name} is now ${nextActive ? "Active" : "Deactivated"}.`);
      loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function handleForcePasswordReset(user: StaffMember) {
    if (
      !window.confirm(
        `Force password reset for ${user.name}? They will be required to change their password on next login.`
      )
    )
      return;

    setError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FORCE_PASSWORD_RESET",
          userId: user.id,
          expectedVersion: user.version || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to force password reset.");
      }

      setActionSuccess(`Forced password reset requirement flagged for ${user.name}.`);
      loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to force reset.");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6A2CFF]" />
              <h1 className="font-display font-black text-2xl text-[#15101F] tracking-tight">
                Team & Access Governance
              </h1>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Role-Based Access Control • Optimistic Concurrency v{staff.length > 0 ? "1" : "0"} • Audit Verified
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadStaff}
              className="p-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2] transition-colors"
              title="Refresh staff list"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#D8FF3F]" />
              <span>Create Staff Member</span>
            </button>
          </div>
        </div>

        {/* Action feedback notifications */}
        {actionSuccess && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Staff Table Card */}
        <div className="bg-white rounded-3xl border border-[#15101F]/10 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#15101F]/10 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#15101F]">
              Active Personnel ({staff.length})
            </span>
            <span className="text-[11px] font-mono text-[#15101F]/50">
              All mutating changes recorded to immutable AuditLog
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F0E8] border-b border-[#15101F]/10 text-[11px] font-mono uppercase tracking-wider text-[#15101F]/60">
                <tr>
                  <th className="py-3 px-5">Staff Member</th>
                  <th className="py-3 px-5">Assigned Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Last Activity (IST)</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15101F]/5 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs font-mono text-[#15101F]/50">
                      Loading staff registry...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs font-mono text-[#15101F]/50">
                      No staff members registered.
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => {
                    const roleConfig = ROLE_LABELS[member.role] || ROLE_LABELS.SUPER_ADMIN;
                    const isActive = member.active !== false;

                    return (
                      <tr key={member.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-semibold text-[#15101F]">{member.name}</div>
                          <div className="text-[11px] font-mono text-[#15101F]/60">{member.email}</div>
                          {member.phone && (
                            <div className="text-[10px] font-mono text-[#15101F]/40">{member.phone}</div>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${roleConfig.color}`}
                          >
                            {roleConfig.label}
                          </span>
                          <div className="text-[10px] text-[#15101F]/50 mt-1 max-w-xs font-sans">
                            {roleConfig.desc}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <span className={isActive ? "text-emerald-700 font-semibold" : "text-rose-700"}>
                              {isActive ? "Active" : "Deactivated"}
                            </span>
                          </div>
                          {member.mustChangePassword && (
                            <span className="inline-block mt-1 text-[10px] font-mono text-[#6A2CFF] bg-[#6A2CFF]/10 px-1.5 py-0.5 rounded">
                              Password Reset Required
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-mono text-[11px] text-[#15101F]/70">
                          {formatIndiaDate(member.lastLogin)}
                        </td>
                        <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                          {/* Role Switcher */}
                          <button
                            onClick={() => {
                              setRoleChangeTarget(member);
                              setSelectedNewRole(member.role);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-[#F5F0E8] hover:bg-white border border-[#15101F]/15 font-mono text-[11px] text-[#15101F] transition-colors"
                          >
                            Change Role
                          </button>

                          {/* Force Password Reset */}
                          <button
                            onClick={() => handleForcePasswordReset(member)}
                            className="p-1.5 rounded-xl bg-[#F5F0E8] hover:bg-white border border-[#15101F]/15 text-[#15101F] transition-colors"
                            title="Force password reset on next login"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#6A2CFF]" />
                          </button>

                          {/* Deactivate / Reactivate */}
                          <button
                            onClick={() => handleToggleActive(member)}
                            className={`px-2.5 py-1 rounded-xl font-mono text-[11px] transition-colors border ${
                              isActive
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Staff Member */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#15101F]/10 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-[#15101F]/10">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#6A2CFF]" />
                  <h3 className="font-display font-bold text-lg text-[#15101F]">
                    Create Staff Member
                  </h3>
                </div>
                <button onClick={() => setInviteModalOpen(false)} className="text-[#15101F]/40 hover:text-[#15101F]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteStaff} className="mt-5 space-y-4">
                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Full Name
                  </span>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Staff Email
                  </span>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="vikram@purplefriday.in"
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Assigned Role
                  </span>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StaffMember["role"])}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono"
                  >
                    <option value="GRAPHIC_DESIGNER">Graphic Designer (Proofs, artwork approval)</option>
                    <option value="FACTORY_MANAGER">Factory Manager (Production queue, QC, dispatch)</option>
                    <option value="SUPPORT_AGENT">Support Agent (Orders, tracking, tickets)</option>
                    <option value="SUPER_ADMIN">Super Admin (All permissions & settings)</option>
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Temporary Password (min. 10 chars)
                  </span>
                  <input
                    type="password"
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
                  />
                  <p className="text-[11px] font-mono text-[#15101F]/50 mt-1">
                    User will be forced to change password upon first sign-in.
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Phone (Optional, for 2FA / Alerts)
                  </span>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF]"
                  />
                </div>

                <div className="pt-4 border-t border-[#15101F]/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-[#F5F0E8] text-[#15101F] font-mono text-xs font-semibold hover:bg-[#EDE6DA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="px-5 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31] disabled:opacity-50"
                  >
                    {inviteSubmitting ? "Creating..." : "Create & Provision"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Change Role */}
        {roleChangeTarget && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#15101F]/10 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#15101F]/10">
                <h3 className="font-display font-bold text-base text-[#15101F]">
                  Change Role for {roleChangeTarget.name}
                </h3>
                <button onClick={() => setRoleChangeTarget(null)} className="text-[#15101F]/40 hover:text-[#15101F]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRoleUpdate} className="mt-4 space-y-4">
                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Select New Role
                  </span>
                  <select
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value as StaffMember["role"])}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] font-mono focus:outline-none focus:border-[#6A2CFF]"
                  >
                    <option value="GRAPHIC_DESIGNER">Graphic Designer</option>
                    <option value="FACTORY_MANAGER">Factory Manager</option>
                    <option value="SUPPORT_AGENT">Support Agent</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-[#F5F0E8] text-[11px] font-mono text-[#15101F]/70">
                  Current version: v{roleChangeTarget.version || 1}. Optimistic concurrency check will prevent overwrite conflicts.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoleChangeTarget(null)}
                    className="px-4 py-2 rounded-xl bg-[#F5F0E8] text-[#15101F] font-mono text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={roleUpdating}
                    className="px-4 py-2 rounded-xl bg-[#6A2CFF] text-white font-mono text-xs font-semibold hover:bg-[#5820DC] disabled:opacity-50"
                  >
                    {roleUpdating ? "Updating..." : "Save Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
