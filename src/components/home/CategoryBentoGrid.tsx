"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "../ui/section-heading";
import { ProductMockup } from "../mockup/ProductMockup";
import { CropCorners } from "../ui/decorative";

export function CategoryBentoGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8">
      <SectionHeading
        eyebrow="Print Catalog"
        title="Explore by Print Department"
        description="Asymmetric production ateliers specializing in magnetic metals, combed cottons, and executive leather."
      />

      {/* Asymmetric Bento Grid (12-column layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Tile 1: Magnetic Badges (Col-span 7, Large Feature) */}
        <Link
          href="/category/magnetic-badges"
          className="md:col-span-7 p-6 sm:p-8 border-2 border-ink bg-paper-pure rounded-sm hover:shadow-stamp-lg transition-all relative flex flex-col justify-between group overflow-hidden"
        >
          <CropCorners offset={8} length={14} />
          <div className="flex items-start justify-between z-10">
            <div>
              <span className="font-mono text-xs uppercase font-bold text-violet bg-lilac/50 px-2.5 py-1 rounded-full border border-ink/20 inline-block mb-3">
                Flagship Atelier
              </span>
              <h3 className="heading-sub font-black text-ink group-hover:text-violet transition-colors">
                Magnetic Lapel Badges
              </h3>
              <p className="text-xs sm:text-sm font-sans text-ink/70 max-w-sm mt-1">
                Dual N42 neodymium magnetic fasteners that never pierce suit blazers or silk garments. 58mm gloss, matte acrylic, and gold lapel pins.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-ink">From ₹42/pc</span>
          </div>

          <div className="h-56 sm:h-64 w-full flex items-center justify-center p-4 my-4">
            <ProductMockup
              slug="round-gloss-badge-58mm"
              template="badge"
              color="#FFFFFF"
              className="max-h-full max-w-full drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-bold text-ink border-t border-ink/15 pt-4 z-10">
            <span>Explore 4 Badge Variants</span>
            <span className="text-violet flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Configure in Studio <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {/* Tile 2: Custom T-Shirts (Col-span 5, Tall Feature) */}
        <Link
          href="/category/t-shirts"
          className="md:col-span-5 p-6 sm:p-8 border-2 border-ink bg-paper-pure rounded-sm hover:shadow-stamp-lg transition-all relative flex flex-col justify-between group overflow-hidden"
        >
          <CropCorners offset={8} length={14} />
          <div className="z-10">
            <span className="font-mono text-xs uppercase font-bold text-ink bg-spot-lime px-2.5 py-1 rounded-full border border-ink/30 inline-block mb-3">
              100% Bio-Washed
            </span>
            <h3 className="heading-sub font-black text-ink group-hover:text-violet transition-colors">
              Custom T-Shirts
            </h3>
            <p className="text-xs sm:text-sm font-sans text-ink/70 mt-1">
              180 to 240 GSM combed cotton tees with direct-to-garment and spot Pantone screen printing.
            </p>
          </div>

          <div className="h-48 sm:h-56 w-full flex items-center justify-center p-3 my-2">
            <ProductMockup
              slug="classic-crewneck-tshirt"
              template="tee"
              color="#FFFFFF"
              className="max-h-full max-w-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-bold text-ink border-t border-ink/15 pt-4 z-10">
            <span>From ₹165/pc</span>
            <span className="text-violet flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Colors <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {/* Tile 3: Hoodies & Sweatshirts (Col-span 4) */}
        <Link
          href="/category/hoodies"
          className="md:col-span-4 p-6 border-2 border-ink bg-paper-pure rounded-sm hover:shadow-stamp transition-all relative flex flex-col justify-between group overflow-hidden"
        >
          <CropCorners offset={6} length={10} />
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-violet">320 GSM Brushed Fleece</span>
            <h3 className="font-display font-extrabold text-xl text-ink group-hover:text-violet mt-1">
              Hoodies & Sweatshirts
            </h3>
            <p className="text-xs font-sans text-ink/70 mt-1">
              Heavyweight kangaroo pocket hoodies and brass-zipper jackets.
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center p-2 my-2">
            <ProductMockup
              slug="classic-pullover-hoodie"
              template="hoodie"
              color="#FFFFFF"
              className="max-h-full max-w-full drop-shadow-sm transition-transform group-hover:scale-105"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-bold text-ink border-t border-ink/15 pt-3">
            <span>From ₹495/pc</span>
            <span className="text-violet">Order →</span>
          </div>
        </Link>

        {/* Tile 4: Caps & Headwear (Col-span 4) */}
        <Link
          href="/category/caps"
          className="md:col-span-4 p-6 border-2 border-ink bg-paper-pure rounded-sm hover:shadow-stamp transition-all relative flex flex-col justify-between group overflow-hidden"
        >
          <CropCorners offset={6} length={10} />
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-violet">3D Puff Embroidery</span>
            <h3 className="font-display font-extrabold text-xl text-ink group-hover:text-violet mt-1">
              Caps & Headwear
            </h3>
            <p className="text-xs font-sans text-ink/70 mt-1">
              6-panel structured cotton twill caps and breathable mesh truckers.
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center p-2 my-2">
            <ProductMockup
              slug="structured-cotton-twill-cap"
              template="cap"
              color="#FFFFFF"
              className="max-h-full max-w-full drop-shadow-sm transition-transform group-hover:scale-105"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-bold text-ink border-t border-ink/15 pt-3">
            <span>From ₹150/pc</span>
            <span className="text-violet">Order →</span>
          </div>
        </Link>

        {/* Tile 5: Corporate Gifts & Kits (Col-span 4) */}
        <Link
          href="/category/corporate-gifts"
          className="md:col-span-4 p-6 border-2 border-ink bg-paper-pure rounded-sm hover:shadow-stamp transition-all relative flex flex-col justify-between group overflow-hidden"
        >
          <CropCorners offset={6} length={10} />
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-violet">Executive Gifting</span>
            <h3 className="font-display font-extrabold text-xl text-ink group-hover:text-violet mt-1">
              Corporate Gifts & Kits
            </h3>
            <p className="text-xs font-sans text-ink/70 mt-1">
              Laser brass pens, debossed journals, and insulated flasks.
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center p-2 my-2">
            <ProductMockup
              slug="matte-insulated-steel-flask"
              template="bottle"
              color="#FFFFFF"
              className="max-h-full max-w-full drop-shadow-sm transition-transform group-hover:scale-105"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-bold text-ink border-t border-ink/15 pt-3">
            <span>From ₹110/pc</span>
            <span className="text-violet">Order →</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
