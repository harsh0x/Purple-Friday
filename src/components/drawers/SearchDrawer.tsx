"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Clock, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerBody } from "../ui/drawer";
import { useSearchDrawer } from "@/hooks/useSearchDrawer";
import { ProductMockup } from "../mockup/ProductMockup";
import { formatINR } from "@/lib/utils";

interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  mrp: number;
  basePrice: number;
  categoryName: string;
  template: string;
}

const POPULAR_SEARCHES = [
  "58mm Badge",
  "Oversized Tee",
  "Piqué Polo",
  "Insulated Bottle",
  "Fleece Hoodie",
  "Enamel Lapel Pin",
];

const BEST_SELLERS = [
  { slug: "round-gloss-badge-58mm", name: "58mm Round Gloss Magnetic Badge", price: 42, template: "badge" },
  { slug: "classic-crewneck-tshirt", name: "Classic 180 GSM Crewneck Tee", price: 165, template: "tee" },
  { slug: "structured-cotton-twill-cap", name: "Structured 6-Panel Twill Cap", price: 150, template: "cap" },
];

export function SearchDrawer() {
  const router = useRouter();
  const { isOpen, closeSearch } = useSearchDrawer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pf-recent-searches");
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch {
        // localStorage not available
      }
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pf-recent-searches", JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("pf-recent-searches");
      } catch {
        // Ignore
      }
    }
  };

  // Debounced search with AbortController
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(-1);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Focus input on drawer open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSearch();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        const selected = results[selectedIndex];
        saveRecentSearch(selected.name);
        closeSearch();
        router.push(`/product/${selected.slug}`);
      } else if (query.trim()) {
        saveRecentSearch(query);
      }
    }
  };

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-spot-lime text-ink font-bold px-0.5 rounded-xs">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeSearch()}>
      <DrawerContent side="right" className="w-full sm:max-w-lg">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-ink/20 flex items-center gap-3 bg-paper-pure">
          <Search className="h-5 w-5 text-ink/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search badges, tees, caps, bottles..."
            className="flex-1 bg-transparent text-ink placeholder:text-ink/40 text-base font-sans outline-none min-h-[44px]"
            aria-label="Search input"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-sm text-ink/60 hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={closeSearch}
            className="p-2 rounded-sm border border-ink/20 text-ink hover:bg-ink/10 text-xs font-mono uppercase"
          >
            Esc
          </button>
        </div>

        <DrawerBody className="p-6 space-y-8">
          {/* Active Search Results */}
          {query.trim().length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-ink/70">
                  {isLoading ? "Searching catalog..." : `${results.length} Products Found`}
                </span>
                <span className="font-mono text-[11px] text-ink/50">
                  Use ↑ ↓ to navigate, Enter to view
                </span>
              </div>

              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.slug}`}
                      onClick={() => {
                        saveRecentSearch(item.name);
                        closeSearch();
                      }}
                      className={`flex items-center justify-between p-3 rounded-sm border transition-all ${
                        selectedIndex === idx
                          ? "bg-violet text-white border-violet shadow-stamp-sm"
                          : "bg-paper-pure border-ink/20 hover:border-ink hover:bg-paper"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 p-1 bg-paper rounded-xs shrink-0 flex items-center justify-center">
                          <ProductMockup
                            template={item.template}
                            className="max-h-full max-w-full"
                          />
                        </div>
                        <div>
                          <p
                            className={`font-display font-bold text-sm truncate max-w-[220px] sm:max-w-xs ${
                              selectedIndex === idx ? "text-white" : "text-ink"
                            }`}
                          >
                            {highlightMatch(item.name, query)}
                          </p>
                          <p
                            className={`font-mono text-xs ${
                              selectedIndex === idx ? "text-white/80" : "text-ink/60"
                            }`}
                          >
                            From {formatINR(item.basePrice)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
                    </Link>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="p-8 text-center border border-dashed border-ink/30 rounded-sm">
                  <p className="font-display font-bold text-base text-ink">
                    No matching merchandise found
                  </p>
                  <p className="font-sans text-xs text-ink/60 mt-1">
                    Try searching for &quot;badge&quot;, &quot;cotton tee&quot;, &quot;cap&quot;, or &quot;bottle&quot;.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-ink/70 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[11px] font-mono text-ink/50 hover:text-red-600 underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1 text-xs font-mono bg-paper-pure border border-ink/20 hover:border-ink rounded-full text-ink"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase font-bold text-ink/70 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-violet" /> Popular Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 text-xs font-mono bg-paper-pure border border-ink/20 hover:border-violet hover:text-violet rounded-full text-ink font-medium transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Best Sellers Quick List */}
              <div className="space-y-3 pt-4 border-t border-ink/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-ink/70 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-spot-lime-dark" /> Top Trending Best Sellers
                  </span>
                  <Link
                    href="/category/best-sellers"
                    onClick={closeSearch}
                    className="text-xs font-mono text-violet hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-2">
                  {BEST_SELLERS.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/product/${item.slug}`}
                      onClick={closeSearch}
                      className="flex items-center justify-between p-2.5 rounded-sm bg-paper-pure border border-ink/20 hover:border-ink hover:shadow-stamp-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 p-1 bg-paper rounded-xs shrink-0 flex items-center justify-center">
                          <ProductMockup
                            template={item.template}
                            className="max-h-full max-w-full"
                          />
                        </div>
                        <div>
                          <p className="font-display font-bold text-xs text-ink">
                            {item.name}
                          </p>
                          <p className="font-mono text-[11px] text-ink/60">
                            From {formatINR(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-violet font-semibold">
                        Customize →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

