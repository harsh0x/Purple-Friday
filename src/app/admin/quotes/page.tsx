"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Link as LinkIcon,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { QuoteData, QuoteStatus } from "@/server/quotes/quotes-service";

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | QuoteStatus>("ALL");

  // Quote Builder Modal State
  const [showBuilder, setShowBuilder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [buyerGstin, setBuyerGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Karnataka");
  const [validDays, setValidDays] = useState(15);
  const [shippingFee, setShippingFee] = useState(0);

  // Line items state
  const [items, setItems] = useState<
    Array<{
      productSlug: string;
      name: string;
      qty: number;
      negotiatedUnitPrice: number;
      belowSlabReason: string;
    }>
  >([
    {
      productSlug: "executive-pique-polo",
      name: "Executive Cotton Piqué Polo Shirt",
      qty: 100,
      negotiatedUnitPrice: 250,
      belowSlabReason: "Corporate annual bulk contract volume discount",
    },
  ]);

  const [savingQuote, setSavingQuote] = useState(false);

  // Payment Link Modal / Status State
  const [paymentLinkResult, setPaymentLinkResult] = useState<{
    quoteNumber: string;
    configured: boolean;
    url: string | null;
    message: string;
  } | null>(null);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quotes");
      const data = await res.json();
      if (data.quotes) {
        setQuotes(data.quotes);
      }
    } catch {
      toast.error("Failed to load corporate quotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productSlug: "classic-crewneck-tshirt",
        name: "Classic Crewneck Cotton T-Shirt",
        qty: 50,
        negotiatedUnitPrice: 180,
        belowSlabReason: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuote(true);
    try {
      const payload = {
        customerName,
        company,
        email,
        phone,
        buyerGstin,
        placeOfSupply,
        validDays: Number(validDays),
        shippingFee: Number(shippingFee),
        items,
        status: "DRAFT" as QuoteStatus,
      };

      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Quote #${data.quote.quoteNumber} built successfully!`);
        setShowBuilder(false);
        loadQuotes();
      } else {
        toast.error(data.error || "Failed to build quote");
      }
    } catch {
      toast.error("Network error while building quote");
    } finally {
      setSavingQuote(false);
    }
  };

  const handleGeneratePaymentLink = async (quote: QuoteData) => {
    try {
      toast.info(`Generating payment link for #${quote.quoteNumber}...`);
      const res = await fetch(`/api/admin/quotes/${quote.id}/payment-link`, {
        method: "POST",
      });
      const data = await res.json();

      setPaymentLinkResult({
        quoteNumber: quote.quoteNumber,
        configured: data.configured,
        url: data.paymentUrl,
        message: data.message,
      });

      if (data.configured && data.paymentUrl) {
        toast.success("Payment link ready!");
        loadQuotes();
      } else {
        toast.warning(data.message);
      }
    } catch {
      toast.error("Error creating payment link");
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    if (activeTab === "ALL") return true;
    return q.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              Quotes & RFQ Invoices
            </h1>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-1">
            Corporate volume quotes, negotiated price authorization, Razorpay payment links, and GST tax invoice PDFs
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBuilder(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Quote
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ink/10 pb-3 overflow-x-auto text-xs font-mono">
        {(["ALL", "DRAFT", "SENT", "ACCEPTED", "EXPIRED", "DECLINED"] as const).map(
          (tab) => {
            const count =
              tab === "ALL"
                ? quotes.length
                : quotes.filter((q) => q.status === tab).length;
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${isActive
                  ? "bg-ink text-white font-bold"
                  : "text-ink/60 hover:bg-paper hover:text-ink"
                  }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-ink/5 text-ink/60"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-ink/10 bg-paper/40 text-[11px] uppercase tracking-wider text-ink/60">
                <th className="py-3 px-4">Quote # & Client</th>
                <th className="py-3 px-3">Company & GSTIN</th>
                <th className="py-3 px-3">Items & Qty</th>
                <th className="py-3 px-3 text-right">Total (Paise / INR)</th>
                <th className="py-3 px-3">State & Tax</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/40">
                    Loading quotes...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/40">
                    No quotes found in this view.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const isInterstate = q.placeOfSupply.toLowerCase() !== "karnataka";

                  return (
                    <tr key={q.id} className="hover:bg-paper/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-ink">{q.quoteNumber}</span>
                          <span className="text-[11px] text-ink/60">{q.customerName}</span>
                          <span className="text-[10px] text-ink/40">{q.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-ink font-medium">
                            {q.company || "Individual Buyer"}
                          </span>
                          <span className="text-ink/50 text-[10px]">
                            {q.buyerGstin || "Unregistered Buyer"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-bold text-violet">
                            {q.items.length} line items
                          </span>
                          <span className="text-ink/60">
                            {q.items.reduce((s, i) => s + i.qty, 0)} total pcs
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col">
                          <span className="font-bold text-ink text-sm">
                            ₹{(q.totalPaise / 100).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-ink/40">
                            {q.totalPaise} paise
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-[11px]">
                        <div className="flex flex-col">
                          <span className="text-ink">{q.placeOfSupply}</span>
                          <span className="text-ink/50 text-[10px]">
                            {isInterstate ? "IGST (18%)" : "CGST+SGST (9%+9%)"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${q.status === "ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                            : q.status === "SENT"
                              ? "bg-violet/10 text-violet border border-violet/20"
                              : q.status === "EXPIRED"
                                ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                : "bg-paper text-ink/70 border border-ink/10"
                            }`}
                        >
                          {q.status === "ACCEPTED" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : q.status === "SENT" ? (
                            <Send className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {q.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download Quote PDF */}
                          <a
                            href={`/api/admin/quotes/${q.id}/pdf`}
                            download
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-paper border border-ink/10 text-ink/70 hover:text-ink text-[11px] transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </a>

                          {/* Pay Now Link Button */}
                          <button
                            type="button"
                            onClick={() => handleGeneratePaymentLink(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet/10 text-violet hover:bg-violet hover:text-white text-[11px] font-medium transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Pay Link
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Link Feedback Dialog */}
      {paymentLinkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-ink/10 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="font-display font-bold text-lg text-ink">
                Payment Link: #{paymentLinkResult.quoteNumber}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentLinkResult(null)}
                className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentLinkResult.configured && paymentLinkResult.url ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Razorpay Payment Link Active</p>
                    <p className="text-[11px] mt-0.5">
                      Customer receives SMS & Email notification with secure checkout link.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-paper border border-ink/10 break-all text-[11px]">
                  {paymentLinkResult.url}
                </div>

                <a
                  href={paymentLinkResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-violet text-white rounded-xl text-center flex items-center justify-center gap-2 font-medium hover:bg-violet-hover transition-colors"
                >
                  <span>Open Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Integration Not Configured</p>
                    <p className="text-[11px] mt-0.5">{paymentLinkResult.message}</p>
                  </div>
                </div>

                <p className="text-[11px] text-ink/60">
                  Real Razorpay payment link requires active external keys:{" "}
                  <code className="text-violet font-bold">Razorpay API credentials</code>. The UI safely degrades and disables payment links until configured.
                </p>

                <button
                  type="button"
                  onClick={() => setPaymentLinkResult(null)}
                  className="w-full py-2 bg-paper border border-ink/10 rounded-xl text-ink font-medium hover:bg-white"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-ink/10 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Build Corporate Quote
                </h3>
                <p className="text-xs font-mono text-ink/50 mt-0.5">
                  Configure negotiated line rates, mandatory below-slab discount audits, and GST tax splits
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Vikram Malhotra"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Company Legal Entity</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Cloud India Pvt Ltd"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram@acmecloud.in"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Buyer GSTIN</label>
                  <input
                    type="text"
                    value={buyerGstin}
                    onChange={(e) => setBuyerGstin(e.target.value)}
                    placeholder="29AAFCA1234F1Z5"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Place of Supply *</label>
                  <select
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                  >
                    <option value="Karnataka">Karnataka (Intrastate 9%+9%)</option>
                    <option value="Maharashtra">Maharashtra (Interstate IGST 18%)</option>
                    <option value="Delhi">Delhi (Interstate IGST 18%)</option>
                    <option value="Tamil Nadu">Tamil Nadu (Interstate IGST 18%)</option>
                    <option value="Telangana">Telangana (Interstate IGST 18%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Freight / Shipping (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    placeholder="0 for Free Delivery"
                    className="w-full px-3 py-2 border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-3 border-t border-ink/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">Quotation Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-[11px] text-violet font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Line Item
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-ink/10 bg-paper/30 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-ink/50 uppercase">
                          Item Description
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 border border-ink/10 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-ink/50 uppercase">
                          Qty (Pcs)
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, qty: val } : it))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 border border-ink/10 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-ink/50 uppercase">
                          Negotiated Rate (₹/pc)
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.negotiatedUnitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, negotiatedUnitPrice: val } : it
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 border border-ink/10 rounded-lg bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-ink/50 uppercase">
                          Below-Slab Authorization Rationale *
                        </label>
                        <input
                          type="text"
                          value={item.belowSlabReason}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, belowSlabReason: val } : it
                              )
                            );
                          }}
                          placeholder="Required if below standard slab price"
                          className="w-full px-2.5 py-1.5 border border-ink/10 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    {items.length > 1 && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[10px] text-rose-600 hover:underline"
                        >
                          Remove Item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="px-4 py-2 border border-ink/10 rounded-xl text-ink/60 hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuote}
                  className="px-5 py-2 bg-violet text-white rounded-xl hover:bg-violet-hover disabled:opacity-50"
                >
                  {savingQuote ? "Building..." : "Generate Quote & PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
