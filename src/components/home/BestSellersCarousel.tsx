"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterCard } from "../product/PosterCard";
import { ProductCardData } from "../product/ProductCard";
import { SectionHeading } from "../ui/section-heading";

export function BestSellersCarousel({ products }: { products: ProductCardData[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
    setScrollProgress(progress * 100);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll();
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);

    // Keyboard support
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") emblaApi.scrollPrev();
      if (e.key === "ArrowRight") emblaApi.scrollNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <SectionHeading
          eyebrow="Proven Favorites"
          title="Best Selling Merchandise"
          description="High-demand staples built with Japanese Tajima embroidery and neodymium magnetic fasteners."
          className="mb-0"
        />

        {/* Arrow Navigation Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="p-3 rounded-full border border-ink bg-paper hover:bg-ink hover:text-paper shadow-stamp-sm hover:shadow-stamp transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous best sellers"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="p-3 rounded-full border border-ink bg-paper hover:bg-ink hover:text-paper shadow-stamp-sm hover:shadow-stamp transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next best sellers"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Embla Carousel Viewport */}
      <div className="overflow-hidden cursor-grab active:cursor-grabbing p-1" ref={emblaRef}>
        <div className="flex -ml-4 sm:-ml-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_88%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 sm:pl-6 min-w-0"
            >
              <PosterCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-1.5 flex-1 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
          <div
            className="h-full bg-violet transition-all duration-200"
            style={{ width: `${Math.max(10, scrollProgress)}%` }}
          />
        </div>
        <span className="font-mono text-xs text-ink/60 shrink-0">
          Drag or use ← → arrow keys
        </span>
      </div>
    </section>
  );
}
