import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Purple Friday",
  description: "Data protection, client artwork confidentiality, non-disclosure, and encryption standards for Purple Friday India.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
            Data Governance & Security
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-pf-ink mt-1">
            Privacy Policy & Artwork Non-Disclosure
          </h1>
          <p className="font-mono text-xs text-pf-ink/60 mt-2">
            Compliant with the Digital Personal Data Protection Act (DPDPA), India
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <div className="border-2 border-pf-ink bg-white p-6 sm:p-10 shadow-[6px_6px_0_0_#15101F] space-y-8 font-sans text-sm text-pf-ink/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              1. Client Trademark & Artwork Confidentiality
            </h2>
            <p>
              We treat all customer vector files, logos, confidential event slogans, and brand guides with enterprise-grade non-disclosure. We will never sell, license, or publish your custom artwork to any third party. Production proofs are strictly retained on encrypted storage solely for re-order reprints.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              2. Information We Collect
            </h2>
            <p>
              When placing an order or requesting custom quotes, we collect:
            </p>
            <ul className="list-disc pl-5 font-mono text-xs space-y-1.5">
              <li>Contact details: Name, company designation, email, and WhatsApp phone number.</li>
              <li>Delivery details: Physical delivery address, PIN code, and recipient contact.</li>
              <li>Fiscal details: Company legal name, GSTIN, and billing address for 18% tax invoicing.</li>
              <li>Technical files: Scalable Vector Graphics (SVG), PDF proofs, or raster logo assets.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              3. Payment Security & Encryption
            </h2>
            <p>
              All transactions and cash collections are handled with strict accounting and security standards. Purple Friday does not store credit card numbers, CVVs, or bank account credentials on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              4. Contact Our Data Protection Officer
            </h2>
            <p>
              For artwork purge requests or privacy questions, contact our security officer at: <strong className="font-mono text-pf-violet">privacy@purplefriday.in</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

