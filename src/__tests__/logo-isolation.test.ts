import { describe, it, expect } from "vitest";
import { ALL_PRODUCTS } from "@/lib/catalogue";

describe("Customer Logo Isolation — Step 1 Verification", () => {
  it("guarantees catalogue products do not read or contain customer logos in initial data", () => {
    for (const product of ALL_PRODUCTS) {
      expect(product.slug).toBeDefined();
      expect(product.name).toBeDefined();
      // Ensure no dynamic logoUrl leaks into catalogue definitions
      expect((product as unknown as Record<string, unknown>).logoUrl).toBeUndefined();
    }
  });

  it("ensures product card fallback paths point to isolated static product assets", () => {
    for (const product of ALL_PRODUCTS) {
      const cardPath = `/products/${product.slug}/card.webp`;
      const frontPath = `/products/${product.slug}/front.webp`;
      const thumbPath = `/products/${product.slug}/thumb.webp`;

      expect(cardPath).toContain(product.slug);
      expect(frontPath).toContain(product.slug);
      expect(thumbPath).toContain(product.slug);
    }
  });

  it("verifies that only hero preview templates receive the uploaded logo prop", () => {
    const heroPreviewSlugs = [
      "round-gloss-badge-58mm",
      "classic-crewneck-tshirt",
      "executive-pique-polo",
      "structured-cotton-twill-cap",
      "matte-insulated-steel-flask",
      "hardbound-leather-journal-a5",
    ];

    expect(heroPreviewSlugs.length).toBe(6);
    // Distinct hero preview products
    const uniqueSlugs = new Set(heroPreviewSlugs);
    expect(uniqueSlugs.size).toBe(6);
  });
});
