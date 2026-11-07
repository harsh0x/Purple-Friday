import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions & Guidelines | Purple Friday",
  description: "Everything you need to know about bulk orders, prepress proof approvals, 18% GST input credit, vector logo formats, and pan-India express delivery.",
};

const FAQ_SECTIONS = [
  {
    category: "Prepress & Artwork Approvals",
    items: [
      {
        q: "Will I see a proof before you print my order?",
        a: "Yes, 100% of the time. Once you place an order, our prepress engineers prepare an exact 1:1 scale digital PDF proof specifying pantone matches, dimensions, and placement margins. We do not turn on physical production machines until you give explicit sign-off via WhatsApp or email.",
      },
      {
        q: "What file formats do you accept for custom printing?",
        a: "We natively support vector SVG, AI, EPS, and high-resolution PDF files. If you only have a PNG or JPG, our in-house designers trace and vectorize your logo at no extra cost.",
      },
      {
        q: "How does your color-matching calibration work?",
        a: "We calibrate strictly to ISO 12647-2 colour profiles under 5000K daylight booths. If your pressed merchandise deviates by more than ΔE 2.0 from your approved proof, we reprint the batch free of charge.",
      },
    ],
  },
  {
    category: "Bulk Pricing, MOQs & Invoicing",
    items: [
      {
        q: "What is the minimum order quantity (MOQ)?",
        a: "Our MOQs start as low as 5 pieces for badges, t-shirts, and polos, and 10-15 pieces for caps and executive gifts. Volume discounts kick in at 15, 50, 100, and 250+ units.",
      },
      {
        q: "Do you provide official 18% GST invoices for business expense write-offs?",
        a: "Yes. Every order generates an instant GST tax invoice specifying your legal corporate entity name, 15-character GSTIN, and HSN codes for 100% input tax credit eligibility.",
      },
      {
        q: "Can we mix and match sizes and colors in a single bulk order?",
        a: "Yes. For apparel orders (e.g., 50 hoodies), you can divide across S, M, L, XL, and XXL in various blank colors, as long as the print artwork and print colorway remain identical.",
      },
    ],
  },
  {
    category: "Manufacturing & Delivery Across India",
    items: [
      {
        q: "How fast is delivery to my city?",
        a: "Standard runs dispatch from our Bengaluru and Tirupur ateliers in 24-48 hours and arrive in 3-5 business days across 28,000+ PIN codes via Bluedart and Delhivery Air Express.",
      },
      {
        q: "How durable are the dual neodymium magnetic badge fasteners?",
        a: "We use nickel-plated NdFeB neodymium dual magnets capable of holding firmly through heavy blazers, tweed suits, and silk sarees without puncturing threads or damaging fabrics.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="bg-paper min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-2 border-ink bg-white p-8 sm:p-12 shadow-stamp">
          <div className="inline-flex items-center gap-2 border border-ink/20 bg-spot-lime px-3 py-1 text-xs font-mono font-bold text-ink uppercase tracking-wider mb-4">
            <HelpCircle className="h-4 w-4" />
            Atelier Knowledge Base
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight">
            FAQ & Production Guidelines
          </h1>
          <p className="mt-4 text-base font-sans text-ink/75 leading-relaxed">
            Everything you need to know about vector logo requirements, volume pricing tiers, 18% GST input tax credit, and zero-defect prepress proofs.
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="space-y-8">
          {FAQ_SECTIONS.map((sec, idx) => (
            <div key={idx} className="border-2 border-ink bg-white p-6 sm:p-8 shadow-card space-y-4">
              <h2 className="font-display text-xl font-bold text-ink border-b border-ink/15 pb-3">
                {sec.category}
              </h2>

              <Accordion.Root type="multiple" className="space-y-3">
                {sec.items.map((item, itemIdx) => (
                  <Accordion.Item
                    key={itemIdx}
                    value={`item-${idx}-${itemIdx}`}
                    className="border border-ink/20 bg-paper-pure rounded-xs overflow-hidden"
                  >
                    <Accordion.Header>
                      <Accordion.Trigger className="w-full p-4 text-left font-display font-bold text-sm sm:text-base text-ink flex items-center justify-between hover:text-violet transition-colors group">
                        <span>{item.q}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="px-4 pb-4 font-sans text-xs sm:text-sm text-ink/80 leading-relaxed border-t border-ink/10 pt-3">
                      {item.a}
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </div>
          ))}
        </div>

        {/* Assistance CTA Card */}
        <div className="border-2 border-ink bg-ink text-white p-8 text-center space-y-4 shadow-stamp">
          <h3 className="font-display text-2xl font-black text-white">
            Have a custom design inquiry or rush enterprise deadline?
          </h3>
          <p className="font-sans text-sm text-white/80 max-w-lg mx-auto">
            Our prepress technicians and enterprise gifting managers respond in under 2 hours with digital proofs and custom bulk quotations.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-spot-lime bg-spot-lime text-ink font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 shadow-stamp-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <span>Talk to Prepress Specialist</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/category/all"
              className="inline-flex items-center gap-2 border-2 border-white/40 bg-transparent text-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 hover:bg-white/10 transition-all"
            >
              <span>Explore Product Catalogue</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

