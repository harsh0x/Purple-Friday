"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Clock,
  Plug,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Save,
  Check,
} from "lucide-react";
import { PageTransition } from "@/components/admin/PageTransition";

interface StoreDetails {
  businessName: string;
  gstin: string;
  address: string;
  supportPhone: string;
  whatsappNumber: string;
  timeZone: string;
  currency: string;
}

interface IntegrationStatus {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  statusText: "Configured" | "Not configured";
  description: string;
  requiredEnvKeys: string[];
}

export default function AdminSettingsPage() {
  const [store, setStore] = useState<StoreDetails>({
    businessName: "",
    gstin: "",
    address: "",
    supportPhone: "",
    whatsappNumber: "",
    timeZone: "Asia/Kolkata (IST, UTC+05:30)",
    currency: "INR (₹, paise)",
  });
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load settings.");
      }
      const data = await res.json();
      if (data.store) setStore(data.store);
      if (data.integrations) setIntegrations(data.integrations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load configuration.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSaveStore(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: store.businessName,
          gstin: store.gstin,
          address: store.address,
          supportPhone: store.supportPhone,
          whatsappNumber: store.whatsappNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store settings.");
      }

      setStore(data.store);
      setSuccess("Store details updated successfully. Audit record logged.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#6A2CFF]" />
              <h1 className="font-display font-black text-2xl text-[#15101F] tracking-tight">
                Store Details & Integration Adapters
              </h1>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              India Business Entity Details • Secret-Less Outside Service Health • Audit Logged
            </p>
          </div>

          <button
            onClick={loadSettings}
            className="self-start sm:self-auto p-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] hover:bg-[#FAF7F2] transition-colors"
            title="Reload settings"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {success && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs font-mono">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Store Entity Details Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#15101F]/10 mb-6">
            <Store className="w-5 h-5 text-[#6A2CFF]" />
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                Registered Store Entity Details
              </h2>
              <p className="text-xs font-mono text-[#15101F]/50">
                Invoicing, GST tax reports, and customer receipt defaults
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-[#15101F]/50">
              Loading store details...
            </div>
          ) : (
            <form onSubmit={handleSaveStore} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Business / Trade Name
                  </span>
                  <input
                    type="text"
                    required
                    value={store.businessName}
                    onChange={(e) => setStore({ ...store, businessName: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    GSTIN (India Goods & Services Tax)
                  </span>
                  <input
                    type="text"
                    required
                    value={store.gstin}
                    onChange={(e) => setStore({ ...store, gstin: e.target.value.toUpperCase() })}
                    placeholder="29AADCP9876Q1Z5"
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono font-bold"
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    Support Hotline
                  </span>
                  <input
                    type="text"
                    required
                    value={store.supportPhone}
                    onChange={(e) => setStore({ ...store, supportPhone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono"
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                    WhatsApp Business Dispatch Number
                  </span>
                  <input
                    type="text"
                    required
                    value={store.whatsappNumber}
                    onChange={(e) => setStore({ ...store, whatsappNumber: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-mono uppercase text-[#15101F] mb-1 font-semibold">
                  Registered Operating Atelier Address
                </span>
                <textarea
                  required
                  rows={2}
                  value={store.address}
                  onChange={(e) => setStore({ ...store, address: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#15101F]/15 rounded-xl p-3 text-xs text-[#15101F] focus:outline-none focus:border-[#6A2CFF] font-sans"
                />
              </div>

              {/* Read-Only System Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6A2CFF]" />
                    <span className="text-xs font-mono uppercase text-[#15101F]/70">Time Zone</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#15101F]">
                    Asia/Kolkata (UTC+05:30)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#6A2CFF]">₹</span>
                    <span className="text-xs font-mono uppercase text-[#15101F]/70">Currency Arithmetic</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#15101F]">
                    Integer Paise (No Floats)
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#15101F]/10 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31] transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#D8FF3F]" />
                  <span>{saving ? "Saving Changes..." : "Save Store Configuration"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Outside Integrations Status (Secret-Less Health) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#15101F]/10 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#15101F]/10 mb-6">
            <Plug className="w-5 h-5 text-[#6A2CFF]" />
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F] tracking-tight">
                External Service Integrations
              </h2>
              <p className="text-xs font-mono text-[#15101F]/50">
                Secret-less presence inspection • Real credentials required for outside actions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#15101F]">{item.name}</div>
                    <div className="text-[11px] text-[#15101F]/60 mt-0.5 font-sans">
                      {item.description}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 border ${
                      item.configured
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {item.configured ? (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                    )}
                    <span>{item.statusText}</span>
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#15101F]/40 pt-2 border-t border-[#15101F]/5">
                  Required: {item.requiredEnvKeys.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
