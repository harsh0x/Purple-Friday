"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UploadCloud, X, CheckCircle2, FileText, Send, Calendar, Building, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";

interface BulkQuoteModalProps {
  trigger?: React.ReactNode;
  defaultProduct?: string;
}

export function BulkQuoteModal({ trigger, defaultProduct = "Magnetic Badges" }: BulkQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState(defaultProduct);
  const [quantity, setQuantity] = useState("100");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        toast.error("File size exceeds 25MB limit.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 50) {
      toast.error("Bulk requests require a minimum of 50 units.");
      return;
    }

    if (!name || !email || !phone) {
      toast.error("Please complete your contact details.");
      return;
    }

    setSubmitted(true);
    toast.success("Bulk RFQ received! An enterprise account manager will respond with volume pricing in 2 hours.");
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setFile(null);
      setNotes("");
    }, 2500);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            className="border-2 border-pf-ink bg-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 shadow-[2px_2px_0_0_#15101F] hover:bg-pf-paper hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Bulk Quote (50+ pcs)
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-pf-ink/75 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-xl bg-white border-2 border-pf-ink p-6 sm:p-8 shadow-[8px_8px_0_0_#15101F] focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b-2 border-pf-ink mb-6">
            <div>
              <span className="font-mono text-[11px] uppercase font-bold text-pf-violet tracking-wider">
                Enterprise & Large Volume RFQ
              </span>
              <Dialog.Title className="font-display text-2xl font-bold text-pf-ink mt-0.5">
                Request a Bulk Quote (50+ pcs)
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                className="p-1 rounded-full border border-pf-ink hover:bg-pf-paper"
              >
                <X className="h-5 w-5 text-pf-ink" />
              </button>
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-pf-ink">
                Bulk Quote Request Received
              </h3>
              <p className="text-sm font-sans text-pf-ink/75 max-w-md mx-auto">
                Our enterprise estimating desk has logged your RFQ for <strong>{quantity} units</strong> of {product}. You will receive a formalized GST pro-forma quote with custom tier breakdowns in under 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Contact Name *
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Deepika Rao"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-pf-paper font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Company / Organization *
                  </label>
                  <div className="relative">
                    <Building className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Swiggy"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-pf-paper font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="email"
                      required
                      placeholder="deepika@swiggy.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-pf-paper font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    WhatsApp Phone *
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-pf-paper font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                    />
                  </div>
                </div>
              </div>

              {/* Product Interest, Quantity (Min 50), and Target Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Product
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full h-10 px-2 border-2 border-pf-ink bg-pf-paper font-mono text-xs font-bold text-pf-ink focus:outline-none"
                  >
                    <option value="Magnetic Badges">Magnetic Badges</option>
                    <option value="T-Shirts">T-Shirts (180/240 GSM)</option>
                    <option value="Polo Shirts">Corporate Polos (230 GSM)</option>
                    <option value="Hoodies">Fleece Hoodies (320 GSM)</option>
                    <option value="Caps">Twill & Mesh Caps</option>
                    <option value="Steel Flasks">Matte Steel Flasks</option>
                    <option value="Hardbound Journals">Linen Journals</option>
                    <option value="Executive Gift Set">Complete Onboarding Kit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Quantity (Min. 50)
                  </label>
                  <input
                    type="number"
                    min={50}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full h-10 px-3 border-2 border-pf-ink bg-pf-paper font-mono text-xs font-bold text-pf-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Target Deadline
                  </label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full h-10 pl-9 pr-2 border-2 border-pf-ink bg-pf-paper font-mono text-xs text-pf-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Design Brief File Dropzone */}
              <div>
                <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                  Artwork / Design Brief (Optional)
                </label>
                <div className="border-2 border-dashed border-pf-ink/40 bg-pf-paper p-4 text-center relative hover:border-pf-violet transition-colors">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps,.zip"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-6 w-6 mx-auto text-pf-violet mb-1" />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-pf-ink">
                      <FileText className="h-4 w-4 text-pf-violet" />
                      <span className="truncate max-w-[220px]">{file.name}</span>
                      <span className="text-pf-ink/50">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-pf-ink block">
                      Drop vector artwork, logo, or brand guide (up to 25MB)
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                  Additional Notes / Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Need custom pantone spot inks, individual employee name personalization, or staggered multi-office shipping..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border-2 border-pf-ink bg-pf-paper font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-3 border-2 border-pf-ink bg-pf-violet text-white font-mono text-sm font-bold uppercase tracking-wider py-4 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>Request Official Tier Quote</span>
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
