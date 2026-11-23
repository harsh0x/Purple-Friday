"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Logo } from "./Logo";
import { RegistrationMark, CropCorners } from "../ui/decorative";
import { toast } from "sonner";
import { FooterConfig } from "@/server/cms/schema";

export function Footer({ cmsFooter }: { cmsFooter?: FooterConfig } = {}) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pure Admin Layout: Never render storefront footer or floating "REVIEWS 4.9" tab on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        toast.success("Welcome to the Purple Friday Print Dispatch!", {
          description: "Exclusive volume discounts and prepress guides sent monthly.",
        });
        setEmail("");
      } else {
        toast.error("Could not subscribe. Please try again later.");
      }
    } catch {
      toast.error("Network issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer className="bg-ink text-paper relative overflow-hidden pt-16 pb-12 border-t-2 border-ink">
        {/* Paper Grain Overlay */}
        <div className="absolute inset-0 bg-ink-grain pointer-events-none opacity-60" />

        {/* Decorative Corner Registration Crosshairs */}
        <div className="absolute top-6 left-6 pointer-events-none opacity-20">
          <RegistrationMark size={32} variant="paper" />
        </div>
        <div className="absolute top-6 right-6 pointer-events-none opacity-20">
          <RegistrationMark size={32} variant="paper" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
          {/* Top Section: Brand Statement & Newsletter Subscription */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-paper/15 pb-12">
            <div className="lg:col-span-6 space-y-4">
              <Logo variant="light" />
              <p className="text-paper/70 font-sans text-sm sm:text-base max-w-lg leading-relaxed">
                {cmsFooter?.brandStatement ||
                  "Artisan custom printing atelier for Indian startups, institutions, and enterprises. Offset magnetic badges, 100% bio-washed combed cotton tees, hoodies, and corporate gifting sets with live 3D proofs."}
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-spot-lime">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Quality Guaranteed • Free Pan-India Air Courier on ₹2,500+</span>
              </div>
            </div>

            {/* Newsletter Form */}
            <div className="lg:col-span-6 border border-paper/20 bg-ink-900/60 p-6 rounded-sm relative">
              <CropCorners offset={6} length={8} />
              <h3 className="font-display font-bold text-lg text-paper">
                {cmsFooter?.newsletterTitle || "The Print Dispatch Newsletter"}
              </h3>
              <p className="text-xs font-sans text-paper/70 mt-1 mb-4">
                {cmsFooter?.newsletterSubtitle ||
                  "Prepress production guides, Pantone trend reports, and secret flash deals for corporate managers."}
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-sm bg-ink text-paper text-xs font-mono border border-paper/30 placeholder:text-paper/40 focus:outline-none focus:border-spot-lime"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-5 py-2 rounded-sm bg-spot-lime text-ink font-mono text-xs font-bold uppercase tracking-wide hover:bg-spot-lime-hover active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? "Joining..." : "Subscribe"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Middle Section: Navigation Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm font-sans">
            {/* Column 1: Help & Policies */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-spot-lime font-bold">
                Help & Support
              </h4>
              <ul className="space-y-2 text-paper/70">
                <li>
                  <Link href="/account" className="hover:text-paper transition-colors">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-paper transition-colors">
                    FAQ & Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-paper transition-colors">
                    Track Order Status
                  </Link>
                </li>
                <li>
                  <Link href="/cancellation-and-refund" className="hover:text-paper transition-colors">
                    Cancellation & Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="hover:text-paper transition-colors">
                    Shipping & Delivery Across India
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-paper transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-paper transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Best Sellers */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-spot-lime font-bold">
                Best Sellers
              </h4>
              <ul className="space-y-2 text-paper/70">
                <li>
                  <Link href="/product/round-gloss-badge-58mm" className="hover:text-paper transition-colors">
                    58mm Magnetic Badges
                  </Link>
                </li>
                <li>
                  <Link href="/product/classic-crewneck-tshirt" className="hover:text-paper transition-colors">
                    180 GSM Bio-Washed Tees
                  </Link>
                </li>
                <li>
                  <Link href="/product/heavyweight-oversized-tee" className="hover:text-paper transition-colors">
                    240 GSM Oversized Tees
                  </Link>
                </li>
                <li>
                  <Link href="/product/executive-pique-polo" className="hover:text-paper transition-colors">
                    230 GSM Piqué Polos
                  </Link>
                </li>
                <li>
                  <Link href="/product/classic-pullover-hoodie" className="hover:text-paper transition-colors">
                    320 GSM Fleece Hoodies
                  </Link>
                </li>
                <li>
                  <Link href="/product/structured-cotton-twill-cap" className="hover:text-paper transition-colors">
                    Structured 6-Panel Caps
                  </Link>
                </li>
                <li>
                  <Link href="/product/matte-insulated-steel-flask" className="hover:text-paper transition-colors">
                    Insulated Steel Flasks (750ml)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company & Tools */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-spot-lime font-bold">
                Company & Atelier
              </h4>
              <ul className="space-y-2 text-paper/70">
                <li>
                  <Link href="/about" className="hover:text-paper transition-colors">
                    About Purple Friday
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="hover:text-paper transition-colors">
                    Client Wall of Love (4.9★)
                  </Link>
                </li>
                <li>
                  <Link href="/styleguide" className="hover:text-paper transition-colors">
                    Component Styleguide
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-paper transition-colors">
                    Prepress Blog & Insights
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-paper transition-colors">
                    Request Custom Enterprise Quote
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & WhatsApp */}
            <div className="space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-wider text-spot-lime font-bold">
                Print Atelier India
              </h4>
              <div className="text-paper/70 text-xs font-mono space-y-1.5">
                <p className="font-bold text-paper">Purple Friday Private Limited</p>
                <p>{cmsFooter?.officeAddress || "144/B, 4th Cross, Koramangala 4th Block, Bengaluru, Karnataka 560034"}</p>
                <p className="pt-1">GSTIN: 29AAACP9876P1ZV</p>
                <p>Phone: {cmsFooter?.contactPhone || "+91 80 4718 2000"}</p>
                <p>Email: {cmsFooter?.contactEmail || "orders@purplefriday.in"}</p>
              </div>

              {/* Chat on WhatsApp CTA */}
              <a
                href={`https://wa.me/${(cmsFooter?.whatsappNumber || "919876543210").replace(/[^0-9]/g, "")}?text=Hi%20Purple%20Friday%20Team%2C%20I%20would%20like%20a%20quote%20for%20bulk%20custom%20merchandise.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#25D366] text-white font-mono text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all shadow-stamp-sm"
              >
                <MessageSquare className="h-4 w-4 fill-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Bottom Legal & Rupee Notice */}
          <div className="border-t border-paper/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-paper/50">
            <p>
              {cmsFooter?.copyrightText ||
                `© ${new Date().getFullYear()} Purple Friday Private Limited. Built for India with Rupee billing.`}
            </p>
            <div className="flex items-center gap-4">
              <span>All prices include GST where applicable</span>
              <span>•</span>
              <span>100% Secure Payments</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Reviews Edge Tab on Right */}
      <Link
        href="/reviews"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-ink text-paper border-l-2 border-y-2 border-spot-lime shadow-stamp-sm px-2 py-3 rounded-l-md flex flex-col items-center gap-1.5 hover:bg-violet transition-colors group"
        aria-label="View verified client reviews"
      >
        <Star className="h-3.5 w-3.5 fill-spot-lime stroke-spot-lime group-hover:fill-white group-hover:stroke-white" />
        <span className="[writing-mode:vertical-lr] text-[10px] font-mono uppercase font-bold tracking-widest text-spot-lime group-hover:text-white">
          Reviews 4.9★
        </span>
      </Link>
    </>
  );
}

