"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";

interface Story {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  accentBg: string;
}

const STORIES: Story[] = [
  {
    slug: "vector-proofs-300-dpi-guide",
    category: "Pre-Press & Proofing",
    title: "Why vector curves beat 300 DPI rasters every single time on metal badges",
    excerpt:
      "When edge-sharpness is measured in fractions of a millimeter, raster upscaling creates micro-fuzz. Here is how our vector auto-trace engine preserves crisp hairline typography.",
    readTime: "4 min read",
    date: "12 Oct 2026",
    accentBg: "bg-lilac/30",
  },
  {
    slug: "dtf-vs-screen-printing-bulk-apparel",
    category: "Apparel Engineering",
    title: "Direct-to-Film vs Silk Screen: The honest guide for runs between 25 and 500 pcs",
    excerpt:
      "Screen printing wins on ink density for single-colour bulk; DTF wins on multi-colour gradients and elastane stretch. We break down the cost curves and wash durability tests.",
    readTime: "6 min read",
    date: "28 Sep 2026",
    accentBg: "bg-spot-lime/30",
  },
  {
    slug: "magnetic-badge-engineering",
    category: "Materials Science",
    title: "Neodymium dual-magnet backing: zero pinholes, zero blazer fabric tear",
    excerpt:
      "Traditional safety pins ruin premium suiting fabrics. How triple-plated NdFeB magnets provide 2.8 kg pull strength while remaining lightweight on silk and linen blends.",
    readTime: "3 min read",
    date: "14 Sep 2026",
    accentBg: "bg-violet/15",
  },
  {
    slug: "corporate-swag-that-lasts",
    category: "Client Spotlights",
    title: "How Fintech & Zepto onboarded 1,200 team members with zero waste packaging",
    excerpt:
      "Moving away from throwaway plastic junk toward heavyweight 280 GSM fleece hoodies, dual-wall steel thermal flasks, and Smyth-sewn linen journals that people actually keep.",
    readTime: "5 min read",
    date: "02 Sep 2026",
    accentBg: "bg-paper",
  },
];

export function StoriesCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 1,
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative border-b-2 border-ink bg-paper py-20 px-4 md:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 border border-ink/20 bg-ink/5 px-3 py-1 text-xs font-mono font-medium text-ink uppercase tracking-wider mb-3">
              <BookOpen className="h-3.5 w-3.5 text-violet" />
              The Press Log
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Print craft & case studies
            </h2>
            <p className="mt-2 text-base text-ink/70 font-sans max-w-xl">
              Deep dives into ink formulations, textile wash-testing, and branding guides directly from our production floor.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <Link
              href="/blog"
              className="text-xs font-mono font-bold uppercase tracking-wider text-violet hover:underline mr-4"
            >
              View all dispatches →
            </Link>
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              aria-label="Previous story"
              className={`h-11 w-11 rounded-full border-2 border-ink flex items-center justify-center transition-all ${prevBtnEnabled
                  ? "bg-white text-ink shadow-[2px_2px_0_0_#15101F] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
                  : "bg-paper text-ink/30 border-ink/30 cursor-not-allowed"
                }`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              aria-label="Next story"
              className={`h-11 w-11 rounded-full border-2 border-ink flex items-center justify-center transition-all ${nextBtnEnabled
                  ? "bg-violet text-white shadow-[2px_2px_0_0_#15101F] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
                  : "bg-paper text-ink/30 border-ink/30 cursor-not-allowed"
                }`}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-6">
            {STORIES.map((story) => (
              <div
                key={story.slug}
                className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-6 min-w-0"
              >
                <article className="h-full border-2 border-ink bg-white flex flex-col justify-between shadow-[4px_4px_0_0_#15101F] transition-transform duration-200 hover:-translate-y-1">
                  {/* Card top banner with accent */}
                  <div className={`p-6 border-b-2 border-ink ${story.accentBg}`}>
                    <div className="flex items-center justify-between font-mono text-xs text-ink/75 mb-3">
                      <span className="uppercase font-bold tracking-wider text-violet">
                        {story.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {story.readTime}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-ink leading-snug line-clamp-2">
                      <Link
                        href={`/blog/${story.slug}`}
                        className="hover:text-violet transition-colors"
                      >
                        {story.title}
                      </Link>
                    </h3>
                  </div>

                  {/* Card body & excerpt */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <p className="text-sm font-sans text-ink/75 line-clamp-3 leading-relaxed mb-6">
                      {story.excerpt}
                    </p>

                    <div className="pt-4 border-t border-ink/10 flex items-center justify-between font-mono text-xs text-ink/60">
                      <span>{story.date}</span>
                      <Link
                        href={`/blog/${story.slug}`}
                        className="font-bold text-ink group-hover:text-violet flex items-center gap-1 hover:underline"
                      >
                        Read article →
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

