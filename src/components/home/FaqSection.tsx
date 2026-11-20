"use client";

import React from "react";
import Link from "next/link";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS_COL1: FaqItem[] = [
  {
    id: "proof-approval",
    question: "Will I see a proof before you print my order?",
    answer:
      "Yes, 100% of the time. Once you place an order, our pre-press designers prepare an exact 1:1 scale digital PDF proof specifying pantone/spot matches, dimensions, and positioning. We do not start production until you give explicit sign-off via email or WhatsApp.",
  },
  {
    id: "low-res-art",
    question: "What if my logo is only a low-res JPEG or PNG?",
    answer:
      "Our team vectorizes customer logos at no extra charge. We manually trace lines and verify typography so it renders crisp and sharp at any scale. If a file cannot be recovered cleanly, we contact you immediately with recommendations before proceeding.",
  },
  {
    id: "split-sizes",
    question: "Can we mix sizes and colors in a single apparel tier?",
    answer:
      "Absolutely. In a 50-piece hoodie order, you can split across Small, Medium, Large, and XL, and even mix fabric colours (e.g. 25 Black, 25 Navy) as long as the print artwork and print colourway remain identical.",
  },
  {
    id: "magnetic-strength",
    question: "How strong are the magnetic badge backings?",
    answer:
      "We use triple-nickel-plated NdFeB neodymium rare-earth dual magnets. They grip securely through heavy tweed suit jackets, blazers, winter coats, and silk sarees without leaving puncture holes or tearing delicate fabric weave.",
  },
];

const FAQS_COL2: FaqItem[] = [
  {
    id: "gst-invoicing",
    question: "Do you provide GST invoices and accept corporate POs?",
    answer:
      "Yes. Every order includes an official 18% GST invoice featuring your company's legal name, GSTIN, and state code for full input tax credit. For enterprise POs over ₹50,000, we also support net-30 vendor onboarding.",
  },
  {
    id: "turnaround-rush",
    question: "How fast can you deliver rush orders across India?",
    answer:
      "Standard orders dispatch in 24-48 hours and arrive in 3-5 business days across 28,000+ PIN codes via Bluedart and Delhivery Air Express. Rush priority dispatch (same-day or 24h turnaround) is available on selected badge and polo lines.",
  },
  {
    id: "color-matching",
    question: "What if the printed colour doesn't match our brand palette?",
    answer:
      "We calibrate to ISO 12647-2 colour profiles and test under 5000K daylight simulation booths. If an order fails our approved digital proof tolerance by more than ΔE 2.0, we reprint the entire batch free of charge, no arguments.",
  },
  {
    id: "physical-samples",
    question: "Can we order a single sample piece before a bulk run?",
    answer:
      "Yes. You can order a pre-production specimen of any badge, polo, or notebook directly through the product page at our base tier (minimum 1-5 pieces depending on category). When you proceed with a 100+ bulk order, the sample cost is credited to your invoice.",
  },
];

  export function FaqSection({
    cmsFaqs,
  }: {
    cmsFaqs?: Array<{ id: string; question: string; answer: string; active?: boolean }>;
  } = {}) {
    let col1 = FAQS_COL1;
    let col2 = FAQS_COL2;

    if (cmsFaqs && cmsFaqs.length > 0) {
      const active = cmsFaqs.filter((f) => f.active !== false);
      const mid = Math.ceil(active.length / 2);
      col1 = active.slice(0, mid);
      col2 = active.slice(mid);
    }

    return (
      <section className="relative border-b-2 border-ink bg-white py-20 px-4 md:px-8">
        {/* Decorative Registration Marks */}
        <span className="absolute top-4 left-4 font-mono text-xs text-ink/30 select-none">
          ⌖ FAQ // TECHNICAL & COMMERCIAL POLICIES
        </span>

        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 border border-ink/20 bg-ink/5 px-3 py-1 text-xs font-mono font-medium text-ink uppercase tracking-wider mb-3">
              <HelpCircle className="h-3.5 w-3.5 text-violet" />
              Clear Answers
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-base text-ink/70 font-sans">
              Clear specifics on digital proofs, rush turnarounds, GST invoicing, and bulk tier splits.
            </p>
          </div>

          {/* 2-column layout on desktop, 1-column on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
            {/* Column 1 */}
            <Accordion.Root type="multiple" className="space-y-4">
                {
                  col1.map((item) => (
                    <Accordion.Item
                      key={item.id}
                      value={item.id}
                      className="border-2 border-ink bg-paper shadow-[3px_3px_0_0_#15101F] transition-all data-[state=open]:shadow-[5px_5px_0_0_#15101F]"
                    >
                      <Accordion.Header className="flex">
                        <Accordion.Trigger className="group flex flex-1 items-center justify-between p-5 text-left font-display text-base sm:text-lg font-bold text-ink hover:text-violet transition-colors">
                          <span>{item.question}</span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-ink transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-5 pb-5 pt-0 text-sm font-sans text-ink/75 leading-relaxed border-t border-ink/10 mt-1 pt-3">
                        {item.answer}
                      </Accordion.Content>
                    </Accordion.Item>
                  ))
                }
          </Accordion.Root>

            {/* Column 2 */}
            <Accordion.Root type="multiple" className="space-y-4">
                {
                  col2.map((item) => (
                    <Accordion.Item
                      key={item.id}
                      value={item.id}
                      className="border-2 border-ink bg-paper shadow-[3px_3px_0_0_#15101F] transition-all data-[state=open]:shadow-[5px_5px_0_0_#15101F]"
                    >
                      <Accordion.Header className="flex">
                        <Accordion.Trigger className="group flex flex-1 items-center justify-between p-5 text-left font-display text-base sm:text-lg font-bold text-ink hover:text-violet transition-colors">
                          <span>{item.question}</span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-ink transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-5 pb-5 pt-0 text-sm font-sans text-ink/75 leading-relaxed border-t border-ink/10 mt-1 pt-3">
                        {item.answer}
                      </Accordion.Content>
                    </Accordion.Item>
                  ))
                }
          </Accordion.Root>
          </div>

          {/* Footer actions: Shop now + View all FAQs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6 border-t border-ink/10">
            <Link
              href="/collections/all"
              className="border-2 border-ink bg-violet text-white font-mono text-sm font-bold px-6 py-3 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#15101F] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
            >
              <span>Shop Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="text-xs font-mono font-bold uppercase tracking-wider text-ink hover:text-violet underline underline-offset-4"
            >
              Have a custom query? Contact our pre-press team →
            </Link>
          </div>
        </div>
      </section>
    );
  }

