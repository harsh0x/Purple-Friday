/**
 * Purple Friday - Bundles and Joining Kits Service
 * 
 * Rules:
 * - A Kit has components (product/blank SKU and quantity each) and one unified kit price.
 * - Selling one kit reserves and later consumes stock from EVERY component.
 * - If any component cannot be fulfilled, the kit shows as Out of Stock automatically on storefront and admin.
 * - Admin sees which component is short and the configured substitute product.
 * - Atomic reservation and release logic.
 */

import {
  getBlankSku,
  reserveBlanksForOrder,
  consumeBlanksForOrder,
  releaseBlanksForOrder,
} from "@/server/inventory/inventory-service";
import { writeAudit } from "@/lib/admin/audit";

export interface KitComponentItem {
  id: string;
  blankSkuId: string;
  sku: string;
  name: string;
  quantity: number;
  substituteBlankSkuId?: string;
  substituteSku?: string;
  substituteName?: string;
}

export interface ShortageReport {
  componentId: string;
  sku: string;
  name: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
  substituteSku?: string;
  substituteName?: string;
}

export interface KitData {
  id: string;
  name: string;
  slug: string;
  description: string;
  kitPricePaise: number;
  kitPrice: number; // in rupees
  active: boolean;
  isOutOfStock: boolean;
  maxFulfillableKits: number;
  shortageComponents: ShortageReport[];
  components: KitComponentItem[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

// In-Memory Kits Store
const KITS_STORE = new Map<string, KitData>();

function initializeDefaultKits() {
  if (KITS_STORE.size > 0) return;

  const defaults: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    kitPricePaise: number;
    components: KitComponentItem[];
  }> = [
    {
      id: "kit_new_joinee",
      name: "Corporate New Joinee Onboarding Pack",
      slug: "new-joinee-onboarding-kit",
      description:
        "Standard employee day-one welcome swag pack: 1 Polo, 1 Metal Pen, 1 Diary, and 1 Magnetic Badge.",
      kitPricePaise: 85000, // ₹850 in paise
      components: [
        {
          id: "comp_polo",
          blankSkuId: "BLANK-POLO-NAVY-M",
          sku: "BLANK-POLO-NAVY-M",
          name: "Executive Cotton Piqué Polo, Navy, M",
          quantity: 1,
          substituteBlankSkuId: "BLANK-TEE-BLACK-L",
          substituteSku: "BLANK-TEE-BLACK-L",
          substituteName: "Classic Crewneck Tee, Ink Black, L",
        },
        {
          id: "comp_pen",
          blankSkuId: "BLANK-PEN-METAL-BALL",
          sku: "BLANK-PEN-METAL-BALL",
          name: "Die-Cast Matte Metal Ballpoint Pen",
          quantity: 1,
        },
        {
          id: "comp_notebook",
          blankSkuId: "BLANK-NOTEBOOK-A5-DIARY",
          sku: "BLANK-NOTEBOOK-A5-DIARY",
          name: "Hardcover Vegan Leather Journal A5",
          quantity: 1,
        },
        {
          id: "comp_badge",
          blankSkuId: "BLANK-BADGE-GLOSS-58",
          sku: "BLANK-BADGE-GLOSS-58",
          name: "58mm Round Gloss Magnetic Badge",
          quantity: 1,
        },
      ],
    },
    {
      id: "kit_executive_welcome",
      name: "Executive Client Gifting Pack",
      slug: "executive-welcome-pack",
      description:
        "Curated premium corporate gifting set: 1 Insulated Steel Flask, 1 Leather Journal, and 1 Metal Pen.",
      kitPricePaise: 42000, // ₹420 in paise
      components: [
        {
          id: "comp_exec_flask",
          blankSkuId: "BLANK-FLASK-STEEL-750",
          sku: "BLANK-FLASK-STEEL-750",
          name: "Double-Wall Insulated Steel Flask 750ml",
          quantity: 1,
        },
        {
          id: "comp_exec_notebook",
          blankSkuId: "BLANK-NOTEBOOK-A5-DIARY",
          sku: "BLANK-NOTEBOOK-A5-DIARY",
          name: "Hardcover Vegan Leather Journal A5",
          quantity: 1,
        },
        {
          id: "comp_exec_pen",
          blankSkuId: "BLANK-PEN-METAL-BALL",
          sku: "BLANK-PEN-METAL-BALL",
          name: "Die-Cast Matte Metal Ballpoint Pen",
          quantity: 1,
        },
      ],
    },
    {
      id: "kit_hoodie_cap",
      name: "Winter Team Swag (Hoodie + Cap)",
      slug: "team-hoodie-cap-bundle",
      description:
        "Apparel bundle combining heavyweight fleece pullover hoodie and structured 6-panel cap.",
      kitPricePaise: 48000, // ₹480 in paise
      components: [
        {
          id: "comp_hoodie",
          blankSkuId: "BLANK-HOODIE-GREY-XL",
          sku: "BLANK-HOODIE-GREY-XL",
          name: "Pullover Kangaroo Hoodie, Heather Grey, XL",
          quantity: 1,
        },
        {
          id: "comp_cap",
          blankSkuId: "BLANK-CAP-BLACK-OS",
          sku: "BLANK-CAP-BLACK-OS",
          name: "Structured 6-Panel Cotton Twill Cap, Matte Black, OS",
          quantity: 1,
          substituteBlankSkuId: "BLANK-BADGE-GLOSS-58",
          substituteSku: "BLANK-BADGE-GLOSS-58",
          substituteName: "58mm Round Gloss Magnetic Badge",
        },
      ],
    },
  ];

  for (const k of defaults) {
    const kit: KitData = {
      id: k.id,
      name: k.name,
      slug: k.slug,
      description: k.description,
      kitPricePaise: k.kitPricePaise,
      kitPrice: k.kitPricePaise / 100,
      active: true,
      isOutOfStock: false,
      maxFulfillableKits: 100,
      shortageComponents: [],
      components: k.components,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    KITS_STORE.set(kit.id, kit);
    KITS_STORE.set(kit.slug, kit);
  }
}

initializeDefaultKits();

/**
 * Evaluates live availability, shortage detection, and substitute suggestions for a kit.
 */
export async function evaluateKitAvailability(kit: KitData, orderQty: number = 1): Promise<{
  isOutOfStock: boolean;
  maxFulfillableKits: number;
  shortageComponents: ShortageReport[];
}> {
  let minFulfillable = Infinity;
  const shortages: ShortageReport[] = [];

  for (const comp of kit.components) {
    const blank = await getBlankSku(comp.blankSkuId || comp.sku);
    const available = blank ? blank.availableQty : 0;
    const canMake = Math.floor(available / comp.quantity);
    if (canMake < minFulfillable) {
      minFulfillable = canMake;
    }

    const neededTotal = comp.quantity * orderQty;
    if (available < neededTotal) {
      shortages.push({
        componentId: comp.id,
        sku: comp.sku,
        name: comp.name,
        requiredQty: neededTotal,
        availableQty: available,
        shortageQty: neededTotal - available,
        substituteSku: comp.substituteSku,
        substituteName: comp.substituteName,
      });
    }
  }

  const maxFulfillableKits = minFulfillable === Infinity ? 0 : Math.max(0, minFulfillable);
  const isOutOfStock = maxFulfillableKits < orderQty;

  return { isOutOfStock, maxFulfillableKits, shortageComponents: shortages };
}

/**
 * Get all kits with live shortage & stock check.
 */
export async function getAllKits(): Promise<KitData[]> {
  initializeDefaultKits();

  const unique = Array.from(
    new Map(Array.from(KITS_STORE.values()).map((k) => [k.id, k])).values()
  );

  const evaluated: KitData[] = [];
  for (const kit of unique) {
    const status = await evaluateKitAvailability(kit, 1);
    evaluated.push({
      ...kit,
      isOutOfStock: status.isOutOfStock,
      maxFulfillableKits: status.maxFulfillableKits,
      shortageComponents: status.shortageComponents,
    });
  }

  return evaluated;
}

/**
 * Get single kit by id or slug with live evaluation.
 */
export async function getKitBySlugOrId(identifier: string): Promise<KitData | null> {
  initializeDefaultKits();
  const kit = KITS_STORE.get(identifier);
  if (!kit) return null;

  const status = await evaluateKitAvailability(kit, 1);
  return {
    ...kit,
    isOutOfStock: status.isOutOfStock,
    maxFulfillableKits: status.maxFulfillableKits,
    shortageComponents: status.shortageComponents,
  };
}

/**
 * Reserve blanks across ALL components of a kit when an order is paid.
 */
export async function reserveKitForOrder(
  kitSlugOrId: string,
  kitQty: number,
  orderId: string,
  actor: string = "Order Processor"
): Promise<{ success: boolean; error?: string; shortageComponents?: ShortageReport[] }> {
  initializeDefaultKits();
  const kit = KITS_STORE.get(kitSlugOrId);
  if (!kit) return { success: false, error: `Kit '${kitSlugOrId}' not found.` };

  // Check if any component cannot be fulfilled
  const check = await evaluateKitAvailability(kit, kitQty);
  if (check.isOutOfStock) {
    return {
      success: false,
      error: `Kit '${kit.name}' is out of stock. Shortage detected in one or more components.`,
      shortageComponents: check.shortageComponents,
    };
  }

  // Reserve stock for every component
  for (const comp of kit.components) {
    await reserveBlanksForOrder(
      orderId,
      [{ blankSkuId: comp.blankSkuId || comp.sku, qty: comp.quantity * kitQty }],
      actor
    );
  }

  return { success: true };
}

/**
 * Consume blanks across all components when order moves to IN_PRINTING.
 */
export async function consumeKitForOrder(
  kitSlugOrId: string,
  kitQty: number,
  orderId: string,
  actor: string = "Factory Manager"
): Promise<{ success: boolean; error?: string }> {
  initializeDefaultKits();
  const kit = KITS_STORE.get(kitSlugOrId);
  if (!kit) return { success: false, error: `Kit '${kitSlugOrId}' not found.` };

  for (const comp of kit.components) {
    await consumeBlanksForOrder(
      orderId,
      [{ blankSkuId: comp.blankSkuId || comp.sku, qty: comp.quantity * kitQty }],
      actor
    );
  }

  return { success: true };
}

/**
 * Release reserved blanks across all components when order is cancelled.
 */
export async function releaseKitForOrder(
  kitSlugOrId: string,
  kitQty: number,
  orderId: string,
  actor: string = "Cancellation Handler"
): Promise<{ success: boolean; error?: string }> {
  initializeDefaultKits();
  const kit = KITS_STORE.get(kitSlugOrId);
  if (!kit) return { success: false, error: `Kit '${kitSlugOrId}' not found.` };

  for (const comp of kit.components) {
    await releaseBlanksForOrder(
      orderId,
      [{ blankSkuId: comp.blankSkuId || comp.sku, qty: comp.quantity * kitQty }],
      actor
    );
  }

  return { success: true };
}

/**
 * Create or update a Kit definition with audit logging and optimistic concurrency check.
 */
export async function saveKit(
  data: {
    id?: string;
    slug?: string;
    name: string;
    description?: string;
    kitPricePaise: number;
    active?: boolean;
    components: KitComponentItem[];
    expectedVersion?: number;
  },
  actor: { name: string; role: string }
): Promise<{ success: boolean; kit?: KitData; error?: string }> {
  initializeDefaultKits();

  if (!data.name || !data.kitPricePaise || data.components.length === 0) {
    return { success: false, error: "Name, kit price, and at least 1 component are required." };
  }

  const existing = data.id ? KITS_STORE.get(data.id) : null;
  if (existing && data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
    return {
      success: false,
      error: `Conflict: Kit was modified by another user (version ${existing.version}). Please refresh.`,
    };
  }

  const id = existing?.id || data.id || `kit_${crypto.randomUUID()}`;
  const slug = data.slug || existing?.slug || data.name.toLowerCase().replace(/[\s_]+/g, "-");

  const updatedKit: KitData = {
    id,
    name: data.name,
    slug,
    description: data.description || existing?.description || "",
    kitPricePaise: data.kitPricePaise,
    kitPrice: data.kitPricePaise / 100,
    active: data.active !== undefined ? data.active : existing?.active ?? true,
    isOutOfStock: false,
    maxFulfillableKits: 0,
    shortageComponents: [],
    components: data.components,
    version: (existing?.version || 0) + 1,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const status = await evaluateKitAvailability(updatedKit, 1);
  updatedKit.isOutOfStock = status.isOutOfStock;
  updatedKit.maxFulfillableKits = status.maxFulfillableKits;
  updatedKit.shortageComponents = status.shortageComponents;

  KITS_STORE.set(id, updatedKit);
  KITS_STORE.set(slug, updatedKit);

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: existing ? "admin:update_kit" : "admin:create_kit",
    entityType: "Kit",
    entityId: id,
    before: existing ? (existing as unknown as Record<string, unknown>) : null,
    after: updatedKit as unknown as Record<string, unknown>,
  });

  return { success: true, kit: updatedKit };
}
