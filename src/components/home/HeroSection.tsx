"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, ArrowRight, Eye, RefreshCw, Sparkles, Shield, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationMark, CropCorners, HalftoneBackground } from "@/components/ui/decorative";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { useCustomerLogo } from "@/hooks/useCustomerLogo";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_PRODUCTS = [
  { name: "Magnetic Badges", price: 42, slug: "round-gloss-badge-58mm" },
  { name: "Bio-Washed Tees", price: 165, slug: "classic-crewneck-tshirt" },
  { name: "Piqué Polos", price: 265, slug: "executive-pique-polo" },
  { name: "Fleece Hoodies", price: 495, slug: "classic-pullover-hoodie" },
  { name: "Twill Caps", price: 150, slug: "structured-cotton-twill-cap" },
  { name: "Steel Bottles", price: 295, slug: "matte-insulated-steel-flask" },
];

const PREVIEW_TEMPLATES = [
  { id: "badge", name: "Magnetic Badge", slug: "round-gloss-badge-58mm", template: "badge", color: "#FFFFFF" },
  { id: "tee", name: "Crewneck Tee", slug: "classic-crewneck-tshirt", template: "tee", color: "#FFFFFF" },
  { id: "polo", name: "Piqué Polo", slug: "executive-pique-polo", template: "polo", color: "#FFFFFF" },
  { id: "cap", name: "Twill Cap", slug: "structured-cotton-twill-cap", template: "cap", color: "#FFFFFF" },
  { id: "bottle", name: "Steel Flask", slug: "matte-insulated-steel-flask", template: "bottle", color: "#FFFFFF" },
  { id: "notebook", name: "A5 Journal", slug: "hardbound-leather-journal-a5", template: "notebook", color: "#FFFFFF" },
];

export function HeroSection({
  cmsHero,
}: {
  cmsHero?: {
    badgeText?: string;
    headline?: string;
    subtext?: string;
    primaryButtonText?: string;
    primaryButtonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
  };
} = {}) {
  const { logoUrl, setLogoUrl } = useCustomerLogo();
  const [showLogo, setShowLogo] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    // Client-side validation: max 5 MB and valid image types
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PNG, JPG, WebP, or SVG logo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Please upload an image under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoUrl(dataUrl);
      setShowLogo(true);
      toast.success("Logo calibrated! Viewing live 3D print projection.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="relative pt-10 md:pt-16 pb-12 border-b border-ink/20 bg-paper overflow-hidden">
      <HalftoneBackground variant="subtle" />

      {/* Decorative Framing Crop Marks */}
      <div className="absolute top-4 left-4 pointer-events-none opacity-40">
        <RegistrationMark size={28} variant="ink" />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none opacity-40">
        <RegistrationMark size={28} variant="ink" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Editorial Headline & Trust Badges */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Trust Chips */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-pure border border-ink/20 text-ink">
                <Shield className="h-3.5 w-3.5 text-violet" />
                <span>Approve before we print</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-pure border border-ink/20 text-ink">
                <Clock className="h-3.5 w-3.5 text-violet" />
                <span>Dispatch in 24–48 hours</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-pure border border-ink/20 text-ink">
                <MapPin className="h-3.5 w-3.5 text-violet" />
                <span>Pan-India courier</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="heading-hero font-extrabold text-ink tracking-tight">
              {cmsHero?.headline || (
                <>
                  Print Your Brand on Products That People <span className="text-violet">Actually Keep</span>.
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-ink/70 font-sans max-w-xl leading-relaxed">
              {cmsHero?.subtext || (
                <>
                  Industrial print shop for Indian startups, college fests, and enterprises.
                  Drop your logo to see it live across 6 merchandise categories in 10 seconds.
                </>
              )}
            </p>

            {/* Two CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[50px] px-6 py-3 rounded-sm bg-violet text-white font-mono text-sm font-bold uppercase shadow-stamp hover:shadow-stamp-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-active transition-all flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{cmsHero?.primaryButtonText || "See My Logo on Products"}</span>
              </button>

              <Link href={cmsHero?.secondaryButtonUrl || "/about"}>
                <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {cmsHero?.secondaryButtonText || "Watch the Factory Tour"}
                </Button>
              </Link>
            </div>

            {/* Three Numbered Steps */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-ink/15 text-xs font-mono">
              <div className="space-y-1">
                <span className="font-bold text-violet text-sm">01.</span>
                <p className="font-bold text-ink">Upload Logo</p>
                <p className="text-[11px] text-ink/60">Vector or PNG file</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-violet text-sm">02.</span>
                <p className="font-bold text-ink">Auto Design</p>
                <p className="text-[11px] text-ink/60">Instant 3D projection</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-violet text-sm">03.</span>
                <p className="font-bold text-ink">Preview & Order</p>
                <p className="text-[11px] text-ink/60">Proof sign-off before print</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live 10-Second Preview Panel */}
          <div className="lg:col-span-6">
            <div className="p-5 sm:p-6 border-2 border-ink bg-paper-pure rounded-sm shadow-stamp relative">
              <CropCorners offset={6} length={12} />

              {/* Panel Top Bar: Drop Zone Header & Before/After Toggle */}
              <div className="flex items-center justify-between border-b border-ink/15 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <RegistrationMark size={16} variant="violet" />
                  <span className="font-mono text-xs uppercase font-bold text-ink">
                    10-Second Live Logo Preview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowLogo(!showLogo)}
                      className="px-2.5 py-1 rounded-sm border border-ink/30 text-[11px] font-mono uppercase font-bold text-ink hover:bg-ink/5 flex items-center gap-1"
                      title="Toggle before/after mockup logo"
                    >
                      <Eye className="h-3 w-3" />
                      <span>{showLogo ? "Hide Logo" : "Show Logo"}</span>
                    </button>
                  )}
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="p-1 text-ink/40 hover:text-red-600 transition-colors"
                      title="Remove current logo"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive File Drop Zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-sm text-center cursor-pointer transition-colors mb-4 ${isDragging
                    ? "border-violet bg-violet/5"
                    : "border-ink/30 bg-paper hover:border-violet"
                  }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-ink">
                  <UploadCloud className="h-4 w-4 text-violet" />
                  <span className="font-bold">
                    {logoUrl ? "Click or drop a different logo" : "Drop your brand logo here (PNG, JPG, SVG up to 5MB)"}
                  </span>
                </div>
              </div>

              {/* 6 Plain Product Mockups Mini-Grid */}
              <div className="grid grid-cols-3 gap-3">
                {PREVIEW_TEMPLATES.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 border border-ink/20 bg-paper rounded-xs flex flex-col items-center justify-between text-center relative group"
                  >
                    <div className="h-20 w-full flex items-center justify-center p-1">
                      <ProductMockup
                        slug={item.slug}
                        template={item.template}
                        color={item.color}
                        logoUrl={showLogo ? logoUrl : null}
                        className="max-h-full max-w-full drop-shadow-xs transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span className="font-mono text-[10px] text-ink/70 uppercase truncate w-full mt-1">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Success Badge */}
              <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs font-mono text-ink/80">
                <span className="flex items-center gap-1.5 text-spot-lime-dark font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Clipped to vector print zone</span>
                </span>
                <span className="text-[11px] text-ink/60">Carried to customizer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Below-Fold Quick Links Strip */}
        <div className="mt-12 pt-6 border-t border-ink/15">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="font-mono text-xs uppercase font-bold text-ink/50 shrink-0 mr-2">
              Quick Price Lookups:
            </span>
            {QUICK_PRODUCTS.map((prod) => (
              <Link
                key={prod.slug}
                href={`/product/${prod.slug}`}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-pure border border-ink/20 hover:border-ink hover:shadow-stamp-sm text-xs font-mono text-ink transition-all"
              >
                <span className="font-bold">{prod.name}</span>
                <span className="text-violet">From {formatINR(prod.price)}/pc</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

