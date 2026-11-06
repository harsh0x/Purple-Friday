"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

const contactSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please provide a valid work email address."),
  phone: z.string().min(10, "Please provide a valid 10-digit WhatsApp number."),
  company: z.string().optional(),
  productCategory: z.string().min(1, "Please choose a product category."),
  quantity: z.string().min(1, "Please enter an estimated quantity."),
  message: z.string().min(10, "Please describe your merchandise requirements."),
  // Honeypot field for anti-bot
  botCheck: z.string().max(0, "Spam detected."),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      productCategory: "Magnetic Badges",
      quantity: "50",
      message: "",
      botCheck: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    // If honeypot is populated, drop silently
    if (data.botCheck) return;

    try {
      // Simulate client action submission
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      toast.success("Thank you! Our pre-press coordinator will contact you via WhatsApp shortly.");
      reset();
    } catch {
      toast.error("Failed to send message. Please reach us directly on WhatsApp.");
    }
  };

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* Header */}
      <section className="border-b-2 border-pf-ink bg-white py-14 px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-3">
          <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
            Direct Studio Line
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-pf-ink">
            Speak with our pressmen
          </h1>
          <p className="text-sm font-sans text-pf-ink/75 max-w-xl mx-auto">
            Need custom pantone matching, rush turnaround for an upcoming summit, or physical samples? We respond within 2 hours.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Contact Info & Stylized SVG Map (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border-2 border-pf-ink bg-white p-6 shadow-[5px_5px_0_0_#15101F] space-y-6">
              <h2 className="font-display text-xl font-bold text-pf-ink border-b-2 border-pf-ink pb-3">
                Production Ateliers
              </h2>

              {/* Bengaluru Atelier */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-pf-violet shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-mono text-xs font-bold text-pf-ink uppercase">
                    Bengaluru Hardware & Pre-Press Lab
                  </h3>
                  <p className="font-sans text-xs text-pf-ink/75 mt-0.5">
                    42/1, 1st Cross, HSR Layout Sector 3, Bengaluru, Karnataka 560102
                  </p>
                </div>
              </div>

              {/* Tirupur Unit */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-pf-violet shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-mono text-xs font-bold text-pf-ink uppercase">
                    Tirupur Heavy Textile Line
                  </h3>
                  <p className="font-sans text-xs text-pf-ink/75 mt-0.5">
                    18 Cotton Exchange Road, Tirupur, Tamil Nadu 641604
                  </p>
                </div>
              </div>

              {/* Direct Channels */}
              <div className="pt-2 border-t border-pf-ink/10 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    +91 98765 43210 (Direct WhatsApp Proofs)
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-pf-violet shrink-0" />
                  <a href="mailto:orders@purplefriday.in" className="hover:underline text-pf-ink">
                    orders@purplefriday.in
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-pf-ink/50 shrink-0" />
                  <span className="text-pf-ink/75">Mon–Sat: 9:30 AM – 7:30 PM IST</span>
                </div>
              </div>
            </div>

            {/* Embedded Stylized SVG Map of India South Production Corridor */}
            <div className="border-2 border-pf-ink bg-pf-ink p-5 text-white shadow-[4px_4px_0_0_#15101F] relative overflow-hidden">
              <span className="font-mono text-[10px] text-pf-lime uppercase tracking-widest block mb-2">
                Manufacturing Hubs • Peninsular Corridor
              </span>
              <svg
                viewBox="0 0 300 160"
                className="w-full h-auto text-white/40"
                fill="none"
                stroke="currentColor"
              >
                {/* Simplified contour representation */}
                <path
                  d="M40 20 L260 20 L240 140 L80 140 Z"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.4"
                />
                {/* Connecting corridor line */}
                <line x1="110" y1="60" x2="190" y2="105" stroke="#D8FF3F" strokeWidth="2.5" />
                {/* Node 1: Bengaluru */}
                <circle cx="110" cy="60" r="6" fill="#6A2CFF" stroke="#FFFFFF" strokeWidth="2" />
                <text x="110" y="45" fill="#FFFFFF" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  BENGALURU (Lab & Badges)
                </text>
                {/* Node 2: Tirupur */}
                <circle cx="190" cy="105" r="6" fill="#D8FF3F" stroke="#15101F" strokeWidth="2" />
                <text x="190" y="125" fill="#FFFFFF" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  TIRUPUR (Knitting & Tajima)
                </text>
              </svg>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-white/60">
                <span>TRANSIT: 6 HRS VIA NH44</span>
                <span>DISPATCH: AIR EXPRESS</span>
              </div>
            </div>
          </div>

          {/* Right: Contact & Bulk Brief Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="border-2 border-pf-ink bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#15101F]">
              <div className="border-b-2 border-pf-ink pb-4 mb-6">
                <span className="font-mono text-xs uppercase font-bold text-pf-violet">
                  Free Pre-Press Consultation
                </span>
                <h2 className="font-display text-2xl font-bold text-pf-ink mt-0.5">
                  Request a Quote or Order Assistance
                </h2>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-pf-ink">
                    Message Dispatched to Workshop Floor
                  </h3>
                  <p className="text-sm font-sans text-pf-ink/75 max-w-md mx-auto">
                    Anand or Farhan from our prepress engineering team will review your quantities and reach out on WhatsApp within 2 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="border-2 border-pf-ink bg-pf-paper font-mono text-xs font-bold px-5 py-2.5 hover:bg-pf-ink hover:text-white transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Honeypot field (hidden from screen, trapped if filled by bots) */}
                  <input
                    type="text"
                    {...register("botCheck")}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Rohan Shrestha"
                        {...register("fullName")}
                        className="w-full h-11 px-3 border-2 border-pf-ink bg-pf-paper text-xs font-sans text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                      />
                      {errors.fullName && (
                        <p className="text-[11px] text-rose-600 font-mono mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        placeholder="rohan@company.com"
                        {...register("email")}
                        className="w-full h-11 px-3 border-2 border-pf-ink bg-pf-paper text-xs font-sans text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 font-mono mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Phone & Company Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        {...register("phone")}
                        className="w-full h-11 px-3 border-2 border-pf-ink bg-pf-paper text-xs font-sans text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-rose-600 font-mono mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Razorpay / Zerodha"
                        {...register("company")}
                        className="w-full h-11 px-3 border-2 border-pf-ink bg-pf-paper text-xs font-sans text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet"
                      />
                    </div>
                  </div>

                  {/* Category & Quantity Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                        Product Interest
                      </label>
                      <select
                        {...register("productCategory")}
                        className="w-full h-11 px-3 border-2 border-pf-ink bg-pf-paper text-xs font-mono font-bold text-pf-ink focus:outline-none"
                      >
                        <option value="Magnetic Badges">Magnetic Badges (No Pinholes)</option>
                        <option value="T-Shirts">100% Bio-Washed T-Shirts</option>
                        <option value="Polo Shirts">Executive Piqué Polos</option>
                        <option value="Hoodies">Heavyweight Fleece Hoodies</option>
                        <option value="Caps">Structured Cotton Twill Caps</option>
                        <option value="Corporate Gifts">Executive Gifts (Bottles, Pens, Notebooks)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                        Estimated Quantity
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        {...register("quantity")}
                        className="w-full h-11 px-3 border-2 border-pf-ink bg-pf-paper text-xs font-mono font-bold text-pf-ink focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Message / Brief */}
                  <div>
                    <label className="block font-mono text-xs font-bold text-pf-ink uppercase mb-1">
                      Project Details & Target Delivery Date *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your event, placement requirements, pantone numbers, or invoice billing needs..."
                      {...register("message")}
                      className="w-full p-3 border-2 border-pf-ink bg-pf-paper text-xs font-sans text-pf-ink focus:outline-none focus:ring-2 focus:ring-pf-violet resize-none"
                    />
                    {errors.message && (
                      <p className="text-[11px] text-rose-600 font-mono mt-1">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-3 border-2 border-pf-ink bg-pf-violet text-white font-mono text-sm font-bold uppercase tracking-wider py-4 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isSubmitting ? "Dispatching..." : "Send Brief to Atelier"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
