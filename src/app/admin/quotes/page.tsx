"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  ExternalLink,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AdminQuote } from "@/lib/admin/admin-store";

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quotes");
      const data = await res.json();
      if (data.quotes) {
        setQuotes(data.quotes);
      }
    } catch {
      toast.error("Failed to load design briefs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handleStatusChange = async (id: string, status: AdminQuote["status"]) => {
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Quote status updated to ${status}`);
        setQuotes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status } : q))
        );
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    }
  };

  const getStatusBadge = (status: AdminQuote["status"]) => {
    switch (status) {
      case "IN_TOUCH":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "QUOTED":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "WON":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "LOST":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-tight">
            &ldquo;Let Our Team Design It&rdquo; Briefs
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Enterprise customer artwork requests, custom Pantone runs, and high-volume corporate quotes
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/60">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>{quotes.filter((q) => q.status === "IN_TOUCH" || q.status === "QUOTED").length} active briefs</span>
        </div>
      </div>

      {/* Briefs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs text-white/50">
            Loading design briefs...
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-[#181324] p-12 text-center rounded-2xl border border-white/10 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-display font-bold text-white text-base">
              No Pending Design Briefs
            </h3>
            <p className="text-xs font-mono text-white/50">
              All incoming artwork requests have been handled.
            </p>
          </div>
        ) : (
          quotes.map((q) => (
            <div
              key={q.id}
              className="bg-[#181324] p-6 rounded-2xl border border-white/10 space-y-4 transition-colors"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-lg text-white">
                      {q.customerName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusBadge(
                        q.status
                      )}`}
                    >
                      {q.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white/50">
                    Product: <span className="text-white/80">{q.productName}</span> • Submitted:{" "}
                    {new Date(q.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Status Switcher & PDF Download */}
                <div className="flex items-center gap-3">
                  <select
                    value={q.status}
                    onChange={(e) => handleStatusChange(q.id, e.target.value as AdminQuote["status"])}
                    className="bg-[#110D1A] border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                  >
                    <option value="IN_TOUCH">In Touch</option>
                    <option value="QUOTED">Quoted</option>
                    <option value="WON">Won (Converting)</option>
                    <option value="LOST">Lost</option>
                  </select>

                  <a
                    href={`/api/admin/quotes/${q.id}/pdf`}
                    download={`PF-Brief-${q.id}.pdf`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors"
                    title="Download A4 PDF Brief"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Brief</span>
                  </a>
                </div>
              </div>

              {/* Customer Contact Details Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-white/70 bg-[#110D1A] p-2.5 rounded-xl border border-white/5">
                  <Mail className="w-3.5 h-3.5 text-pf-violet" />
                  <a href={`mailto:${q.customerEmail}`} className="hover:underline truncate">
                    {q.customerEmail}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-white/70 bg-[#110D1A] p-2.5 rounded-xl border border-white/5">
                  <Phone className="w-3.5 h-3.5 text-pf-lime" />
                  <a href={`tel:${q.customerPhone}`} className="hover:underline">
                    {q.customerPhone}
                  </a>
                </div>

                <div className="bg-[#110D1A] p-2.5 rounded-xl border border-white/5 text-white/70">
                  <span className="text-white/40">Req. Qty: </span>
                  <span className="font-bold text-white">
                    {q.quantity ? `${q.quantity} pcs` : "Custom Run"}
                  </span>
                </div>

                <div className="bg-[#110D1A] p-2.5 rounded-xl border border-white/5 text-white/70">
                  <span className="text-white/40">Target Budget: </span>
                  <span className="font-bold text-white">
                    {q.budget ? `₹${q.budget.toLocaleString("en-IN")}` : "Flexible"}
                  </span>
                </div>
              </div>

              {/* Instructions / Notes */}
              {q.notes && (
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-white/40">
                    Client Design Notes:
                  </div>
                  <p className="text-xs font-mono text-white/80 leading-relaxed">
                    {q.notes}
                  </p>
                </div>
              )}

              {/* Attached File Preview if available */}
              {q.briefFileUrl && (
                <div className="flex items-center justify-between text-xs font-mono text-white/60 bg-[#110D1A] p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pf-lime" />
                    <span>Attached artwork asset: {q.briefFileUrl}</span>
                  </div>
                  <a
                    href={q.briefFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-pf-violet hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Raw File</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
