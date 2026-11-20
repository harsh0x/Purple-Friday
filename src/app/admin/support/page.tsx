"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  LifeBuoy,
  Send,
  ArrowUpRight,
} from "lucide-react";
import { StoredSupportTicket } from "@/server/reviews/review-service";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<StoredSupportTicket[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, open: 0, pending: 0, resolved: 0, closed: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<StoredSupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/support", window.location.origin);
      if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setTickets(json.tickets || []);
        if (json.counts) setCounts(json.counts);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSendReply = async (newStatus?: StoredSupportTicket["status"]) => {
    if (!selectedTicket || (!replyMessage && !newStatus)) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.ticketNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          newStatus: newStatus || selectedTicket.status,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedTicket(json.ticket);
        setReplyMessage("");
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
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
                Support & Escalation Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                Customer Resolution
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-[#15101F]/60">
              Low rating review quarantine triage, customer inquiry threads, and order resolution SLAs
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#15101F]/10">
          {[
            { id: "ALL", label: `All Tickets (${counts.all})` },
            { id: "OPEN", label: `Open Queue (${counts.open})` },
            { id: "PENDING_CUSTOMER", label: `Waiting on Customer (${counts.pending})` },
            { id: "RESOLVED", label: `Resolved (${counts.resolved})` },
            { id: "CLOSED", label: `Closed (${counts.closed})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all ${
                selectedStatus === tab.id
                  ? "bg-[#15101F] text-white shadow-sm"
                  : "bg-white text-[#15101F]/70 hover:bg-[#FAF7F2] border border-[#15101F]/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tickets Grid / Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-1 space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-[#15101F]/60">
                Loading support tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#15101F]/10 shadow-sm">
                <p className="text-xs font-mono text-[#15101F]/60">
                  No tickets for this status.
                </p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.ticketNumber === t.ticketNumber;
                const isUrgent = t.priority === "URGENT" || t.priority === "HIGH";

                return (
                  <div
                    key={t.ticketNumber}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white border-[#6A2CFF] shadow-md ring-1 ring-[#6A2CFF]"
                        : "bg-white border-[#15101F]/10 hover:border-[#6A2CFF]/40 hover:bg-[#FAF7F2]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#15101F]">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          t.status === "OPEN"
                            ? "bg-rose-100 text-rose-800"
                            : t.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-[#15101F]/10 text-[#15101F]"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="font-sans font-bold text-sm text-[#15101F] mt-2 line-clamp-1">
                      {t.subject}
                    </div>

                    <div className="text-[11px] font-mono text-[#15101F]/60 mt-1 flex items-center justify-between">
                      <span>{t.customerName}</span>
                      <span
                        className={`font-bold ${
                          isUrgent ? "text-rose-600" : "text-[#15101F]/50"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Ticket Conversation Thread */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#15101F]/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-lg text-[#15101F]">
                        {selectedTicket.subject}
                      </h2>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#15101F]/60 mt-1">
                      Ticket #{selectedTicket.ticketNumber} • Customer: {selectedTicket.customerName} ({selectedTicket.customerEmail})
                    </p>
                    <div className="mt-2">
                      <Link
                        href={`/admin/orders?search=${selectedTicket.orderNumber}`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#6A2CFF] hover:underline"
                      >
                        <span>View Order #{selectedTicket.orderNumber}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Status Dropdown / Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedTicket.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleSendReply("RESOLVED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {selectedTicket.status === "RESOLVED" && (
                      <button
                        onClick={() => handleSendReply("OPEN")}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#15101F]/15 text-[#15101F] font-mono text-xs font-bold hover:bg-[#FAF7F2] transition-colors"
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Thread */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {selectedTicket.messages.map((msg) => {
                    const isStaff = msg.senderRole !== "CUSTOMER";

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl ${
                          isStaff
                            ? "bg-[#6A2CFF]/5 border border-[#6A2CFF]/15 ml-6"
                            : "bg-[#FAF7F2] border border-[#15101F]/10 mr-6"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#15101F]/60 mb-1.5">
                          <span className="font-bold text-[#15101F]">
                            {msg.sender} ({msg.senderRole.replace(/_/g, " ")})
                          </span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString("en-IN")}</span>
                        </div>
                        <p className="text-xs font-sans text-[#15101F]/90 whitespace-pre-wrap leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Staff Reply Form */}
                <div className="pt-4 border-t border-[#15101F]/10 space-y-3">
                  <label className="block text-xs font-mono font-semibold text-[#15101F]/80">
                    Add Staff Reply / Action Note
                  </label>
                  <textarea
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response to the customer or internal atelier notes..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#15101F]/15 text-xs font-mono focus:outline-none focus:border-[#6A2CFF]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#15101F]/50">
                      Replies are audited and logged with operator credentials.
                    </span>
                    <button
                      onClick={() => handleSendReply()}
                      disabled={submittingReply || !replyMessage.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors shadow-sm disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingReply ? "Posting..." : "Send Reply"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#15101F]/10 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                <LifeBuoy className="w-12 h-12 text-[#6A2CFF]/20 mb-3" />
                <h3 className="font-display font-bold text-base text-[#15101F]">
                  Select a support ticket
                </h3>
                <p className="text-xs font-mono text-[#15101F]/60 max-w-sm mt-1">
                  View full customer inquiry threads, review quarantined complaints, and coordinate atelier remedies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}