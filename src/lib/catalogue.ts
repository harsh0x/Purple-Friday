import { unstable_cache } from "next/cache";
import { normalizeSlug, productHref, categoryHref } from "./urls";
import {
  getStorefrontProducts,
  getStorefrontProductBySlug,
  IN_MEMORY_PRODUCTS,
  ProductData,
} from "@/server/products/product-service";
import {
  listCategories,
  getCategoryByIdOrSlug,
  CATEGORY_STORE,
} from "@/server/categories/category-service";
import { CATALOGUE_SEED_PRODUCTS } from "@/server/products/catalogue-seed-data";

export { normalizeSlug, productHref, categoryHref };

export interface CatalogueProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  categorySlug: string;
  description: string;
  badges: string[];
  specChips: string[];
  audience: "TEAM" | "GIFTING" | "BOTH";
  minQty: number;
  qtyStep: number;
  isBestSeller: boolean;
  mrp: number;
  basePrice: number;
  printMethod: string;
  template: string;
  rating: number;
  reviewCount: number;
  colors: Array<{ name: string; hex: string; images?: string[] }>;
  priceTiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
  createdAt?: string;
}

// Single source of truth export sourced from seed data for static typings
export const ALL_PRODUCTS: CatalogueProduct[] = CATALOGUE_SEED_PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortName: p.shortName,
    categorySlug: p.categorySlug,
    description: p.description,
    badges: p.badges,
    specChips: p.specChips,
    audience: p.audience,
    minQty: p.minQty,
    qtyStep: p.qtyStep,
    isBestSeller: p.isBestSeller,
    mrp: p.mrp,
    basePrice: p.basePrice,
    printMethod: p.printMethod,
    template: p.template,
    rating: p.rating,
    reviewCount: p.reviewCount,
    colors: p.colors,
    priceTiers: p.priceTiers,
  }));

export const CATEGORIES_LIST = [
  { id: "1", slug: "magnetic-badges", name: "Magnetic Badges", description: "Dual-neodymium magnetic fastener lapel pins and badges", sortOrder: 1, _count: { products: 4 } },
  { id: "2", slug: "t-shirts", name: "T-Shirts", description: "100% bio-washed custom printed cotton tees (includes athletic & heavyweight)", sortOrder: 2, _count: { products: 8 } },
  { id: "3", slug: "polo-shirts", name: "Polo Shirts", description: "230 GSM piqué corporate embroidered polos", sortOrder: 3, _count: { products: 4 } },
  { id: "4", slug: "hoodies", name: "Hoodies & Sweatshirts", description: "320 GSM brushed heavy fleece hoodies & sweatshirts", sortOrder: 4, _count: { products: 4 } },
  { id: "5", slug: "caps", name: "Caps & Headwear", description: "Structured 6-panel twill and retro mesh trucker caps", sortOrder: 5, _count: { products: 4 } },
  { id: "6", slug: "corporate-gifts", name: "Corporate Gifts & Kits", description: "Laser pens, notebooks, and insulated flasks", sortOrder: 6, _count: { products: 4 } },
];

function toCatalogueProduct(p: ProductData): CatalogueProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortName: p.shortName,
    categorySlug: p.categorySlug,
    description: p.description,
    badges: p.badges,
    specChips: p.specChips,
    audience: p.audience,
    minQty: p.minQty,
    qtyStep: p.qtyStep,
    isBestSeller: p.isBestSeller,
    mrp: p.mrp,
    basePrice: p.basePrice,
    printMethod: p.printMethod,
    template: p.slug.split("-")[0] || "tee",
    rating: p.rating || 4.9,
    reviewCount: p.reviewCount || 42,
    colors: p.colors.map((c) => ({ name: c.name, hex: c.hex, images: c.images })),
    priceTiers: p.priceTiers.map((t) => ({
      minQty: t.minQty,
      maxQty: t.maxQty,
      unitPrice: t.unitPrice,
    })),
    createdAt: p.createdAt,
  };
}

/**
 * Normalizes slug and finds matching product from authoritative store
 */
export function findProductBySlug(rawSlug: string): CatalogueProduct | undefined {
  if (!rawSlug) return undefined;
  const canonical = normalizeSlug(rawSlug);
  const p = IN_MEMORY_PRODUCTS.get(canonical) || IN_MEMORY_PRODUCTS.get(rawSlug);
  if (!p || p.archived || p.status !== "ACTIVE") return undefined;
  return toCatalogueProduct(p);
}

/**
 * Normalizes slug and finds matching category
 */
export function findCategoryBySlug(rawSlug: string) {
  if (!rawSlug) return undefined;
  const slug = rawSlug.toLowerCase().trim();
  if (slug === "all") {
    return {
      id: "all",
      slug: "all",
      name: "All Print Merchandise",
      description: "The complete atelier catalogue of proof-ready custom merchandise with bulk tier pricing.",
      _count: { products: ALL_PRODUCTS.length },
    };
  }
  if (slug === "best-sellers") {
    return {
      id: "best-sellers",
      slug: "best-sellers",
      name: "Best Selling Merchandise",
      description: "Our top-rated products chosen by over 1,200 Indian tech companies, college festivals, and design teams.",
      _count: { products: ALL_PRODUCTS.filter((p) => p.isBestSeller).length },
    };
  }
  const cat = CATEGORY_STORE.get(slug);
  if (cat && cat.active) {
    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sortOrder,
      _count: { products: ALL_PRODUCTS.filter((p) => p.categorySlug === cat.slug).length },
    };
  }
  return CATEGORIES_LIST.find((c) => c.slug === slug);
}

/**
 * Fetch all active categories with cache tag 'categories'
 */
export const getCachedCategories = unstable_cache(
  async () => {
    const categories = await listCategories({ includeInactive: false });
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      image: c.image,
      _count: {
        products: ALL_PRODUCTS.filter((p) => p.categorySlug === c.slug).length,
      },
    }));
  },
  ["categories-cache-key"],
  { tags: ["catalogue", "categories"], revalidate: 3600 }
);

/**
 * Fetch active products with cache tag 'products'
 */
export const getCachedProducts = unstable_cache(
  async (categorySlug?: string): Promise<CatalogueProduct[]> => {
    const products = await getStorefrontProducts(categorySlug);
    return products.map(toCatalogueProduct);
  },
  ["products-cache-key"],
  { tags: ["catalogue", "products"], revalidate: 3600 }
);

/**
 * Async lookup helper for single active product
 */
export async function getProductBySlug(rawSlug: string): Promise<CatalogueProduct | undefined> {
  const canonical = normalizeSlug(rawSlug);
  const p = await getStorefrontProductBySlug(canonical || rawSlug);
  if (!p) return undefined;
  return toCatalogueProduct(p);
}

/**
 * Async lookup helper for single category
 */
export async function getCategoryBySlug(rawSlug: string) {
  const slug = rawSlug.toLowerCase().trim();
  if (slug === "all") {
    const all = await getCachedProducts();
    return {
      id: "all",
      slug: "all",
      name: "All Print Merchandise",
      description: "The complete atelier catalogue of proof-ready custom merchandise with bulk tier pricing.",
      _count: { products: all.length },
    };
  }
  if (slug === "best-sellers") {
    const all = await getCachedProducts();
    return {
      id: "best-sellers",
      slug: "best-sellers",
      name: "Best Selling Merchandise",
      description: "Our top-rated products chosen by over 1,200 Indian tech companies, college festivals, and design teams.",
      _count: { products: all.filter((p) => p.isBestSeller).length },
    };
  }

  const { category } = await getCategoryByIdOrSlug(slug);
  if (!category || !category.active) return undefined;

  const all = await getCachedProducts();
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    image: category.image,
    _count: {
      products: all.filter((p) => p.categorySlug === category.slug).length,
    },
  };
}
