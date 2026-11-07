/**
 * Purple Friday — URL & Slug Canonicalization Helper
 * Single source of truth for all product and category routes.
 */

// Known slug aliases to ensure both old/new variants resolve deterministically
export const SLUG_ALIASES: Record<string, string> = {
  "mesh-trucker-snapback": "trucker-mesh-snapback-cap",
  "trucker-mesh-snapback": "trucker-mesh-snapback-cap",
  "executive-hardbound-journal": "hardbound-leather-journal-a5",
  "matte-metal-rollerball-pen": "executive-brass-twist-pen",
  "zipper-fleece-hoodie": "metal-zipper-fleece-jacket",
  "leather-loop-keychain": "steel-engraved-keychain",
};

/**
 * Normalizes any slug string to lowercase, trimmed, hyphenated format and resolves aliases.
 */
export function normalizeSlug(rawSlug: string): string {
  if (!rawSlug) return "";
  const cleaned = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  return SLUG_ALIASES[cleaned] || cleaned;
}

/**
 * Generates canonical href for a product page.
 * Returns /product/[slug]
 */
export function productHref(productOrSlug: string | { slug: string }): string {
  const raw = typeof productOrSlug === "string" ? productOrSlug : productOrSlug.slug;
  const canonical = normalizeSlug(raw);
  return `/product/${canonical}`;
}

/**
 * Generates canonical href for a category page.
 * Returns /category/[slug]
 */
export function categoryHref(categoryOrSlug: string | { slug: string }): string {
  const raw = typeof categoryOrSlug === "string" ? categoryOrSlug : categoryOrSlug.slug;
  const canonical = raw.trim().toLowerCase();
  return `/category/${canonical}`;
}

