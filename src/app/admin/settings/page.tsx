"use client";

import React from "react";
import {
  Shield,
  Server,
  CreditCard,
  Printer,
} from "lucide-react";

export default function AdminSettingsPage() {
  const settingsCards = [
    {
      title: "Pre-Press & Proof Tolerances",
      description: "Automated checks enforced when customers upload artwork in the Customizer Studio",
      icon: Printer,
      items: [
        { label: "Minimum Target DPI", value: "200 DPI" },
        { label: "Critical Low DPI Warning", value: "< 150 DPI" },
        { label: "Vector Bleed Margin", value: "3.0 mm outer trim" },
        { label: "Safe Zone Boundary", value: "4.0 mm inner margin" },
        { label: "Auto-Proof Watermark", value: "STAMP_WATERMARK_PREVIEW" },
      ],
    },
    {
      title: "Taxation & Compliance (India)",
      description: "Indian GST and invoicing rules applied to corporate checkouts",
      icon: Shield,
      items: [
        { label: "Standard GST Rate", value: "18% (Custom Goods / Job Work)" },
        { label: "Seller Home State", value: "29 (Karnataka - Bengaluru Hub)" },
        { label: "Intra-State Tax Split", value: "CGST 9% + SGST 9%" },
        { label: "Inter-State Tax", value: "IGST 18%" },
        { label: "Invoice Numbering Format", value: "PF-YYMM-XXXXX" },
      ],
    },
    {
      title: "Payment Gateway & Security",
      description: "Razorpay webhooks, signature timing safety, and brute-force mitigation",
      icon: CreditCard,
      items: [
        { label: "Signature Verification", value: "crypto.timingSafeEqual (constant-time)" },
        { label: "Webhook Deduplication", value: "Sliding window in-memory registry" },
        { label: "Brute Force Threshold", value: "5 consecutive failed attempts" },
        { label: "Account Lockout Duration", value: "15 minutes" },
        { label: "DDE CSV Protection", value: "Prefix formula triggers (=, +, -, @) with '" },
      ],
    },
    {
      title: "Storage & Microservices Fallbacks",
      description: "Resilience fallbacks when third-party cloud services are unreachable",
      icon: Server,
      items: [
        { label: "Cloudinary CDN", value: "Local ./storage/uploads/ mirror active" },
        { label: "Neon PostgreSQL", value: "In-memory atomic order/review store active" },
        { label: "Upstash Redis", value: "LRU token bucket sliding window active" },
        { label: "Gemini Vision API", value: "Studio contrast heuristic fallback ready" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-white/10">
        <h1 className="font-display font-black text-3xl text-white tracking-tight">
          System Architecture & Shopfloor Settings
        </h1>
        <p className="text-xs font-mono text-white/50 mt-1">
          Active operational parameters, security controls, and prepress configurations
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-[#181324] p-6 rounded-2xl border border-white/10 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="p-2 rounded-xl bg-pf-violet/10 text-pf-violet">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    {card.title}
                  </h3>
                  <p className="text-[11px] font-mono text-white/40">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {card.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-xs font-mono py-1 border-b border-white/5"
                  >
                    <span className="text-white/60">{item.label}</span>
                    <span className="text-pf-lime font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
