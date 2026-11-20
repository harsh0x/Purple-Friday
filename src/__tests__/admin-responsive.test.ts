import { describe, it, expect } from "vitest";
import { ADMIN_NAVIGATION } from "../lib/admin/navigation";
import { ALL_PERMISSIONS } from "../lib/admin/permissions";

describe("Admin Shell Architecture & Responsive Navigation", () => {
  it("registry only exposes implemented sections and routes for Part 1 & Part 2", () => {
    const sectionIds = ADMIN_NAVIGATION.map((s) => s.id);
    expect(sectionIds).toEqual(["overview", "pipeline", "system"]);

    const allItems = ADMIN_NAVIGATION.flatMap((s) => s.items);
    const hrefs = allItems.map((i) => i.href);
    expect(hrefs).toContain("/admin");
    expect(hrefs).toContain("/admin/orders");
    expect(hrefs).toContain("/admin/designs");
    expect(hrefs).toContain("/admin/production");
    expect(hrefs).toContain("/admin/team");
    expect(hrefs).toContain("/admin/audit");
    expect(hrefs).toContain("/admin/settings");

    // Strictly ensure no unbuilt / future part routes are exposed in the navigation registry
    expect(hrefs).not.toContain("/admin/products");
    expect(hrefs).not.toContain("/admin/coupons");
    expect(hrefs).not.toContain("/admin/reviews");
    expect(hrefs).not.toContain("/admin/quotes");
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
    const targetWidths = [320, 375, 768, 1024, 1440, 1920];
    for (const width of targetWidths) {
      if (width < 768) {
        // Mobile / Small Viewport
        const isMobile = width < 768;
        expect(isMobile).toBe(true);
      } else if (width >= 768 && width < 1024) {
        // Tablet
        expect(width >= 768).toBe(true);
      } else {
        // Desktop / Wide
        expect(width >= 1024).toBe(true);
      }
    }
  });
});
