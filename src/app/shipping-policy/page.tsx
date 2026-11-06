import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Purple Friday",
  description: "Pan-India dispatch timelines, courier partners, GST delivery compliance, and tracking for bulk custom merchandise.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
            Legal & Operational Policies
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-pf-ink mt-1">
            Shipping & Dispatch Policy
          </h1>
          <p className="font-mono text-xs text-pf-ink/60 mt-2">
            Last Updated: 1st October 2026 • Compliant with Indian Logistics Standards
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <div className="border-2 border-pf-ink bg-white p-6 sm:p-10 shadow-[6px_6px_0_0_#15101F] space-y-8 font-sans text-sm text-pf-ink/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              1. Pan-India Coverage & Courier Partners
            </h2>
            <p>
              Purple Friday ships custom merchandise across 28,000+ PIN codes in India. We partner exclusively with premium air-express logistics carriers: <strong>Bluedart Express, Delhivery Air, and DTDC Priority</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              2. Production & Dispatch Turnaround
            </h2>
            <p>
              Because every order is custom-manufactured to your exact specifications, our turnaround consists of two phases:
            </p>
            <ul className="list-disc pl-5 font-mono text-xs space-y-1.5">
              <li><strong>Pre-Press Proofing (Within 2 Hours):</strong> 1:1 digital proof prepared and dispatched for your signoff.</li>
              <li><strong>Production Window (24 to 48 Hours):</strong> Production begins immediately upon receipt of proof signoff.</li>
              <li><strong>Transit Timeline:</strong> 2 to 3 business days for Tier 1 Metros (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata); 3 to 5 business days for other regional hubs.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              3. Shipping Fees & Free Delivery Threshold
            </h2>
            <p>
              Orders with a merchandise subtotal of <strong>₹2,500 or more qualify for FREE pan-India delivery</strong>. For bulk orders under ₹2,500, a flat shipping charge of ₹150 applies at checkout.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              4. Packaging & Damage Protection
            </h2>
            <p>
              All apparel orders are individually poly-bagged inside moisture-proof kraft corrugated boxes. Metallic magnetic badges are housed in high-density EVA foam trays to prevent scratch abrasions during air transit.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              5. GST E-Way Bill & Compliance
            </h2>
            <p>
              In compliance with Indian taxation laws, all bulk consignments valued over ₹50,000 are accompanied by an automated GST E-Way Bill generated from the official portal. Official 18% GST tax invoices with input tax credit are provided digitally and in the shipping carton.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

