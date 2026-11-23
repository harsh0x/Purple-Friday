"use client";

import React from "react";
import Link from "next/link";
import { ProductMockup } from "../mockup/ProductMockup";
import { CropCorners } from "../ui/decorative";
import { ArrowRight, Sparkles } from "lucide-react";

export interface NavCategoryItem {
  name: string;
  slug: string;
  href: string;
  description: string;
  products: Array<{
    name: string;
    slug: string;
    price: string;
    template: string;
    color?: string;
  }>;
}

export const NAV_CATEGORIES: NavCategoryItem[] = [
  {
    name: "Badges",
    slug: "magnetic-badges",
    href: "/category/magnetic-badges",
    description: "Dual-neodymium magnetic fastener lapel pins and conference badges. Zero clothing damage.",
    products: [
      { name: "58mm Round Gloss Badge", slug: "round-gloss-badge-58mm", price: "From ₹42", template: "badge", color: "#F5F0E8" },
      { name: "Executive Rectangle Name Badge", slug: "matte-rectangle-name-badge", price: "From ₹95", template: "badge", color: "#DDD4E6" },
      { name: "Die-Cast Enamel Lapel Pin", slug: "metallic-gold-lapel-badge", price: "From ₹120", template: "badge", color: "#6A2CFF" },
    ],
  },
  {
    name: "T-Shirts",
    slug: "t-shirts",
    href: "/category/t-shirts",
    description: "100% bio-washed super-combed cotton t-shirts. 180 to 240 GSM for startup teams and marathons.",
    products: [
      { name: "Classic 180 GSM Crewneck", slug: "classic-crewneck-tshirt", price: "From ₹165", template: "tee", color: "#15101F" },
      { name: "240 GSM Heavyweight Oversized", slug: "heavyweight-oversized-tee", price: "From ₹310", template: "tee", color: "#6A2CFF" },
      { name: "Athletic Quick-Dry Poly Tee", slug: "sports-performance-tee", price: "From ₹130", template: "tee", color: "#D8FF3F" },
    ],
  },
  {
    name: "Hoodies",
    slug: "hoodies",
    href: "/category/hoodies",
    description: "320 GSM brushed heavy fleece hoodies and crewneck sweatshirts with Japanese Tajima embroidery.",
    products: [
      { name: "320 GSM Pullover Kangaroo Hoodie", slug: "classic-pullover-hoodie", price: "From ₹495", template: "hoodie", color: "#15101F" },
      { name: "Full-Zip Executive Fleece Jacket", slug: "metal-zipper-fleece-jacket", price: "From ₹720", template: "hoodie", color: "#221A31" },
      { name: "Minimalist Crewneck Sweatshirt", slug: "minimalist-crewneck-sweatshirt", price: "From ₹450", template: "hoodie", color: "#CDB8FF" },
    ],
  },
  {
    name: "Caps",
    slug: "caps",
    href: "/category/caps",
    description: "Structured 6-panel twill caps and breathable mesh truckers with 3D high-density puff embroidery.",
    products: [
      { name: "Structured 6-Panel Twill Cap", slug: "structured-cotton-twill-cap", price: "From ₹150", template: "cap", color: "#15101F" },
      { name: "Retro Mesh Trucker Snapback", slug: "trucker-mesh-snapback-cap", price: "From ₹120", template: "cap", color: "#6A2CFF" },
      { name: "Vintage Washed Dad Hat", slug: "unstructured-dad-hat", price: "From ₹140", template: "cap", color: "#816F98" },
    ],
  },
  {
    name: "Corporate Gifts",
    slug: "corporate-gifts",
    href: "/category/corporate-gifts",
    description: "Laser-etched twist brass pens, debossed leather journals, insulated flasks, and steel keychains.",
    products: [
      { name: "Brass Twist Executive Pen", slug: "executive-brass-twist-pen", price: "From ₹110", template: "pen", color: "#15101F" },
      { name: "A5 Hardbound Debossed Journal", slug: "hardbound-leather-journal-a5", price: "From ₹195", template: "notebook", color: "#15101F" },
      { name: "750ml Matte Insulated Steel Flask", slug: "matte-insulated-steel-flask", price: "From ₹295", template: "bottle", color: "#221A31" },
    ],
  },
];

interface MegaMenuPanelProps {
  category: NavCategoryItem;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

  export function MegaMenuPanel({
    category,
    onClose,
    onMouseEnter,
    onMouseLeave,
  }: MegaMenuPanelProps) {
    return (
      <div
        className="absolute top-full left-0 w-full bg-paper border-b-2 border-ink shadow-stamp-lg animate-in fade-in-0 slide-in-from-top-1 duration-200 z-50"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave || onClose}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column: Category Summary */}
            <div className="col-span-4 border-r border-ink/20 pr-8 space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-violet font-bold block">
                Prepress Department
              </span>
              <h3 className="font-display font-extrabold text-2xl text-ink">
                {category.name}
              </h3>
              <p className="text-sm font-sans text-ink/70 leading-relaxed">
                {category.description}
              </p>
              <div className="pt-2">
                <Link
                  href={category.href}
                  onClick={() => {
                    setTimeout(() => onClose(), 50);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-ink hover:text-violet transition-colors group"
                >
                  <span>View Full Catalogue</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Columns: 3 Product Cards with SVG Vector Mockups */}
            <div className="col-span-8 grid grid-cols-3 gap-6">
              {category.products.map((item) => (
                <Link
                  key={item.slug}
                  href={`/product/${item.slug}`}
                  onClick={() => {
                    setTimeout(() => onClose(), 50);
                  }}
                  className="group p-4 border border-ink/30 bg-paper-pure rounded-sm hover:border-ink hover:shadow-card transition-all relative block"
                >
                  <CropCorners offset={4} length={6} />
                  {/* Product SVG Mockup Thumbnail */}
                  <div className="h-32 w-full flex items-center justify-center p-2 mb-3 bg-paper rounded-xs overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    <ProductMockup
                      slug={item.slug}
                      template={item.template}
                      color={item.color}
                      className="max-h-full max-w-full drop-shadow-sm"
                    />
                  </div>
                  <p className="font-display font-bold text-sm text-ink truncate group-hover:text-violet transition-colors">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-xs font-mono">
                    <span className="font-bold text-ink">{item.price}</span>
                    <span className="text-[10px] text-violet flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="h-3 w-3" /> Customize
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

