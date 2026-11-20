import { describe, it, expect } from "vitest";
import {
  generateSlug,
  saveProduct,
  getProductByIdOrSlug,
  archiveOrDeleteProduct,
  getAdminProducts,
} from "@/server/products/product-service";

describe("Product Management - Slug Generation & Normalization", () => {
  it("generates URL-safe slugs from product names", () => {
    expect(generateSlug("Executive Cotton Piqué Polo Shirt (230 GSM)")).toBe(
      "executive-cotton-piqu-polo-shirt-230-gsm"
    );
    expect(generateSlug("58mm Round Gloss Magnetic Badge!!!")).toBe(
      "58mm-round-gloss-magnetic-badge"
    );
    expect(generateSlug("  Kangaroo   Hoodie - Heavyweight  ")).toBe(
      "kangaroo-hoodie-heavyweight"
    );
  });
});

describe("Product Management - Volume Pricing Matrix Validation", () => {
  const actor = { name: "Super Admin", role: "SUPER_ADMIN" };

  it("rejects pricing matrix with overlapping quantity tiers", async () => {
    const res = await saveProduct(
      {
        name: "Test Overlap Polo",
        categorySlug: "polo-shirts",
        description: "Test description",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 20000,
        mrp: 699,
        basePrice: 400,
        printMethod: "DTF",
        priceTiers: [
          { minQty: 5, maxQty: 15, unitPrice: 400 },
          { minQty: 15, maxQty: null, unitPrice: 350 }, // Overlaps with 15!
        ],
      },
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("gap/overlap");
  });

  it("rejects pricing matrix with gaps between tiers", async () => {
    const res = await saveProduct(
      {
        name: "Test Gap Polo",
        categorySlug: "polo-shirts",
        description: "Test description",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 20000,
        mrp: 699,
        basePrice: 400,
        printMethod: "DTF",
        priceTiers: [
          { minQty: 5, maxQty: 10, unitPrice: 400 },
          { minQty: 15, maxQty: null, unitPrice: 350 }, // Gap: 11-14 missing!
        ],
      },
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("gap/overlap");
  });

  it("rejects pricing matrix where prices increase as volume increases", async () => {
    const res = await saveProduct(
      {
        name: "Test Inverted Polo",
        categorySlug: "polo-shirts",
        description: "Test description",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 20000,
        mrp: 699,
        basePrice: 400,
        printMethod: "DTF",
        priceTiers: [
          { minQty: 5, maxQty: 14, unitPrice: 400 },
          { minQty: 15, maxQty: null, unitPrice: 450 }, // Higher price for higher quantity!
        ],
      },
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("Pricing must strictly decrease with volume");
  });

  it("calculates profit margin accurately for valid slabs", async () => {
    const res = await saveProduct(
      {
        name: "Valid Merch Polo",
        categorySlug: "polo-shirts",
        description: "Test description",
        audience: "TEAM",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 20000, // ₹200 COGS in paise
        mrp: 749,
        basePrice: 400,
        printMethod: "DTF",
        priceTiers: [
          { minQty: 5, maxQty: 19, unitPrice: 400 }, // Margin = (400 - 200)/400 = 50%
          { minQty: 20, maxQty: null, unitPrice: 300 }, // Margin = (300 - 200)/300 = 33.3%
        ],
      },
      actor
    );

    expect(res.success).toBe(true);
    expect(res.product?.priceTiers[0].marginPercent).toBe(50);
    expect(res.product?.priceTiers[1].marginPercent).toBe(33.3);
  });
});

describe("Product Management - Optimistic Concurrency & Slug Redirects", () => {
  const actor = { name: "Super Admin", role: "SUPER_ADMIN" };

  it("enforces optimistic concurrency control (version check)", async () => {
    const initial = await saveProduct(
      {
        name: "Concurrency Test Cap",
        categorySlug: "caps",
        description: "Desc",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 10000,
        mrp: 499,
        basePrice: 250,
        printMethod: "Embroidery",
        priceTiers: [{ minQty: 5, maxQty: null, unitPrice: 250 }],
      },
      actor
    );

    const prod = initial.product!;
    const v1 = prod.version;

    // Successful update with correct expectedVersion
    const update1 = await saveProduct(
      {
        ...prod,
        name: "Concurrency Test Cap Updated",
        priceTiers: prod.priceTiers,
        expectedVersion: v1,
      },
      actor
    );
    expect(update1.success).toBe(true);
    expect(update1.product?.version).toBe(v1 + 1);

    // Stale update using older version should fail
    const staleUpdate = await saveProduct(
      {
        ...prod,
        name: "Stale Cap Edit",
        priceTiers: prod.priceTiers,
        expectedVersion: v1, // Stale!
      },
      actor
    );
    expect(staleUpdate.success).toBe(false);
    expect(staleUpdate.error).toContain("Conflict: This product was modified by another user");
  });

  it("creates slug redirect when product slug changes and resolves seamlessly", async () => {
    const created = await saveProduct(
      {
        name: "Original Redirect Item",
        slug: "original-redirect-item",
        categorySlug: "corporate-gifts",
        description: "Desc",
        audience: "BOTH",
        minQty: 1,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        isBestSeller: false,
        costPrice: 5000,
        mrp: 299,
        basePrice: 150,
        printMethod: "Laser",
        priceTiers: [{ minQty: 1, maxQty: null, unitPrice: 150 }],
      },
      actor
    );

    const prod = created.product!;

    // Rename slug
    const renamed = await saveProduct(
      {
        ...prod,
        slug: "new-redirect-item",
        name: "New Redirect Item",
        priceTiers: prod.priceTiers,
        expectedVersion: prod.version,
      },
      actor
    );
    expect(renamed.success).toBe(true);

    // Query by old slug: should resolve to new product with redirectedFrom
    const queryOld = await getProductByIdOrSlug("original-redirect-item");
    expect(queryOld.product?.slug).toBe("new-redirect-item");
    expect(queryOld.redirectedFrom).toBe("original-redirect-item");
  });
});

describe("Product Management - Safe Archiving vs Hard Deletion", () => {
  const actor = { name: "Super Admin", role: "SUPER_ADMIN" };

  it("safely archives product rather than hard-deleting when orders reference it", async () => {
    // Seeded catalog item "round-gloss-badge-58mm" has existing orders
    const result = await archiveOrDeleteProduct("round-gloss-badge-58mm", actor);
    expect(result.success).toBe(true);
    expect(result.actionTaken).toBe("ARCHIVED");
    expect(result.message).toContain("referenced in existing customer orders");

    // Product still exists in database, but marked archived = true and active = false
    const prod = await getProductByIdOrSlug("round-gloss-badge-58mm");
    expect(prod.product?.archived).toBe(true);
    expect(prod.product?.active).toBe(false);

    // Active listing filter excludes archived by default
    const activeList = await getAdminProducts({ includeArchived: false });
    expect(activeList.some((p) => p.id === "round-gloss-badge-58mm")).toBe(false);

    // Setting includeArchived includes it
    const fullList = await getAdminProducts({ includeArchived: true });
    expect(fullList.some((p) => p.id === "round-gloss-badge-58mm")).toBe(true);
  });
});
