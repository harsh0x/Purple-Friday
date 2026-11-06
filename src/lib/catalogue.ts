import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import { CATALOG_FALLBACK } from "./pricing";

/**
 * Fetch all active categories with cache tag 'categories'
 */
export const getCachedCategories = unstable_cache(
  async () => {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const categories = await prisma.category.findMany({
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        });
        if (categories.length > 0) return categories;
      } catch {
        // Fallback
      }
    }

    // Static Category Fallback
    return [
      { id: "1", slug: "magnetic-badges", name: "Magnetic Badges", description: "No fabric damage magnetic lapel pins", sortOrder: 1, _count: { products: 4 } },
      { id: "2", slug: "t-shirts", name: "T-Shirts", description: "100% bio-washed custom printed cotton tees", sortOrder: 2, _count: { products: 4 } },
      { id: "3", slug: "polo-shirts", name: "Polo Shirts", description: "230 GSM piqué corporate embroidered polos", sortOrder: 3, _count: { products: 4 } },
      { id: "4", slug: "hoodies", name: "Hoodies & Sweatshirts", description: "320 GSM brushed heavy fleece hoodies", sortOrder: 4, _count: { products: 4 } },
      { id: "5", slug: "caps", name: "Caps & Headwear", description: "Structured 6-panel twill and trucker caps", sortOrder: 5, _count: { products: 4 } },
      { id: "6", slug: "corporate-gifts", name: "Corporate Gifts & Kits", description: "Laser pens, notebooks, and steel flasks", sortOrder: 6, _count: { products: 4 } },
    ];
  },
  ["categories-cache-key"],
  { tags: ["catalogue", "categories"], revalidate: 3600 }
);

/**
 * Fetch flagship products with cache tag 'products'
 */
export const getCachedProducts = unstable_cache(
  async (categorySlug?: string) => {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const products = await prisma.product.findMany({
          where: {
            active: true,
            ...(categorySlug ? { category: { slug: categorySlug } } : {}),
          },
          include: {
            category: true,
            priceTiers: { orderBy: { minQty: "asc" } },
            options: true,
          },
          orderBy: { sortOrder: "asc" },
          take: 24,
        });

        if (products.length > 0) return products;
      } catch {
        // Fallback
      }
    }

    // Static Fallback
    return Object.values(CATALOG_FALLBACK).map((p, idx) => ({
      id: p.slug,
      slug: p.slug,
      name: p.name,
      shortName: p.name.split("(")[0].trim(),
      description: "Artisan print merchandise engineered for Indian businesses and teams.",
      badges: ["Best Seller"],
      specChips: ["High Definition Print", "Bulk Ready"],
      audience: "BOTH",
      minQty: p.minQty,
      qtyStep: p.qtyStep,
      isBestSeller: true,
      mrp: p.mrp,
      basePrice: p.basePrice,
      printMethod: "DTG / Screen Print / Laser",
      printAreas: {},
      sortOrder: idx,
      active: true,
      categoryId: "1",
      createdAt: new Date(),
      updatedAt: new Date(),
      priceTiers: p.tiers.map((t, tIdx) => ({
        id: `${p.slug}-${tIdx}`,
        productId: p.slug,
        minQty: t.minQty,
        maxQty: t.maxQty,
        unitPrice: t.unitPrice,
      })),
      options: [],
    }));
  },
  ["products-cache-key"],
  { tags: ["catalogue", "products"], revalidate: 3600 }
);

