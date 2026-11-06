import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, ReceiptText, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationMark, CropCorners, HalftoneBackground } from "@/components/ui/decorative";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { getCachedProducts, getCachedCategories } from "@/lib/catalogue";
import { formatINR } from "@/lib/utils";

  export default async function HomePage() {
    const products = await getCachedProducts();
    const categories = await getCachedCategories();

    return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20 overflow-hidden">
            {/* 1. Hero Section */}
            <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 border-b border-ink/20 bg-paper overflow-hidden">
              <HalftoneBackground variant="subtle" />

              {/* Decorative Framing Crop Marks */}
              <div className="absolute top-6 left-6 pointer-events-none opacity-40">
                <RegistrationMark size={32} variant="ink" />
              </div>
              <div className="absolute top-6 right-6 pointer-events-none opacity-40">
                <RegistrationMark size={32} variant="ink" />
              </div>

              <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Column: Editorial Headline & Actions */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lilac/50 border border-ink/30 text-ink text-xs font-mono font-bold uppercase">
                    <RegistrationMark size={14} variant="violet" />
                    <span>Offset Print Atelier • Pan-India Courier</span>
                  </div>

                  <h1 className="heading-hero font-extrabold text-ink tracking-tight">
                    Custom Merch, <br />
                    <span className="text-violet">Press-Ready</span> Accuracy.
                  </h1>

                  <p className="text-base sm:text-lg text-ink/70 font-sans max-w-xl leading-relaxed">
                    Industrial custom printing for Indian tech startups, campus festivals, and corporate gifts.
                    Magnetic badges with zero pinholes, 100% bio-washed cotton apparel, and laser-etched executive kits.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <Link href="/category/best-sellers">
                      <Button variant="stamp" size="lg" leftIcon={<Sparkles className="h-4 w-4" />}>
                        Explore Best Sellers
                      </Button>
                    </Link>
                    <Link href="/category/magnetic-badges">
                      <Button variant="design-cta" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Studio Customizer
                      </Button>
                    </Link>
                  </div>

                  {/* Trust Points */}
                  <div className="grid grid-cols-3 gap-4 pt-8 border-t border-ink/15 text-xs font-mono text-ink/80">
                    <div className="space-y-1">
                      <span className="font-bold text-ink block text-sm">₹0 Proof Fee</span>
                      <span className="text-ink/60">3D proof approval before production</span>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-ink block text-sm">Tier Pricing</span>
                      <span className="text-ink/60">Save up to 45% on bulk runs</span>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-ink block text-sm">18% GST</span>
                      <span className="text-ink/60">Full B2B input tax credit</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive Vector Mockup Display */}
                <div className="lg:col-span-5 relative">
                  <div className="p-6 border-2 border-ink bg-paper-pure rounded-sm shadow-stamp relative">
                    <CropCorners offset={8} length={14} />
                    <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                      <span className="font-mono text-xs uppercase font-bold text-violet flex items-center gap-1.5">
                        <RegistrationMark size={14} variant="violet" />
                        Live SVG Studio Engine
                      </span>
                      <span className="font-mono text-[11px] text-ink/60 bg-paper px-2 py-0.5 rounded-xs border border-ink/20">
                        Vector Calibration
                      </span>
                    </div>

                    {/* Showcase Mockup Frame */}
                    <div className="aspect-[4/3] w-full flex items-center justify-center p-4 bg-paper rounded-xs overflow-hidden relative">
                      <ProductMockup
                        template="tee"
                        color="#15101F"
                        className="max-h-full max-w-full drop-shadow-md"
                      />
                    </div>

                    <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="font-bold text-ink">Classic Crewneck Tee</p>
                        <p className="text-ink/60">100% Bio-Washed 180 GSM</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-violet">From ₹165 / pc</p>
                        <p className="text-[10px] text-spot-lime-dark font-bold uppercase">Save 35% on 100+</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Free Proof Guarantee Strip */}
            <section className="max-w-7xl mx-auto px-6 w-full">
              <div className="p-6 sm:p-8 border border-ink bg-ink text-paper rounded-sm shadow-stamp flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-ink-grain pointer-events-none opacity-40" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 rounded-full bg-violet flex items-center justify-center text-white shrink-0 border border-white/20">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-paper">
                      The Purple Friday Prepress Proof Guarantee
                    </h3>
                    <p className="text-xs sm:text-sm font-sans text-paper/70 max-w-xl mt-0.5">
                      Never worry about misaligned logos or faded Pantone shades. We generate an interactive 3D digital proof for your explicit sign-off before raw garments or badges hit our print press.
                    </p>
                  </div>
                </div>
                <Link href="/about" className="relative z-10 shrink-0">
                  <Button variant="nudge">How Proofing Works →</Button>
                </Link>
              </div>
            </section>

            {/* 3. Shop by Category Grid */}
            <section className="max-w-7xl mx-auto px-6 w-full space-y-8">
              <SectionHeading
                eyebrow="Print Departments"
                title="Engineered for Every Corporate Occasion"
                description="Select a merchandise category to configure print specs, view quantity-wise discount tiers, and upload your vector artwork."
              />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((cat) => {
                    const template =
                      cat.slug.includes("badge")
                        ? "badge"
                        : cat.slug.includes("polo")
                          ? "polo"
                          : cat.slug.includes("hoodie")
                            ? "hoodie"
                            : cat.slug.includes("cap")
                              ? "cap"
                              : cat.slug.includes("gift")
                                ? "bottle"
                                : "tee";

                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className="group p-6 border border-ink bg-paper-pure rounded-sm hover:shadow-stamp transition-all relative flex flex-col justify-between"
                      >
                        <CropCorners offset={6} length={10} />
                        <div className="aspect-[16/10] w-full flex items-center justify-center p-4 bg-paper rounded-xs mb-4 overflow-hidden">
                          <ProductMockup
                            template={template}
                            className="max-h-full max-w-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-bold text-xl text-ink group-hover:text-violet transition-colors">
                              {cat.name}
                            </h3>
                            <span className="font-mono text-xs text-ink/60">
                              {cat._count?.products || 4} Items
                            </span>
                          </div>
                          <p className="text-xs font-sans text-ink/70 line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs font-mono font-bold text-violet">
                          <span>View Tier Prices</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
            </section>

            {/* 4. Best Selling Products Preview */}
            <section className="max-w-7xl mx-auto px-6 w-full space-y-8">
              <SectionHeading
                eyebrow="Flagship Catalogue"
                title="Most Ordered Custom Merchandise"
                description="High-volume favorites trusted by 500+ Indian corporate teams, conferences, and startup hackathons."
                action={
                  <Link href="/category/best-sellers">
                    <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      View All 24 Products
                    </Button>
                  </Link>
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 8).map((product) => {
                  const template = product.slug.split("-")[0] || "tee";

                  return (
                    <div
                      key={product.id}
                      className="p-4 border border-ink/30 bg-paper-pure rounded-sm hover:border-ink hover:shadow-stamp-sm transition-all flex flex-col justify-between relative group"
                    >
                      <CropCorners offset={4} length={8} />

                      <div>
                        {/* Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-spot-lime text-ink font-mono text-[10px] font-bold uppercase border border-ink/30">
                            {product.badges[0] || "Popular"}
                          </span>
                          <span className="font-mono text-[11px] text-ink/60">
                            Min {product.minQty} pcs
                          </span>
                        </div>

                        {/* SVG Mockup */}
                        <Link href={`/product/${product.slug}`} className="block">
                          <div className="aspect-square w-full flex items-center justify-center p-3 bg-paper rounded-xs mb-3 overflow-hidden">
                            <ProductMockup
                              template={template}
                              className="max-h-full max-w-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        </Link>

                        <Link href={`/product/${product.slug}`}>
                          <h4 className="font-display font-bold text-sm text-ink truncate hover:text-violet transition-colors">
                            {product.name}
                          </h4>
                        </Link>
                        <p className="text-xs font-mono text-ink/60 mt-0.5 truncate">
                          {product.printMethod}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-ink/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-ink/50 uppercase block">Starting at</span>
                          <span className="font-mono font-bold text-sm text-ink">
                            {formatINR(product.basePrice)}
                            <span className="text-xs text-ink/60 font-normal">/pc</span>
                          </span>
                        </div>
                        <Link href={`/product/${product.slug}`}>
                          <Button variant="stamp" size="sm">
                            Customize
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Production Infrastructure & Values */}
            <section className="max-w-7xl mx-auto px-6 w-full">
              <div className="p-8 md:p-12 border-2 border-ink bg-paper rounded-sm shadow-stamp relative overflow-hidden">
                <HalftoneBackground variant="violet" />
                <div className="max-w-3xl space-y-6 relative z-10">
                  <span className="font-mono text-xs uppercase tracking-widest text-violet font-bold flex items-center gap-1.5">
                    <RegistrationMark size={14} variant="violet" />
                    Built for Scale
                  </span>
                  <h2 className="heading-section font-extrabold text-ink">
                    The Production Standard for Indian Enterprise Merchandise
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="h-5 w-5 text-violet shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-ink">Neodymium Magnetic Clasps</h4>
                        <p className="text-xs font-sans text-ink/70 mt-1">Dual N42 magnets secure badges without puncturing blazers or uniforms.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Truck className="h-5 w-5 text-violet shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-ink">Free Express Air Courier</h4>
                        <p className="text-xs font-sans text-ink/70 mt-1">Free delivery across all India PIN codes on bulk orders over ₹2,500.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <ReceiptText className="h-5 w-5 text-violet shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-ink">18% GST B2B Invoices</h4>
                        <p className="text-xs font-sans text-ink/70 mt-1">Auto-generated invoices with your GSTIN for full monthly tax input credit.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Award className="h-5 w-5 text-violet shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-ink">Japanese Tajima Embroidery</h4>
                        <p className="text-xs font-sans text-ink/70 mt-1">High-density 3D puff embroidery that never frays or washes out.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          );
}
