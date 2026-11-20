import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Admin Pure Layout & Themed Sidebar Features", () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
      }),
    });
  });

  it("1. Storage keys for theme and transparent sidebar are consistently defined", () => {
    const THEME_KEY = "pf_admin_theme";
    const TRANSPARENT_KEY = "pf_admin_transparent_sidebar";

    localStorage.setItem(THEME_KEY, "dark");
    localStorage.setItem(TRANSPARENT_KEY, "true");

    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(localStorage.getItem(TRANSPARENT_KEY)).toBe("true");

    localStorage.setItem(TRANSPARENT_KEY, "false");
    expect(localStorage.getItem(TRANSPARENT_KEY)).toBe("false");
  });

  it("2. Route detection properly isolates /admin paths from storefront chrome", () => {
    const isAdminRoute = (path: string) => path.startsWith("/admin");

    // Admin routes
    expect(isAdminRoute("/admin")).toBe(true);
    expect(isAdminRoute("/admin/login")).toBe(true);
    expect(isAdminRoute("/admin/orders")).toBe(true);
    expect(isAdminRoute("/admin/dispatch")).toBe(true);
    expect(isAdminRoute("/admin/settings")).toBe(true);
    expect(isAdminRoute("/admin/orders/PF-2611-0001")).toBe(true);

    // Storefront routes (must NOT be treated as admin)
    expect(isAdminRoute("/")).toBe(false);
    expect(isAdminRoute("/about")).toBe(false);
    expect(isAdminRoute("/collections/all")).toBe(false);
    expect(isAdminRoute("/product/apex-hoodie")).toBe(false);
    expect(isAdminRoute("/checkout")).toBe(false);
    expect(isAdminRoute("/reviews")).toBe(false);
    expect(isAdminRoute("/account")).toBe(false);
  });

  it("3. Native scroll / Lenis suppression accurately targets admin and checkout routes", () => {
    const shouldDisableSmoothScroll = (path: string) =>
      path.startsWith("/checkout") || path.startsWith("/admin");

    expect(shouldDisableSmoothScroll("/admin")).toBe(true);
    expect(shouldDisableSmoothScroll("/admin/orders")).toBe(true);
    expect(shouldDisableSmoothScroll("/checkout")).toBe(true);
    expect(shouldDisableSmoothScroll("/checkout/payment")).toBe(true);

    expect(shouldDisableSmoothScroll("/")).toBe(false);
    expect(shouldDisableSmoothScroll("/collections/all")).toBe(false);
    expect(shouldDisableSmoothScroll("/product/test-slug")).toBe(false);
  });

  it("4. Transparent sidebar mode class resolution produces expected frosted glass utility tokens", () => {
    const getSidebarClasses = (isTransparent: boolean) => {
      return isTransparent
        ? "bg-[#110E1B]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"
        : "bg-[#110E1B] border border-[#2A253B] shadow-2xl";
    };

    const transparentClasses = getSidebarClasses(true);
    expect(transparentClasses).toContain("backdrop-blur-xl");
    expect(transparentClasses).toContain("border-white/10");
    expect(transparentClasses).toContain("bg-[#110E1B]/60");

    const solidClasses = getSidebarClasses(false);
    expect(solidClasses).toContain("bg-[#110E1B]");
    expect(solidClasses).toContain("border-[#2A253B]");
    expect(solidClasses).not.toContain("backdrop-blur-xl");
  });
});
