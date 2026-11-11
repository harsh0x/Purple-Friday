"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductMockup } from "../mockup/ProductMockup";
import { CropCorners, RegistrationMark } from "../ui/decorative";
import { formatINR } from "@/lib/utils";
import { ProductCardData } from "./ProductCard";

export function PosterCard({ product }: { product: ProductCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply 3D tilt on desktop pointer devices
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 4-degree maximum tilt
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className="group relative h-[440px] sm:h-[480px] w-full border-2 border-ink bg-paper p-6 sm:p-7 rounded-sm shadow-stamp-lg flex flex-col justify-between overflow-hidden select-none"
    >
      <CropCorners offset={8} length={14} />

      {/* Top Registration Mark & Best Seller Pill */}
      <div className="flex items-center justify-between border-b border-ink/15 pb-3">
        <div className="flex items-center gap-1.5 text-violet">
          <RegistrationMark size={14} variant="violet" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Best Seller Series
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold uppercase text-ink bg-spot-lime px-2 py-0.5 rounded-full border border-ink/30">
          Save up to 45%
        </span>
      </div>

      {/* Center SVG Mockup Stage */}
      <Link href={`/product/${product.slug}`} className="block my-auto py-2">
        <div className="h-44 sm:h-52 w-full flex items-center justify-center p-3 bg-paper-pure rounded-xs border border-ink/10 transition-transform duration-300 group-hover:scale-105">
          <ProductMockup
            slug={product.slug}
            template={product.template}
            color={product.color}
            size="card"
            className="max-h-full max-w-full drop-shadow-md"
          />
        </div>
      </Link>

      {/* Bottom Bold Editorial Name & Stamp Action Button */}
      <div className="space-y-3 pt-3 border-t border-ink/15">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="heading-sub font-black text-ink tracking-tight line-clamp-1 group-hover:text-violet transition-colors">
              {product.shortName || product.name}
            </h3>
          </Link>
          <div className="flex items-baseline justify-between mt-1 font-mono">
            <span className="text-xs text-ink/70">Min. {product.minQty} pieces</span>
            <span className="text-base font-bold text-ink">
              From {formatINR(product.basePrice)}/pc
            </span>
          </div>
        </div>

        <Link href={`/product/${product.slug}`} className="block w-full">
          <button
            type="button"
            className="w-full min-h-[46px] rounded-sm bg-violet text-white font-mono text-xs font-bold uppercase tracking-wider shadow-stamp hover:shadow-stamp-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-active transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Order Now — Custom Proof</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}

