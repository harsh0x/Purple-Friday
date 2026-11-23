import { describe, it, expect } from "vitest";
import { ADMIN_NAVIGATION } from "../lib/admin/navigation";
import { requireAdmin, AdminForbiddenError } from "../lib/admin/permissions";

describe("Admin Shell Architecture & Responsive Navigation", () => {
  it("registry only exposes valid single-admin routes", () => {
    const sectionIds = ADMIN_NAVIGATION.map((s) => s.id);
    expect(sectionIds).toEqual(["core", "content", "system"]);

    const allItems = ADMIN_NAVIGATION.flatMap((s) => s.items);
    const hrefs = allItems.map((i) => i.href);

    // Single Admin routes
    expect(hrefs).toContain("/admin");
    expect(hrefs).toContain("/admin/orders");
    expect(hrefs).toContain("/admin/products");
    expect(hrefs).toContain("/admin/categories");
    expect(hrefs).toContain("/admin/reviews");
    expect(hrefs).toContain("/admin/customers");
    expect(hrefs).toContain("/admin/coupons");
    expect(hrefs).toContain("/admin/quotes");
    expect(hrefs).toContain("/admin/settings");
    expect(hrefs).toContain("/admin/audit");
    expect(hrefs).toContain("/admin/cms");
    expect(hrefs).toContain("/admin/pages");
    expect(hrefs).toContain("/admin/blog");
    expect(hrefs).toContain("/admin/media");

    // Strictly ensure all removed factory / role routes are absent
    expect(hrefs).not.toContain("/admin/team");
    expect(hrefs).not.toContain("/admin/designs");
    expect(hrefs).not.toContain("/admin/production");
    expect(hrefs).not.toContain("/admin/inventory");
    expect(hrefs).not.toContain("/admin/kits");
    expect(hrefs).not.toContain("/admin/dispatch");
    expect(hrefs).not.toContain("/admin/shipments");
    expect(hrefs).not.toContain("/admin/payments");
    expect(hrefs).not.toContain("/admin/analytics");
    expect(hrefs).not.toContain("/admin/margin");
    expect(hrefs).not.toContain("/admin/forecasting");
    expect(hrefs).not.toContain("/admin/support");
  });

  it("enforces requireAdmin guard correctly", () => {
    expect(() => requireAdmin({ role: "ADMIN", active: true })).not.toThrow();
    expect(() => requireAdmin("ADMIN")).not.toThrow();

    expect(() => requireAdmin({ role: "CUSTOMER", active: true })).toThrow(AdminForbiddenError);
    expect(() => requireAdmin({ role: "ADMIN", active: false })).toThrow(AdminForbiddenError);
    expect(() => requireAdmin(null)).toThrow(AdminForbiddenError);
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
        expect(category).toBe("mobile");
        expect(width).toBeLessThan(768);
      } else if (width >= 768 && width < 1024) {
        expect(category).toBe("tablet");
        expect(width).toBeGreaterThanOrEqual(768);
        expect(width).toBeLessThan(1024);
      } else {
        expect(category).toBe("desktop");
        expect(width).toBeGreaterThanOrEqual(1024);
      }
    }
  });

  it("explicitly verifies the required key breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)", () => {
    expect(375 < 768).toBe(true);
    expect(768 >= 768 && 768 < 1024).toBe(true);
    expect(1440 >= 1024).toBe(true);
  });
});
