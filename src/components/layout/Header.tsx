"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X, User } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_CATEGORIES, MegaMenuPanel, NavCategoryItem } from "./MegaMenu";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useSearchDrawer } from "@/hooks/useSearchDrawer";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<NavCategoryItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const { items: cartItems, openCart } = useCart();
  const { items: wishlistItems, openWishlist } = useWishlist();
  const { openSearch } = useSearchDrawer();

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.qty, 0);
  const wishlistCount = wishlistItems.length;

  // Bump animation trigger when cart count changes
  const [cartBump, setCartBump] = useState(false);
  useEffect(() => {
    if (totalCartCount > 0) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalCartCount]);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 120 && currentScrollY > lastScrollY.current + 5) {
        setIsVisible(false); // scrolling down
        setActiveCategory(null);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setIsVisible(true); // scrolling up
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full bg-paper/95 backdrop-blur-md border-b border-ink/20 transition-transform duration-300 ease-editorial",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* 1. Left: Mobile Hamburger & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-ink hover:text-violet transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              aria-label="Open mobile navigation"
            >
              <Menu className="h-6 w-6 stroke-[2]" />
            </button>
            <Logo />
          </div>

          {/* 2. Middle: Desktop Navigation Links with Mega-Menu Trigger */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {NAV_CATEGORIES.map((cat) => {
              const isActive = activeCategory?.slug === cat.slug;
              const isCurrentRoute = pathname.includes(cat.slug);

              return (
                <div
                  key={cat.slug}
                  onMouseEnter={() => setActiveCategory(cat)}
                  className="relative"
                >
                  <Link
                    href={cat.href}
                    className={cn(
                      "px-3.5 py-2 text-xs font-mono uppercase tracking-wider font-semibold transition-colors rounded-xs select-none block",
                      isActive || isCurrentRoute
                        ? "text-violet font-bold"
                        : "text-ink/80 hover:text-ink hover:bg-ink/5"
                    )}
                  >
                    {cat.name}
                  </Link>
                </div>
              );
            })}

            {/* Best Sellers Flag Link */}
            <Link
              href="/category/best-sellers"
              className={cn(
                "px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold text-ink rounded-full bg-spot-lime hover:bg-spot-lime-hover transition-colors ml-2 border border-ink shadow-stamp-sm",
                pathname === "/category/best-sellers" && "ring-2 ring-violet"
              )}
            >
              ★ Best Sellers
            </Link>
          </nav>

          {/* 3. Right: Action Buttons (Search, Account, Wishlist, Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={openSearch}
              className="p-2.5 text-ink hover:text-violet hover:bg-ink/5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              aria-label="Search custom products"
            >
              <Search className="h-5 w-5 stroke-[2]" />
            </button>

            {/* Account Link */}
            <Link
              href="/account"
              className="hidden sm:inline-flex p-2.5 text-ink hover:text-violet hover:bg-ink/5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              aria-label="Customer Account"
            >
              <User className="h-5 w-5 stroke-[2]" />
            </Link>

            {/* Wishlist Button with Badge */}
            <button
              type="button"
              onClick={openWishlist}
              className="p-2.5 text-ink hover:text-violet hover:bg-ink/5 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart className="h-5 w-5 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-lilac text-[10px] font-mono font-bold text-ink border border-ink">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button with Bump Animation */}
            <button
              type="button"
              onClick={openCart}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-violet text-white font-mono text-xs font-bold uppercase transition-all shadow-stamp hover:shadow-stamp-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet",
                cartBump && "scale-105"
              )}
              aria-label={`Cart (${totalCartCount} items)`}
            >
              <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Cart</span>
              <span className="inline-flex h-4.5 px-1.5 items-center justify-center rounded-full bg-spot-lime text-ink text-[11px] font-bold">
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Mega-Menu Hover Panel */}
        {activeCategory && (
          <MegaMenuPanel
            category={activeCategory}
            onClose={() => setActiveCategory(null)}
          />
        )}
      </header>

      {/* Mobile Fullscreen Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-paper flex flex-col animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between px-6 py-5 border-b border-ink/20">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-sm border border-ink/20 text-ink hover:bg-ink/10"
              aria-label="Close navigation"
            >
              <X className="h-6 w-6 stroke-[2]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-violet font-bold">
              Shop Categories
            </p>
            <nav className="flex flex-col space-y-4">
              {NAV_CATEGORIES.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-display font-extrabold text-2xl text-ink hover:text-violet transition-colors flex items-center justify-between border-b border-ink/10 pb-3"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span>{cat.name}</span>
                  <span className="font-mono text-xs text-ink/40 font-normal">0{idx + 1}</span>
                </Link>
              ))}

              <Link
                href="/category/best-sellers"
                onClick={() => setMobileMenuOpen(false)}
                className="font-display font-extrabold text-2xl text-ink bg-spot-lime p-3 rounded-sm border border-ink shadow-stamp-sm flex items-center justify-between"
              >
                <span>★ Best Sellers</span>
                <span className="font-mono text-xs font-bold uppercase">Popular</span>
              </Link>
            </nav>

            <div className="pt-6 border-t border-ink/20 space-y-4">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-sans font-semibold text-ink hover:text-violet"
              >
                <User className="h-5 w-5" />
                <span>My Account & Orders</span>
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-sans font-semibold text-ink hover:text-violet"
              >
                <span>Frequently Asked Questions</span>
              </Link>
            </div>
          </div>

          <div className="p-6 border-t border-ink/20 bg-paper-pure">
            <p className="font-mono text-xs text-ink/70">
              Need custom volume quote? Call +91 98765 43210
            </p>
          </div>
        </div>
      )}
    </>
  );
}

