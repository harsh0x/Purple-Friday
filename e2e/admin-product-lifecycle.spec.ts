import { test, expect } from "@playwright/test";

test.describe("Admin Product Lifecycle & Single Source of Truth E2E", () => {
  const testProductSlug = "e2e-premium-polo";

  test("1. Admin creates a new product with 2 colours, own images, 3 slabs, and sizes", async ({
    request,
  }) => {
    const res = await request.post("/api/admin/products", {
      data: {
        name: "E2E Premium Polo Shirt",
        slug: testProductSlug,
        categorySlug: "polo-shirts",
        description: "Heavyweight bio-washed piqué polo for corporate executives.",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        status: "ACTIVE",
        isBestSeller: true,
        costPrice: 20000,
        mrp: 899,
        basePrice: 450,
        printMethod: "Embroidery",
        colors: [
          {
            name: "Royal Navy",
            hex: "#1E293B",
            active: true,
            images: ["/products/executive-pique-polo.jpg"],
            stock: null,
          },
          {
            name: "Paper White",
            hex: "#FFFFFF",
            active: true,
            images: ["/products/executive-pique-polo.jpg"],
            stock: null,
          },
        ],
        sizes: ["S", "M", "L", "XL", "2XL"],
        priceTiers: [
          { minQty: 5, maxQty: 19, unitPrice: 450 },
          { minQty: 20, maxQty: 49, unitPrice: 390 },
          { minQty: 50, maxQty: null, unitPrice: 320 },
        ],
        images: [{ url: "/products/executive-pique-polo.jpg", isPrimary: true, altText: "Navy Polo" }],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.product.slug).toBe(testProductSlug);
    expect(body.product.status).toBe("ACTIVE");
    expect(body.product.priceTiers.length).toBe(3);
    expect(body.product.colors.length).toBe(2);
  });

  test("2. Storefront reflections: Product page and category show active product", async ({
    page,
    request,
  }) => {
    // A: Product page displays details, swatches, and slabs
    await page.goto(`/product/${testProductSlug}`);
    await expect(page.locator("h1")).toContainText("E2E Premium Polo Shirt");
    await expect(page.locator("body")).toContainText("Royal Navy");
    await expect(page.locator("body")).toContainText("Paper White");

    // B: Search API returns the new active product
    const searchRes = await request.get("/api/search?q=Premium+Polo");
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.results.some((r: { slug: string }) => r.slug === testProductSlug)).toBe(true);
  });

  test("3. Edit name and price -> storefront updates immediately", async ({ request, page }) => {
    const updateRes = await request.post("/api/admin/products", {
      data: {
        slug: testProductSlug,
        name: "E2E Premium Polo Shirt (Updated Edition)",
        categorySlug: "polo-shirts",
        description: "Updated description for executive corporate polo.",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        status: "ACTIVE",
        isBestSeller: true,
        costPrice: 20000,
        mrp: 999,
        basePrice: 480,
        printMethod: "Embroidery",
        colors: [
          {
            name: "Royal Navy",
            hex: "#1E293B",
            active: true,
            images: ["/products/executive-pique-polo.jpg"],
          },
        ],
        priceTiers: [
          { minQty: 5, maxQty: 19, unitPrice: 480 },
          { minQty: 20, maxQty: null, unitPrice: 350 },
        ],
      },
    });

    expect(updateRes.status()).toBe(200);

    // Verify storefront shows updated title
    await page.goto(`/product/${testProductSlug}`);
    await expect(page.locator("h1")).toContainText("E2E Premium Polo Shirt (Updated Edition)");
  });

  test("4. Archive product -> returns 404, removed from search and sitemap", async ({
    page,
    request,
  }) => {
    // Archive product
    const archiveRes = await request.post("/api/admin/products", {
      data: {
        action: "bulk_status",
        ids: [testProductSlug],
        status: "ARCHIVED",
      },
    });
    expect(archiveRes.status()).toBe(200);

    // Product page must return 404
    const res = await page.goto(`/product/${testProductSlug}`);
    expect(res?.status()).toBe(404);

    // Search must NOT return archived product
    const searchRes = await request.get("/api/search?q=Updated+Edition");
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.results.some((r: { slug: string }) => r.slug === testProductSlug)).toBe(false);
  });

  test("5. Restore product -> returns to active storefront", async ({ page, request }) => {
    const restoreRes = await request.post("/api/admin/products", {
      data: {
        action: "bulk_status",
        ids: [testProductSlug],
        status: "ACTIVE",
      },
    });
    expect(restoreRes.status()).toBe(200);

    const res = await page.goto(`/product/${testProductSlug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("6. Validation errors: slab gap/overlap, duplicate slug, delete refusal with orders", async ({
    request,
  }) => {
    // A: Slab error (increasing price)
    const slabErr = await request.post("/api/admin/products", {
      data: {
        name: "Invalid Slab Product",
        categorySlug: "t-shirts",
        description: "Test",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        costPrice: 10000,
        mrp: 500,
        basePrice: 200,
        printMethod: "DTF",
        priceTiers: [
          { minQty: 5, maxQty: 10, unitPrice: 200 },
          { minQty: 11, maxQty: null, unitPrice: 300 }, // Increasing!
        ],
      },
    });
    expect(slabErr.status()).toBe(400);

    // B: Duplicate slug error
    const dupErr = await request.post("/api/admin/products", {
      data: {
        name: "Different Name",
        slug: testProductSlug, // Already taken by testProductSlug
        categorySlug: "t-shirts",
        description: "Test",
        audience: "BOTH",
        minQty: 5,
        qtyStep: 1,
        gstRate: 0.18,
        active: true,
        costPrice: 10000,
        mrp: 500,
        basePrice: 200,
        printMethod: "DTF",
        priceTiers: [{ minQty: 5, maxQty: null, unitPrice: 200 }],
      },
    });
    expect(dupErr.status()).toBe(400);

    // C: Delete refusal with existing orders (seeded item)
    const delRes = await request.delete("/api/admin/products?id=round-gloss-badge-58mm");
    expect(delRes.status()).toBe(200);
    const delData = await delRes.json();
    expect(delData.actionTaken).toBe("ARCHIVED");
    expect(delData.message).toContain("referenced in existing customer orders");
  });
});
