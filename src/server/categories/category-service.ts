import prisma from "@/lib/prisma";
import { writeAudit } from "@/lib/admin/audit";

async function safeRevalidateTag(tag: string) {
  try {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(tag);
  } catch { }
}

export interface CategoryData {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Global In-Memory Category Store & Slug Redirects
export const CATEGORY_STORE = new Map<string, CategoryData>();
export const CATEGORY_SLUG_REDIRECTS = new Map<string, string>(); // fromSlug -> toSlug

export const INITIAL_CATEGORIES: CategoryData[] = [
  {
    id: "cat_1",
    slug: "magnetic-badges",
    name: "Magnetic Badges",
    description: "Dual-neodymium magnetic fastener lapel pins and badges",
    image: "/categories/badges.jpg",
    seoTitle: "Custom Magnetic Badges & Lapel Pins | Purple Friday",
    seoDescription: "Dual-neodymium magnetic badges and executive lapel pins with custom UV and die-cast printing.",
    sortOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_2",
    slug: "t-shirts",
    name: "T-Shirts",
    description: "100% bio-washed custom printed cotton tees (includes athletic & heavyweight)",
    image: "/categories/tshirts.jpg",
    seoTitle: "Custom Printed T-Shirts & Polos | Purple Friday",
    seoDescription: "180 to 240 GSM bio-washed custom t-shirts and polos with DTF and screen printing.",
    sortOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_3",
    slug: "polo-shirts",
    name: "Polo Shirts",
    description: "230 GSM piqué corporate embroidered polos",
    image: "/categories/polos.jpg",
    seoTitle: "Custom Embroidered Polo Shirts | Purple Friday",
    seoDescription: "230 GSM piqué corporate embroidered polos with custom corporate branding.",
    sortOrder: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_4",
    slug: "hoodies",
    name: "Hoodies & Sweatshirts",
    description: "320 GSM brushed heavy fleece hoodies & sweatshirts",
    image: "/categories/hoodies.jpg",
    seoTitle: "Custom Hoodies & Heavyweight Sweatshirts | Purple Friday",
    seoDescription: "Premium 320-380 GSM brushed fleece custom hoodies with high-density DTF printing.",
    sortOrder: 4,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_5",
    slug: "caps",
    name: "Caps & Headwear",
    description: "Structured 6-panel twill and retro mesh trucker caps",
    image: "/categories/caps.jpg",
    seoTitle: "Custom Embroidered Caps & Headwear | Purple Friday",
    seoDescription: "Structured 6-panel twill and mesh trucker caps with 3D embroidery.",
    sortOrder: 5,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_6",
    slug: "corporate-gifts",
    name: "Corporate Gifts & Kits",
    description: "Laser pens, notebooks, and insulated flasks",
    image: "/categories/gifting.jpg",
    seoTitle: "Corporate Gifts & Joining Kits | Purple Friday",
    seoDescription: "Executive employee onboarding gifts, insulated flasks, and metal pens.",
    sortOrder: 6,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SLUG_ALIASES: Record<string, string> = {
  tees: "t-shirts",
  tshirt: "t-shirts",
  tshirts: "t-shirts",
  "t-shirt": "t-shirts",
  "custom-tees": "t-shirts",
  badges: "magnetic-badges",
  badge: "magnetic-badges",
  "lapel-pins": "magnetic-badges",
  hoodie: "hoodies",
  sweatshirt: "hoodies",
  sweatshirts: "hoodies",
  polo: "polo-shirts",
  polos: "polo-shirts",
  cap: "caps",
  hat: "caps",
  hats: "caps",
  headwear: "caps",
  "corporate-gifting": "corporate-gifts",
  corporate: "corporate-gifts",
  gifting: "corporate-gifts",
  "corporate-kits": "corporate-gifts",
};

export function initializeDefaultCategories(): void {
  for (const [alias, canonical] of Object.entries(INITIAL_SLUG_ALIASES)) {
    CATEGORY_SLUG_REDIRECTS.set(alias, canonical);
  }

  if (CATEGORY_STORE.size > 0) return;
  for (const cat of INITIAL_CATEGORIES) {
    CATEGORY_STORE.set(cat.id, cat);
    CATEGORY_STORE.set(cat.slug, cat);
  }
}

initializeDefaultCategories();

export function normalizeCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * List all categories sorted by sortOrder ascending.
 */
export async function listCategories(options?: {
  includeInactive?: boolean;
}): Promise<CategoryData[]> {
  initializeDefaultCategories();

  // Deduplicate by ID
  const mapById = new Map<string, CategoryData>();
  for (const c of CATEGORY_STORE.values()) {
    mapById.set(c.id, c);
  }

  let list = Array.from(mapById.values());
  if (!options?.includeInactive) {
    list = list.filter((c) => c.active);
  }

  return list.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Find single category by slug or ID with redirect tracking.
 */
export async function getCategoryByIdOrSlug(
  identifier: string
): Promise<{ category: CategoryData | null; redirectedFrom?: string }> {
  initializeDefaultCategories();

  let target = identifier.toLowerCase().trim();
  let redirectedFrom: string | undefined = undefined;

  if (CATEGORY_SLUG_REDIRECTS.has(target)) {
    redirectedFrom = target;
    target = CATEGORY_SLUG_REDIRECTS.get(target)!;
  }

  const category = CATEGORY_STORE.get(target) || null;
  return { category, redirectedFrom };
}

/**
 * Create or Update a Category.
 */
export async function saveCategory(
  data: {
    id?: string;
    slug?: string;
    name: string;
    description: string;
    image?: string;
    seoTitle?: string;
    seoDescription?: string;
    sortOrder?: number;
    active?: boolean;
  },
  actor: { name: string; role: string }
): Promise<{ success: boolean; category?: CategoryData; error?: string }> {
  initializeDefaultCategories();

  const cleanName = data.name.trim();
  if (!cleanName) {
    return { success: false, error: "Category name is required." };
  }

  const targetSlug = data.slug
    ? normalizeCategorySlug(data.slug)
    : normalizeCategorySlug(cleanName);

  const existing = data.id ? CATEGORY_STORE.get(data.id) : null;

  if (existing) {
    // Slug changed -> check collision and record redirect
    if (existing.slug !== targetSlug) {
      const taken = CATEGORY_STORE.get(targetSlug);
      if (taken && taken.id !== existing.id) {
        return { success: false, error: `Slug '${targetSlug}' is already in use by another category.` };
      }
      CATEGORY_SLUG_REDIRECTS.set(existing.slug, targetSlug);
      CATEGORY_STORE.delete(existing.slug);
    }
  } else {
    // Check slug uniqueness for new category
    const taken = CATEGORY_STORE.get(targetSlug);
    if (taken) {
      return { success: false, error: `Slug '${targetSlug}' is already in use.` };
    }
  }

  const id = existing?.id || data.id || `cat_${Date.now()}`;
  const now = new Date().toISOString();

  // Determine sort order
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    if (existing) {
      sortOrder = existing.sortOrder;
    } else {
      const current = await listCategories({ includeInactive: true });
      sortOrder = current.length > 0 ? Math.max(...current.map((c) => c.sortOrder)) + 1 : 1;
    }
  }

  const updated: CategoryData = {
    id,
    slug: targetSlug,
    name: cleanName,
    description: (data.description || "").trim(),
    image: data.image || existing?.image || "/categories/default.jpg",
    seoTitle: data.seoTitle || existing?.seoTitle || `${cleanName} | Purple Friday`,
    seoDescription: data.seoDescription || existing?.seoDescription || data.description,
    sortOrder,
    active: data.active !== undefined ? data.active : existing?.active ?? true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  CATEGORY_STORE.set(id, updated);
  CATEGORY_STORE.set(targetSlug, updated);

  // Sync to database if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("sample-project")) {
      await prisma.category.upsert({
        where: { slug: targetSlug },
        create: {
          id: updated.id,
          slug: updated.slug,
          name: updated.name,
          description: updated.description,
          sortOrder: updated.sortOrder,
          active: updated.active,
        },
        update: {
          name: updated.name,
          description: updated.description,
          sortOrder: updated.sortOrder,
          active: updated.active,
        },
      });
    }
  } catch {
    // Fallback
  }

  try {
    safeRevalidateTag("catalogue");
    safeRevalidateTag("categories");
  } catch { }

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: existing ? "admin:update_category" : "admin:create_category",
    entityType: "Category",
    entityId: id,
    before: existing ? (existing as unknown as Record<string, unknown>) : null,
    after: updated as unknown as Record<string, unknown>,
  });

  return { success: true, category: updated };
}

/**
 * Reorder categories by moving an item up or down.
 */
export async function reorderCategory(
  slug: string,
  direction: "up" | "down",
  actor: { name: string; role: string }
): Promise<{ success: boolean; categories: CategoryData[] }> {
  initializeDefaultCategories();

  const list = await listCategories({ includeInactive: true });
  const index = list.findIndex((c) => c.slug === slug || c.id === slug);

  if (index === -1) {
    throw new Error(`Category '${slug}' not found.`);
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return { success: true, categories: list }; // Already at edge
  }

  // Swap sort orders
  const currentItem = list[index];
  const targetItem = list[targetIndex];

  const tempOrder = currentItem.sortOrder;
  currentItem.sortOrder = targetItem.sortOrder;
  targetItem.sortOrder = tempOrder;

  // If both have same sortOrder, ensure strict distinction
  if (currentItem.sortOrder === targetItem.sortOrder) {
    if (direction === "up") {
      currentItem.sortOrder = Math.max(1, targetItem.sortOrder - 1);
    } else {
      currentItem.sortOrder = targetItem.sortOrder + 1;
    }
  }

  currentItem.updatedAt = new Date().toISOString();
  targetItem.updatedAt = new Date().toISOString();

  CATEGORY_STORE.set(currentItem.id, currentItem);
  CATEGORY_STORE.set(currentItem.slug, currentItem);
  CATEGORY_STORE.set(targetItem.id, targetItem);
  CATEGORY_STORE.set(targetItem.slug, targetItem);

  try {
    safeRevalidateTag("catalogue");
    safeRevalidateTag("categories");
  } catch { }

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: "admin:reorder_category",
    entityType: "Category",
    entityId: currentItem.id,
    after: { movedSlug: currentItem.slug, direction, newOrder: currentItem.sortOrder },
  });

  return { success: true, categories: await listCategories({ includeInactive: true }) };
}

/**
 * Delete a category ONLY when it holds 0 products.
 */
export async function deleteCategory(
  slug: string,
  actor: { name: string; role: string },
  productCountCheck: (catSlug: string) => Promise<number> | number
): Promise<{ success: boolean; message: string }> {
  initializeDefaultCategories();

  const category = CATEGORY_STORE.get(slug);
  if (!category) {
    throw new Error(`Category '${slug}' not found.`);
  }

  // Enforce delete rule: category with products CANNOT be deleted
  const productCount = await productCountCheck(category.slug);
  if (productCount > 0) {
    throw new Error(
      `Cannot delete category "${category.name}". It still contains ${productCount} product(s). Move or delete the products first.`
    );
  }

  CATEGORY_STORE.delete(category.id);
  CATEGORY_STORE.delete(category.slug);

  // Sync to database if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("sample-project")) {
      await prisma.category.delete({
        where: { slug: category.slug },
      });
    }
  } catch {
    // Fallback
  }

  try {
    safeRevalidateTag("catalogue");
    safeRevalidateTag("categories");
  } catch { }

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: "admin:delete_category",
    entityType: "Category",
    entityId: category.id,
    before: category as unknown as Record<string, unknown>,
  });

  return { success: true, message: `Category "${category.name}" was successfully deleted.` };
}
