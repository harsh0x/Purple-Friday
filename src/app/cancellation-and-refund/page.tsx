import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Purple Friday",
  description: "Pre-press proof signoff guarantees, free reprint policies, and cancellation procedures for Indian custom orders.",
};

export default function CancellationAndRefundPage() {
  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
            Client Assurance
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-pf-ink mt-1">
            Cancellation & Reprint Policy
          </h1>
          <p className="font-mono text-xs text-pf-ink/60 mt-2">
            Last Updated: 1st October 2026 • 100% Quality Gate Guarantee
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <div className="border-2 border-pf-ink bg-white p-6 sm:p-10 shadow-[6px_6px_0_0_#15101F] space-y-8 font-sans text-sm text-pf-ink/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              1. 100% Pre-Print Proof Sign-Off Guarantee
            </h2>
            <p>
              We operate under a strict zero-surprise policy: <strong>no garment is stitched, badge pressed, or flask etched until you give explicit written approval</strong> of your 1:1 digital proof via WhatsApp or email. You may request unlimited artwork position and scale revisions prior to sign-off at zero additional charge.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              2. Free Reprint Policy (Color & Manufacturing Defect)
            </h2>
            <p>
              If your delivered merchandise arrives with:
            </p>
            <ul className="list-disc pl-5 font-mono text-xs space-y-1.5">
              <li>A perceptible color variance greater than ΔE 2.0 from the approved digital Pantone spec;</li>
              <li>Misaligned prints exceeding our ±1.0mm tolerance;</li>
              <li>Stitching defects, frayed hems, or broken magnetic backings;</li>
            </ul>
            <p>
              We will reprint the affected batch <strong>100% free of charge with priority overnight air dispatch</strong>, or issue a full pro-rata credit note within 48 hours. Simply notify us with photos within 7 days of delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              3. Cancellation Window
            </h2>
            <p>
              You may cancel your order for a 100% immediate refund at any time <strong>before you sign off on the pre-press digital proof</strong>. Once you approve the digital proof and your run enters the physical queue (fabric cutting, silkscreen burning, or plating), cancellations cannot be accepted as the custom materials cannot be repurposed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-pf-ink">
              4. Return of Custom Printed Goods
            </h2>
            <p>
              Because each piece is personalized with your organization&apos;s unique trademark, brand insignia, or employee name, custom products cannot be returned for buyer&apos;s remorse or post-event surplus.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
