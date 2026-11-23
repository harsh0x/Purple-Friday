import { describe, it, expect } from "vitest";
import { CATALOGUE_SEED_PRODUCTS } from "@/server/products/catalogue-seed-data";
import {
  getProductByIdOrSlug,
  getStorefrontProducts,
  getStorefrontProductBySlug,
  saveProduct,
  duplicateProduct,
  bulkUpdateProductStatus,
  listProductsPaginated,
  getMasterColors,
  addMasterColor,
} from "@/server/products/product-service";
import { listCategories } from "@/server/categories/category-service";

describe("Catalogue Single Source of Truth - Migration & Data Fidelity", () => {
  it("verifies all 24 seeded products match exactly on name, slug, slabs, colours, and images", async () => {
    expect(CATALOGUE_SEED_PRODUCTS.length).toBe(24);

    for (const seed of CATALOGUE_SEED_PRODUCTS) {
      const { product } = await getProductByIdOrSlug(seed.slug);
      expect(product, `Product '${seed.slug}' should exist in authoritative service`).toBeDefined();
      if (!product) continue;

      // 1. Name & Slug
      expect(product.name).toBe(seed.name);
      expect(product.slug).toBe(seed.slug);
      expect(product.categorySlug).toBe(seed.categorySlug);

      // 2. Price Tiers (Slabs)
      expect(product.priceTiers.length).toBe(seed.priceTiers.length);
      seed.priceTiers.forEach((tier, index) => {
        expect(product.priceTiers[index].minQty).toBe(tier.minQty);
        expect(product.priceTiers[index].maxQty).toBe(tier.maxQty);
        expect(product.priceTiers[index].unitPrice).toBe(tier.unitPrice);
      });

      // 3. Colours
      expect(product.colors.length).toBe(seed.colors.length);
      seed.colors.forEach((col, index) => {
        expect(product.colors[index].name).toBe(col.name);
        expect(product.colors[index].hex.toUpperCase()).toBe(col.hex.toUpperCase());
        // Every active colour must have images
        expect(product.colors[index].images.length).toBeGreaterThan(0);
      });

      // 4. Default Image
      expect(product.images[0].url).toBe(seed.defaultImage);
    }
  });

  it("verifies storefront only displays active, non-archived products", async () => {
    const storefrontItems = await getStorefrontProducts();
    expect(storefrontItems.length).toBe(24);
    for (const item of storefrontItems) {
      expect(item.active).toBe(true);
      expect(item.status).toBe("ACTIVE");
      expect(item.archived).toBe(false);
    }
  });

  it("verifies categories match the 6 core groups in correct order", async () => {
    const categories = await listCategories({ includeInactive: false });
    expect(categories.length).toBe(6);
    const slugs = categories.map((c) => c.slug);
    expect(slugs).toEqual([
      "magnetic-badges",
      "t-shirts",
      "polo-shirts",
      "hoodies",
      "caps",
      "corporate-gifts",
    ]);
  });

  it("enforces rule: a colour with no image cannot be active", async () => {
    const actor = { name: "Admin", role: "ADMIN" };
    const invalidSave = await saveProduct(
      {
        name: "Test No-Image Colour Tee",
        categorySlug: "t-shirts",
        description: "Test description",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 15000,
        mrp: 599,
        basePrice: 300,
        printMethod: "DTF",
        colors: [
          { name: "Valid Black", hex: "#15101F", active: true, images: ["/products/tee.jpg"] },
          { name: "Imageless White", hex: "#FFFFFF", active: true, images: [] }, // Active with no image!
        ],
        priceTiers: [{ minQty: 5, maxQty: null, unitPrice: 300 }],
      },
      actor
    );

    expect(invalidSave.success).toBe(false);
    expect(invalidSave.error).toContain("cannot be active without at least one product image");
  });

  it("allows duplicating a product into a DRAFT copy", async () => {
    const actor = { name: "Admin", role: "ADMIN" };
    const res = await duplicateProduct("classic-crewneck-tshirt", actor);
    expect(res.success).toBe(true);
    expect(res.product?.status).toBe("DRAFT");
    expect(res.product?.active).toBe(false);
    expect(res.product?.slug).toBe("classic-crewneck-tshirt-copy");
    expect(res.product?.name).toBe("Classic Crewneck Cotton T-Shirt (180 GSM) (Copy)");

    // Draft product should NOT show on storefront
    const storefrontCheck = await getStorefrontProductBySlug("classic-crewneck-tshirt-copy");
    expect(storefrontCheck).toBeNull();
  });

  it("supports server pagination and bulk status updating", async () => {
    const paginated = await listProductsPaginated({ page: 1, limit: 10 });
    expect(paginated.products.length).toBeLessThanOrEqual(10);
    expect(paginated.total).toBeGreaterThanOrEqual(24);
    expect(paginated.totalPages).toBeGreaterThanOrEqual(3);

    const actor = { name: "Admin", role: "ADMIN" };
    const bulkRes = await bulkUpdateProductStatus(
      ["classic-crewneck-tshirt-copy"],
      "ARCHIVED",
      actor
    );
    expect(bulkRes.success).toBe(true);
    expect(bulkRes.updatedCount).toBe(1);

    const { product } = await getProductByIdOrSlug("classic-crewneck-tshirt-copy");
    expect(product?.status).toBe("ARCHIVED");
    expect(product?.archived).toBe(true);
  });

  it("manages master colours registry", () => {
    const initialColors = getMasterColors();
    expect(initialColors.length).toBeGreaterThanOrEqual(10);

    const newColor = addMasterColor("Neon Lime", "#D8FF3F");
    expect(newColor.name).toBe("Neon Lime");
    expect(newColor.hex).toBe("#D8FF3F");

    const updated = getMasterColors();
    expect(updated.some((c) => c.name === "Neon Lime")).toBe(true);
  });
});
