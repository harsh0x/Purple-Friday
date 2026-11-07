import React from "react";
import { Metadata } from "next";
import { BudgetPlanner } from "@/components/corporate/BudgetPlanner";
import { ShieldCheck, Truck, CheckCircle2, Award, Headphones, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Corporate Gifting Budget Planner | Purple Friday",
  description:
    "Simulate custom merchandise hampers and welcome kits for team onboarding, client VIPs, and conferences with live volume tier pricing and official PDF quotation generation.",
};

export default function CorporateGiftingPage() {
  const valueProps = [
    {
      title: "18% GST Input Credit",
      description: "Claim full B2B ITC with valid GSTIN and HSN codes provided on all commercial invoices.",
      icon: ShieldCheck,
    },
    {
      title: "Approve Before We Print",
      description: "Digital pre-press vector proof with Pantone simulation delivered within 24h. No print without sign-off.",
      icon: CheckCircle2,
    },
    {
      title: "Multi-City Direct Drops",
      description: "Individual direct-to-desk courier dispatch to employee homes across 19,000+ Indian pincodes.",
      icon: Truck,
    },
    {
      title: "Dedicated Account Director",
      description: "One-on-one pre-press coordination, fabric swatching, and Pantone 2X proofing for orders above 100 kits.",
      icon: Headphones,
    },
  ];

  return (
    <div className="min-h-screen bg-pf-paper py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Editorial Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pf-violet/10 border border-pf-violet/30 text-pf-violet text-xs font-mono uppercase font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Enterprise & B2B Solutions</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-pf-ink tracking-tight">
            Corporate Gifting & Welcome Kits Engineered for Teams That Ship
          </h1>

          <p className="text-sm sm:text-base font-sans text-pf-ink/70 leading-relaxed">
            Elevate day-one onboarding, celebrate milestones, and impress enterprise clients with artisan custom merchandise manufactured in-house in Bengaluru and Tirupur.
          </p>
        </div>

        {/* Value Props Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.title}
                className="bg-white p-5 rounded-2xl border-2 border-pf-ink shadow-sm space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-pf-violet/10 text-pf-violet flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-pf-ink">
                  {prop.title}
                </h3>
                <p className="text-xs font-mono text-pf-ink/60 leading-normal">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Interactive Budget Planner Component */}
        <BudgetPlanner />

        {/* Enterprise Studio Assistance Banner */}
        <div className="bg-[#15101F] text-white p-8 sm:p-12 rounded-3xl border-2 border-pf-ink shadow-[8px_8px_0_0_#6A2CFF] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono uppercase tracking-wider text-pf-lime font-bold">
              Custom Pantone & Multi-City Distribution
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
              Need 500+ Custom Kits or Bespoke Packaging?
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Our pre-press production directors provide custom fabric sourcing, Pantone-matched spot colors, and automated multi-city shipping integration.
            </p>
          </div>

          <Link
            href="/contact"
            className="px-6 py-3.5 bg-pf-lime text-pf-ink font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-[4px_4px_0_0_#FFFFFF] border-2 border-pf-ink hover:translate-x-0.5 hover:translate-y-0.5 transition-transform flex items-center gap-2 shrink-0"
          >
            <span>Talk to Enterprise Lead</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

