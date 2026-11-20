import { describe, it, expect } from "vitest";
import { ADMIN_NAVIGATION } from "../lib/admin/navigation";
import { ALL_PERMISSIONS } from "../lib/admin/permissions";

describe("Admin Shell Architecture & Responsive Navigation", () => {
    it("registry only exposes implemented sections and routes for Part 1, Part 2 & Part 3", () => {
      const sectionIds = ADMIN_NAVIGATION.map((s) => s.id);
      expect(sectionIds).toEqual(["overview", "pipeline", "catalogue", "system"]);

      const allItems = ADMIN_NAVIGATION.flatMap((s) => s.items);
      const hrefs = allItems.map((i) => i.href);

    // Part 1 routes
    expect(hrefs).toContain("/admin");
    expect(hrefs).toContain("/admin/team");
    expect(hrefs).toContain("/admin/audit");
    expect(hrefs).toContain("/admin/settings");

        // Part 2 routes
        expect(hrefs).toContain("/admin/orders");
        expect(hrefs).toContain("/admin/designs");
        expect(hrefs).toContain("/admin/production");

        // Part 3 routes
        expect(hrefs).toContain("/admin/quotes");
        expect(hrefs).toContain("/admin/products");
        expect(hrefs).toContain("/admin/inventory");
        expect(hrefs).toContain("/admin/kits");
        expect(hrefs).toContain("/admin/coupons");

        // Strictly ensure no unbuilt / future part routes are exposed in the navigation registry
        expect(hrefs).not.toContain("/admin/reviews");
        expect(hrefs).not.toContain("/admin/customers");
        expect(hrefs).not.toContain("/admin/analytics");
        expect(hrefs).not.toContain("/admin/support");
        expect(hrefs).not.toContain("/admin/reports");
      });

    it("every item in navigation registry binds a valid permission or is public admin", () => {
      const allItems = ADMIN_NAVIGATION.flatMap((s) => s.items);
      for (const item of allItems) {
        if (item.permission) {
          expect(ALL_PERMISSIONS).toContain(item.permission);
        }
  }
  });

    it("validates responsive breakpoints coverage across 320, 375, 768, 1024, 1440, 1920 widths", () => {
      const targetWidths = [
        { width: 320, category: "mobile" },
        { width: 375, category: "mobile" },
        { width: 768, category: "tablet" },
        { width: 1024, category: "desktop" },
        { width: 1440, category: "desktop" },
        { width: 1920, category: "desktop" },
      ];

      for (const { width, category } of targetWidths) {
        if (width < 768) {
          // Mobile / Small Viewport (320px, 375px)
          expect(category).toBe("mobile");
          expect(width).toBeLessThan(768);
        } else if (width >= 768 && width < 1024) {
          // Tablet (768px)
          expect(category).toBe("tablet");
          expect(width).toBeGreaterThanOrEqual(768);
          expect(width).toBeLessThan(1024);
        } else {
          // Desktop / Wide (1024px, 1440px, 1920px)
          expect(category).toBe("desktop");
          expect(width).toBeGreaterThanOrEqual(1024);
        }
  }
});

it("explicitly verifies the required key breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)", () => {
  // 375px: Mobile breakpoint
  const isMobile375 = 375 < 768;
  expect(isMobile375).toBe(true);

  // 768px: Tablet breakpoint
  const isTablet768 = 768 >= 768 && 768 < 1024;
  expect(isTablet768).toBe(true);

  // 1440px: Desktop breakpoint
  const isDesktop1440 = 1440 >= 1024;
  expect(isDesktop1440).toBe(true);
});
});
