"use client";

import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Sliders, Truck, RefreshCw } from "lucide-react";

interface ProductAccordionTabsProps {
  specs?: Array<{ label: string; value: string }>;
  printMethod?: string;
  minQty?: number;
}

export function ProductAccordionTabs({
  specs = [],
  printMethod = "Offset CMYK / High-Density Screen Print",
  minQty = 5,
}: ProductAccordionTabsProps) {
  return (
    <div className="border-2 border-ink bg-white shadow-[4px_4px_0_0_#15101F]">
      <Accordion.Root type="multiple" defaultValue={["specs"]} className="divide-y-2 divide-ink">
        {/* Accordion Item 1: Specifications */}
        <Accordion.Item value="specs">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between p-4 text-left font-display text-sm font-bold text-ink hover:text-violet transition-colors">
              <span className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-violet" />
                Technical Specifications & Blueprint
              </span>
              <ChevronDown className="h-4 w-4 text-ink transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="p-4 pt-1 text-xs font-sans text-ink/75 leading-relaxed bg-paper/30">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-ink/10 pb-1">
                <dt className="text-ink/60">Print Technology:</dt>
                <dd className="font-bold text-ink text-right">{printMethod}</dd>
              </div>
              <div className="flex justify-between border-b border-ink/10 pb-1">
                <dt className="text-ink/60">Minimum Order:</dt>
                <dd className="font-bold text-ink text-right">{minQty} pieces</dd>
              </div>
              <div className="flex justify-between border-b border-ink/10 pb-1">
                <dt className="text-ink/60">Color Calibration:</dt>
                <dd className="font-bold text-ink text-right">ISO 12647-2 Spot Match</dd>
              </div>
              <div className="flex justify-between border-b border-ink/10 pb-1">
                <dt className="text-ink/60">Origin & Craft:</dt>
                <dd className="font-bold text-ink text-right">Made in Bengaluru / Tirupur</dd>
              </div>
              {specs.map((s, idx) => (
                <div key={idx} className="flex justify-between border-b border-ink/10 pb-1">
                  <dt className="text-ink/60">{s.label}:</dt>
                  <dd className="font-bold text-ink text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Accordion.Content>
        </Accordion.Item>

        {/* Accordion Item 2: Shipping & Returns (GST details) */}
        <Accordion.Item value="shipping">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between p-4 text-left font-display text-sm font-bold text-ink hover:text-violet transition-colors">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-violet" />
                Shipping, GST Invoicing & Pre-Print Approval
              </span>
              <ChevronDown className="h-4 w-4 text-ink transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="p-4 pt-1 text-xs font-sans text-ink/75 leading-relaxed bg-paper/30 space-y-2">
            <p>
              <strong>100% Pre-Print Approval Guarantee:</strong> We never hit print without your digital sign-off. You will inspect an exact 1:1 scale proof with dimensions and Pantone approximations sent straight to your WhatsApp and email.
            </p>
            <p>
              <strong>Indian GST Invoicing (18% Input Credit):</strong> Every order receives an official tax invoice containing your company name, GSTIN, and SAC code (998912) so you claim 100% input tax credit on business expenses.
            </p>
            <p>
              <strong>Express Pan-India Logistics:</strong> Air-couriered via Bluedart and Delhivery across 28,000+ PIN codes. Standard turnaround is 24-48 hours processing + 2-4 days transit.
            </p>
          </Accordion.Content>
        </Accordion.Item>

        {/* Accordion Item 3: Care Instructions */}
        <Accordion.Item value="care">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between p-4 text-left font-display text-sm font-bold text-ink hover:text-violet transition-colors">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-violet" />
                Care Instructions & Wash Durability
              </span>
              <ChevronDown className="h-4 w-4 text-ink transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="p-4 pt-1 text-xs font-sans text-ink/75 leading-relaxed bg-paper/30 space-y-1.5">
            <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
              <li>Machine wash cold (30°C max) inside out with mild liquid detergent.</li>
              <li>Do not iron directly over printed or embroidered embellishments.</li>
              <li>Tumble dry low or hang dry in shade to preserve textile elastane integrity.</li>
              <li>For metallic magnetic badges: wipe with microfiber cloth; avoid submerged water baths.</li>
            </ul>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

