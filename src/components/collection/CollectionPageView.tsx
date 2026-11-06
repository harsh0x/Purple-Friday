"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import * as Slider from "@radix-ui/react-slider";
import * as Dialog from "@radix-ui/react-dialog";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
} from "lucide-react";
import { ProductCard, ProductCardData } from "@/components/product/ProductCard";
import { formatINR } from "@/lib/utils";

interface CollectionPageViewProps {
  title: string;
  description: string;
  categorySlug: string;
  initialProducts: ProductCardData[];
  initialCursor: string | null;
  initialCounts: {
    all: number;
    team: number;
    gifting: number;
  };
}

const COLOR_OPTIONS = [
  { label: "All", value: "all", hex: "#FFFFFF" },
  { label: "Black", value: "black", hex: "#15101F" },
  { label: "White", value: "white", hex: "#F5F0E8" },
  { label: "Violet", value: "violet", hex: "#6A2CFF" },
  { label: "Navy", value: "navy", hex: "#1B2A4A" },
  { label: "Grey", value: "grey", hex: "#A8A2B0" },
  { label: "Olive", value: "olive", hex: "#484E3A" },
];

const MOQ_OPTIONS = [
  { label: "Any", value: "" },
  { label: "≤ 5 pcs", value: "5" },
  { label: "≤ 10 pcs", value: "10" },
  { label: "≤ 15 pcs", value: "15" },
  { label: "≤ 25 pcs", value: "25" },
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popularity" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest Additions", value: "newest" },
];

export function CollectionPageView({
  title,
  description,
  categorySlug,
  initialProducts,
  initialCursor,
  initialCounts,
}: CollectionPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const audience = searchParams.get("audience") || "all";
  const sort = searchParams.get("sort") || "popularity";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 50;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 1000;
  const moq = searchParams.get("moq") || "";
  const color = searchParams.get("color") || "all";

  // Products state & pagination
  const [products, setProducts] = useState<ProductCardData[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [counts, setCounts] = useState(initialCounts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Price slider local state for smooth sliding
  const [sliderPrice, setSliderPrice] = useState<number>(maxPrice);

  // Intersection observer sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Update URL helper
  const updateUrl = useCallback(
    (params: Record<string, string | number | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (val === null || val === "" || (key === "audience" && val === "all") || (key === "color" && val === "all")) {
          current.delete(key);
        } else {
          current.set(key, String(val));
        }
      });
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Refetch when search params change
  useEffect(() => {
    let ignore = false;
    async function fetchFiltered() {
      try {
        const query = new URLSearchParams();
        query.set("category", categorySlug);
        if (audience !== "all") query.set("audience", audience);
        if (sort !== "popularity") query.set("sort", sort);
        if (minPrice !== 50) query.set("minPrice", String(minPrice));
        if (maxPrice !== 1000) query.set("maxPrice", String(maxPrice));
        if (moq) query.set("moq", moq);
        if (color !== "all") query.set("color", color);
        query.set("limit", "12");

        const res = await fetch(`/api/collections?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) {
          setProducts(data.items);
          setNextCursor(data.nextCursor);
          setCounts(data.counts);
        }
      } catch {
        // silent error fallback
      }
    }
    fetchFiltered();
    return () => {
      ignore = true;
    };
  }, [categorySlug, audience, sort, minPrice, maxPrice, moq, color]);

  // Load more trigger
  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const query = new URLSearchParams();
      query.set("category", categorySlug);
      if (audience !== "all") query.set("audience", audience);
      if (sort !== "popularity") query.set("sort", sort);
      if (minPrice !== 50) query.set("minPrice", String(minPrice));
      if (maxPrice !== 1000) query.set("maxPrice", String(maxPrice));
      if (moq) query.set("moq", moq);
      if (color !== "all") query.set("color", color);
      query.set("cursor", nextCursor);
      query.set("limit", "12");

      const res = await fetch(`/api/collections?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, categorySlug, audience, sort, minPrice, maxPrice, moq, color]);

  // IntersectionObserver for infinite scroll "Load more"
  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && nextCursor) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingMore, handleLoadMore]);

  // Count active filters
  const activeFiltersCount =
    (color !== "all" ? 1 : 0) +
    (moq !== "" ? 1 : 0) +
    (maxPrice < 1000 ? 1 : 0);

  const clearAllFilters = () => {
    setSliderPrice(1000);
    router.replace(`?${audience !== "all" ? `audience=${audience}&` : ""}sort=${sort}`, {
      scroll: false,
    });
  };

  // Reusable Filter Sidebar Content
  const FilterContent = (
    <div className="space-y-7">
      <div className="flex items-center justify-between pb-3 border-b-2 border-pf-ink/10">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-pf-ink flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-pf-violet" />
          Filter Catalogue
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-mono font-bold text-pf-violet hover:underline flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Max Price Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-bold text-pf-ink uppercase">Max Base Price</span>
          <span className="text-pf-violet font-bold bg-pf-violet/10 px-2 py-0.5 border border-pf-violet/20">
            {formatINR(sliderPrice)}
          </span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[sliderPrice]}
          max={1000}
          min={50}
          step={25}
          onValueChange={([val]) => setSliderPrice(val)}
          onValueCommit={([val]) => updateUrl({ maxPrice: val })}
        >
          <Slider.Track className="bg-pf-ink/15 relative grow rounded-full h-[4px]">
            <Slider.Range className="absolute bg-pf-violet rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 border-pf-ink rounded-full shadow-[2px_2px_0_0_#15101F] hover:scale-110 focus:outline-none transition-transform"
            aria-label="Price filter"
          />
        </Slider.Root>
        <div className="flex justify-between text-[11px] font-mono text-pf-ink/50">
          <span>₹50</span>
          <span>₹1,000+</span>
        </div>
      </div>

      {/* Minimum Order Quantity (MOQ) */}
      <div className="space-y-2.5">
        <span className="block font-mono text-xs font-bold text-pf-ink uppercase">
          Minimum Order (MOQ)
        </span>
        <div className="flex flex-wrap gap-2">
          {MOQ_OPTIONS.map((opt) => {
            const isActive = moq === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => updateUrl({ moq: opt.value })}
                className={`font-mono text-xs px-3 py-1.5 border-2 transition-all ${
                  isActive
                    ? "border-pf-ink bg-pf-ink text-white shadow-[2px_2px_0_0_#6A2CFF]"
                    : "border-pf-ink/20 bg-white text-pf-ink hover:border-pf-ink"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colour Filter */}
      <div className="space-y-2.5">
        <span className="block font-mono text-xs font-bold text-pf-ink uppercase">
          Colorway Tone
        </span>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((col) => {
            const isSelected = color === col.value;
            return (
              <button
                key={col.value}
                onClick={() => updateUrl({ color: col.value })}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border-2 transition-all ${
                  isSelected
                    ? "border-pf-ink bg-pf-ink text-white shadow-[2px_2px_0_0_#6A2CFF]"
                    : "border-pf-ink/20 bg-white text-pf-ink hover:border-pf-ink"
                }`}
              >
                {col.value !== "all" && (
                  <span
                    className="h-3 w-3 rounded-full border border-pf-ink/30 shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                )}
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* 1. Header Block */}
      <div className="relative border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        {/* Registration Marks */}
        <span className="absolute top-3 left-4 font-mono text-[11px] text-pf-ink/30 select-none">
          + REG_COLLECTION // {categorySlug.toUpperCase()}
        </span>
        <span className="absolute top-3 right-4 font-mono text-[11px] text-pf-ink/30 select-none">
          PROOF_SCALE: 1:1 +
        </span>

        <div className="mx-auto max-w-7xl pt-2">
          <div className="inline-flex items-center gap-2 border border-pf-ink/20 bg-pf-lilac/30 px-3 py-1 text-xs font-mono font-bold text-pf-ink uppercase tracking-wider mb-4">
            <Sparkles className="h-3.5 w-3.5 text-pf-violet" />
            Active Collection
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-pf-ink tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-base text-pf-ink/75 font-sans max-w-2xl leading-relaxed">
                {description}
              </p>
            </div>

            <div className="shrink-0 font-mono text-xs text-pf-ink/60 bg-pf-paper border-2 border-pf-ink p-3 shadow-[3px_3px_0_0_#15101F]">
              <span className="block font-bold text-pf-ink text-sm">
                {products.length} {products.length === 1 ? "Product" : "Products"} Loaded
              </span>
              <span>Bulk Tier Discounts Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Radix Tabs Bar for Audience */}
      <div className="border-b-2 border-pf-ink bg-pf-paper sticky top-16 z-20 shadow-sm backdrop-blur-md bg-pf-paper/95">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Tabs.Root
            value={audience}
            onValueChange={(val) => updateUrl({ audience: val })}
            className="flex items-center justify-between overflow-x-auto no-scrollbar"
          >
            <Tabs.List className="flex items-center gap-2 py-3">
              <Tabs.Trigger
                value="all"
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                  audience === "all"
                    ? "border-pf-ink bg-pf-ink text-white shadow-[3px_3px_0_0_#6A2CFF]"
                    : "border-transparent bg-transparent text-pf-ink/70 hover:border-pf-ink/30"
                }`}
              >
                <span>All Merchandise</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px]">
                  {counts.all}
                </span>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="team"
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                  audience === "team"
                    ? "border-pf-ink bg-pf-ink text-white shadow-[3px_3px_0_0_#6A2CFF]"
                    : "border-transparent bg-transparent text-pf-ink/70 hover:border-pf-ink/30"
                }`}
              >
                <span>For Your Team</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px]">
                  {counts.team}
                </span>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="gifting"
                className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                  audience === "gifting"
                    ? "border-pf-ink bg-pf-ink text-white shadow-[3px_3px_0_0_#6A2CFF]"
                    : "border-transparent bg-transparent text-pf-ink/70 hover:border-pf-ink/30"
                }`}
              >
                <span>For Gifting</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px]">
                  {counts.gifting}
                </span>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Mobile Filter Sheet Trigger & Desktop Sort Dropdown */}
            <div className="flex items-center gap-3 shrink-0 py-2">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 border-2 border-pf-ink bg-white px-3.5 py-1.5 font-mono text-xs font-bold shadow-[2px_2px_0_0_#15101F]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-pf-violet" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-pf-violet text-white text-[10px] flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={sort}
                  onChange={(e) => updateUrl({ sort: e.target.value })}
                  aria-label="Sort products"
                  className="appearance-none border-2 border-pf-ink bg-white font-mono text-xs font-bold pl-3 pr-8 py-2 shadow-[2px_2px_0_0_#15101F] focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 pointer-events-none text-pf-ink" />
              </div>
            </div>
          </Tabs.Root>
        </div>
      </div>

      {/* 3. Main Workspace: Sidebar Filters + Products Grid */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 border-2 border-pf-ink bg-white p-6 shadow-[4px_4px_0_0_#15101F] sticky top-36">
            {FilterContent}
          </aside>

          {/* Product Grid Area (9 cols) */}
          <main className="lg:col-span-9">
            {products.length === 0 ? (
              /* Empty State */
              <div className="border-2 border-dashed border-pf-ink/30 bg-white p-12 text-center shadow-[4px_4px_0_0_#15101F]">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full border-2 border-pf-ink bg-pf-paper flex items-center justify-center text-pf-violet shadow-[2px_2px_0_0_#15101F]">
                  <Layers className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-pf-ink">
                  No matching specimens found
                </h3>
                <p className="mt-2 text-sm font-sans text-pf-ink/70 max-w-md mx-auto">
                  Try adjusting your price ceiling, minimum order requirements, or clearing active filters to see all available merchandise.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-6 border-2 border-pf-ink bg-pf-violet text-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 shadow-[3px_3px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#15101F] transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div>
                {/* 3-Column Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Loading Skeleton Rows for Pagination */}
                {isLoadingMore && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="border-2 border-pf-ink/20 bg-white p-4 space-y-4 animate-pulse"
                      >
                        <div className="aspect-square bg-pf-ink/10 rounded" />
                        <div className="h-4 bg-pf-ink/10 w-3/4 rounded" />
                        <div className="h-3 bg-pf-ink/5 w-1/2 rounded" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentinel for Infinite Scroll */}
                <div ref={sentinelRef} className="h-10 mt-6" />

                {/* Manual Fallback Load More button if observer doesn't fire */}
                {nextCursor && !isLoadingMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      className="border-2 border-pf-ink bg-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 shadow-[3px_3px_0_0_#15101F] hover:bg-pf-ink hover:text-white transition-all"
                    >
                      Load More Products ↓
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Sheet (Radix Dialog) */}
      <Dialog.Root open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-pf-ink/60 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl border-t-2 border-pf-ink bg-white p-6 shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between pb-4 border-b border-pf-ink/10 mb-6">
              <Dialog.Title className="font-display text-lg font-bold text-pf-ink">
                Filters & Refinements
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label="Close filters"
                  className="p-1 rounded-full border border-pf-ink hover:bg-pf-paper"
                >
                  <X className="h-5 w-5 text-pf-ink" />
                </button>
              </Dialog.Close>
            </div>

            {FilterContent}

            <div className="mt-8 pt-4 border-t border-pf-ink/10">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full border-2 border-pf-ink bg-pf-violet text-white font-mono text-sm font-bold py-3.5 shadow-[4px_4px_0_0_#15101F]"
              >
                Apply Filters ({products.length} Products)
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
