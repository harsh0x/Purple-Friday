"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UploadCloud, X, CheckCircle2, FileText, Phone, Mail, User } from "lucide-react";
import { toast } from "sonner";

interface LetOurTeamDesignModalProps {
  productName: string;
  productSlug?: string;
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function LetOurTeamDesignModal({
  productName,
  productSlug = "product",
  triggerButton,
  isOpen,
  onClose,
}: LetOurTeamDesignModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      if (!val && onClose) onClose();
    } else {
      setInternalOpen(val);
    }
  };
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 20 * 1024 * 1024) {
        toast.error("File size exceeds 20MB limit.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Please fill in your name, email, and phone.");
      return;
    }

    setSubmitted(true);
    toast.success("Design brief submitted! A prepress specialist will contact you on WhatsApp within 2 hours.");
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setFile(null);
      setNotes("");
    }, 2500);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {triggerButton ? (
          triggerButton
        ) : (
          <button
            type="button"
            className="text-xs font-mono font-bold text-pf-violet hover:underline flex items-center gap-1.5"
          >
            <span>Have a design? Let our team design it for you →</span>
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-pf-ink/70 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg bg-white border-2 border-pf-ink p-6 shadow-[8px_8px_0_0_#15101F] focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b-2 border-pf-ink mb-5">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-pf-violet">
                Complimentary Studio Service
              </span>
              <Dialog.Title className="font-display text-xl font-bold text-pf-ink">
                Let Our Team Design It
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
            <div className="py-8 text-center space-y-3">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="font-display text-xl font-bold text-pf-ink">
                Artwork Brief Received!
              </h4>
              <p className="text-sm font-sans text-pf-ink/75 max-w-sm mx-auto">
                Our pre-press design team is reviewing your files for <strong>{productName}</strong>. You will receive an exact 3D proof via WhatsApp within 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs font-sans text-pf-ink/75 leading-relaxed">
                Drop your raw logo, sketches, or brand guide. Our in-house designers vectorize and format it onto <strong>{productName}</strong> at no extra cost.
              </p>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-pf-ink/40 bg-pf-paper p-5 text-center relative hover:border-pf-violet transition-colors">
                <input
                  type="file"
                  id={`file-upload-${productSlug}`}
                  accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps,.psd"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-7 w-7 mx-auto text-pf-violet mb-2" />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-pf-ink">
                    <FileText className="h-4 w-4 text-pf-violet" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="text-pf-ink/50">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-mono text-xs font-bold text-pf-ink block">
                      Drag & drop your logo / artwork file
                    </span>
                    <span className="font-sans text-[11px] text-pf-ink/60">
                      Supports AI, PDF, EPS, SVG, PNG, JPG (up to 20MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-white font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                  />
                </div>
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="email"
                      required
                      placeholder="priya@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-white font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                    WhatsApp Phone
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-white font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                    />
                  </div>
                </div>
              </div>

              {/* Design Notes */}
              <div>
                <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                  Design Instructions / Placement Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Center logo on chest, leave 2-inch margins, use exact Pantone 2685 C violet..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border-2 border-pf-ink bg-white font-sans text-xs text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full border-2 border-pf-ink bg-pf-violet text-white font-mono text-sm font-bold uppercase tracking-wider py-3 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] transition-all"
                >
                  Submit Brief for Free 3D Proof
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

