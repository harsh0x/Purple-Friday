"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, X, Sparkles, SlidersHorizontal } from "lucide-react";
import { ProductCard, ProductCardData } from "@/components/product/ProductCard";
import { SectionSkeleton } from "@/components/ui/skeleton";

const POPULAR_SUGGESTIONS = [
  "Magnetic Badges",
  "T-Shirts",
  "Polo Shirts",
  "Hoodies",
  "Caps",
  "Steel Flasks",
  "Linen Journals",
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(initialQuery);
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: ProductCardData[] = data.results.map((r: {
          id: string;
          slug: string;
          name: string;
          shortName: string;
          mrp: number;
          basePrice: number;
          categoryName: string;
          template: string;
        }) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          shortName: r.shortName,
          basePrice: r.basePrice,
          mrp: r.mrp,
          minQty: 5,
          qtyStep: 1,
          rating: 4.9,
          reviewCount: 38,
          template: r.template || r.slug,
          badges: ["Verified Proof"],
        }));
        setResults(mapped);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Sync to URL and trigger debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputVal !== initialQuery) {
        const nextParams = new URLSearchParams(searchParams.toString());
        if (inputVal.trim()) {
          nextParams.set("q", inputVal.trim());
        } else {
          nextParams.delete("q");
        }
        router.replace(`/search?${nextParams.toString()}`, { scroll: false });
      }
      performSearch(inputVal);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputVal, initialQuery, performSearch, router, searchParams]);

  // Initial load
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputVal(suggestion);
  };

  const handleClear = () => {
    setInputVal("");
    setResults([]);
    setHasSearched(false);
    router.replace("/search", { scroll: false });
  };

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* Header & Search Bar */}
      <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
            Live Print Specimen Finder
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-pf-ink">
            Search Our Workshop Catalogue
          </h1>
          <p className="text-sm font-sans text-pf-ink/75 max-w-lg mx-auto">
            Search across 24+ merchandise blanks, apparel weights, magnetic lapel fasteners, and corporate gift sets.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl mx-auto pt-4">
            <SearchIcon className="h-5 w-5 absolute left-4 top-1/2 mt-2 -translate-y-1/2 text-pf-ink/50" />
            <input
              type="text"
              placeholder="Search by keyword, blank type, or GSM weight..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full h-14 pl-12 pr-12 border-2 border-pf-ink bg-pf-paper font-mono text-sm sm:text-base font-bold text-pf-ink placeholder:text-pf-ink/40 shadow-[4px_4px_0_0_#15101F] focus:outline-none focus:ring-2 focus:ring-pf-violet"
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear query"
                className="absolute right-4 top-1/2 mt-2 -translate-y-1/2 h-8 w-8 rounded-full border border-pf-ink bg-white flex items-center justify-center hover:bg-pf-paper"
              >
                <X className="h-4 w-4 text-pf-ink" />
              </button>
            )}
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="font-mono text-xs text-pf-ink/60">Suggestions:</span>
            {POPULAR_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="border border-pf-ink/20 bg-white hover:border-pf-ink font-mono text-xs px-2.5 py-1 text-pf-ink transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10">
        {/* Results Header Status */}
        {hasSearched && (
          <div className="flex items-center justify-between pb-6 border-b border-pf-ink/10 mb-8">
            <div className="font-mono text-xs text-pf-ink">
              Showing <strong>{results.length}</strong> {results.length === 1 ? "specimen" : "specimens"} for &ldquo;{inputVal}&rdquo;
            </div>
            {isSearching && (
              <span className="font-mono text-xs text-pf-violet font-bold animate-pulse">
                Querying floor catalogue...
              </span>
            )}
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : hasSearched && !isSearching ? (
          /* Empty State */
          <div className="max-w-md mx-auto border-2 border-dashed border-pf-ink/30 bg-white p-10 text-center shadow-[4px_4px_0_0_#15101F]">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full border-2 border-pf-ink bg-pf-paper flex items-center justify-center text-pf-violet shadow-[2px_2px_0_0_#15101F]">
              <SlidersHorizontal className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-pf-ink">
              No matching merchandise found
            </h3>
            <p className="mt-2 text-xs font-sans text-pf-ink/70 leading-relaxed">
              We couldn&apos;t find any items matching &ldquo;{inputVal}&rdquo;. Try using broader terms like &ldquo;badge&rdquo;, &ldquo;polo&rdquo;, or &ldquo;hoodie&rdquo;.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {POPULAR_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="border-2 border-pf-ink bg-pf-paper font-mono text-xs font-bold px-3 py-1.5 hover:bg-pf-violet hover:text-white transition-colors"
                >
                  Search &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Initial Pre-Search State */
          <div className="max-w-lg mx-auto border-2 border-pf-ink bg-white p-8 text-center shadow-[4px_4px_0_0_#15101F]">
            <Sparkles className="h-8 w-8 text-pf-violet mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-pf-ink">
              Ready to find your product?
            </h3>
            <p className="mt-1 text-xs font-sans text-pf-ink/75">
              Type above or pick one of the suggestions to explore custom printing rates and volume tiers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SectionSkeleton height="h-[500px]" title="Loading search atelier..." />}>
      <SearchContent />
    </Suspense>
  );
}

