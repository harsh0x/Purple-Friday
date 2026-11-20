/**
 * Purple Friday - Inventory of Blanks & Stock Movements Ledger
 * 
 * Rules:
 * - Raw blank SKUs (e.g. "Polo, Navy, M")
 * - Stock movements ledger: immutable history of every change
 * - Reasons: PURCHASE, ORDER_RESERVATION, PRODUCTION_USE, ADJUSTMENT, RETURN, ORDER_RELEASE
 * - Transactional reservations when order is paid, consumption on IN_PRINTING, release on CANCELLED
 * - Low-stock highlighting (stockOnHand <= reorderLevel)
 * - Audited adjustments with actor and rationale
 */

import { writeAudit } from "@/lib/admin/audit";

export interface BlankSkuData {
  id: string;
  sku: string;
  name: string;
  category: string;
  color?: string;
  size?: string;
  stockOnHand: number;
  reservedQty: number;
  availableQty: number; // stockOnHand - reservedQty
  reorderLevel: number;
  supplierName: string;
  leadTimeDays: number;
  unitCostPaise: number; // in paise
  isLowStock: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementData {
  id: string;
  blankSkuId: string;
  sku: string;
  changeQty: number; // positive or negative
  reason:
  | "PURCHASE"
  | "ORDER_RESERVATION"
  | "PRODUCTION_USE"
  | "ADJUSTMENT"
  | "RETURN"
  | "ORDER_RELEASE";
  balanceAfter: number;
  actor?: string;
  notes?: string;
  referenceId?: string; // Order ID or PO Number
  createdAt: string;
}

// In-Memory stores for resilient execution
export const BLANK_SKU_STORE = new Map<string, BlankSkuData>();
export const MOVEMENT_STORE: StockMovementData[] = [];

function initializeDefaultBlanks() {
  if (BLANK_SKU_STORE.size > 0) return;

  const defaults: Array<Omit<BlankSkuData, "availableQty" | "isLowStock" | "createdAt" | "updatedAt">> = [
    {
      id: "blank_polo_navy_m",
      sku: "BLANK-POLO-NAVY-M",
      name: "Executive Cotton Piqué Polo, Navy, M",
      category: "polo-shirts",
      color: "Navy",
      size: "M",
      stockOnHand: 150,
      reservedQty: 20,
      reorderLevel: 25,
      supplierName: "Apex Merch Mills",
      leadTimeDays: 7,
      unitCostPaise: 21000, // ₹210.00
      version: 1,
    },
    {
      id: "blank_polo_navy_l",
      sku: "BLANK-POLO-NAVY-L",
      name: "Executive Cotton Piqué Polo, Navy, L",
      category: "polo-shirts",
      color: "Navy",
      size: "L",
      stockOnHand: 120,
      reservedQty: 15,
      reorderLevel: 30,
      supplierName: "Apex Merch Mills",
      leadTimeDays: 7,
      unitCostPaise: 21000,
      version: 1,
    },
    {
      id: "blank_tee_black_l",
      sku: "BLANK-TEE-BLACK-L",
      name: "Classic Crewneck Tee (180 GSM), Ink Black, L",
      category: "t-shirts",
      color: "Ink Black",
      size: "L",
      stockOnHand: 450,
      reservedQty: 40,
      reorderLevel: 50,
      supplierName: "Coimbatore Knitting Hub",
      leadTimeDays: 5,
      unitCostPaise: 14000, // ₹140.00
      version: 1,
    },
    {
      id: "blank_hoodie_grey_xl",
      sku: "BLANK-HOODIE-GREY-XL",
      name: "Pullover Kangaroo Hoodie (320 GSM), Heather Grey, XL",
      category: "hoodies",
      color: "Heather Grey",
      size: "XL",
      stockOnHand: 18,
      reservedQty: 5,
      reorderLevel: 20, // Low stock: 18 <= 20
      supplierName: "Tirupur Fleece Works",
      leadTimeDays: 10,
      unitCostPaise: 38000, // ₹380.00
      version: 1,
    },
    {
      id: "blank_badge_gloss_58",
      sku: "BLANK-BADGE-GLOSS-58",
      name: "58mm Round Gloss Magnetic Badge Blanks",
      category: "magnetic-badges",
      color: "Gloss Metallic",
      stockOnHand: 1200,
      reservedQty: 200,
      reorderLevel: 500,
      supplierName: "MagnaFast Components",
      leadTimeDays: 3,
      unitCostPaise: 2500, // ₹25.00
      version: 1,
    },
    {
      id: "blank_cap_black_os",
      sku: "BLANK-CAP-BLACK-OS",
      name: "Structured 6-Panel Cotton Twill Cap, Matte Black, OS",
      category: "caps",
      color: "Matte Black",
      size: "OS",
      stockOnHand: 8,
      reservedQty: 2,
      reorderLevel: 15, // Low stock: 8 <= 15
      supplierName: "Gujarat Headwear Co.",
      leadTimeDays: 6,
      unitCostPaise: 11000, // ₹110.00
      version: 1,
    },
    {
      id: "blank_flask_steel_750",
      sku: "BLANK-FLASK-STEEL-750",
      name: "Double-Wall Insulated Steel Flask 750ml, Matte Black",
      category: "corporate-gifts",
      color: "Matte Black",
      stockOnHand: 65,
      reservedQty: 10,
      reorderLevel: 25,
      supplierName: "SteelCraft India",
      leadTimeDays: 12,
      unitCostPaise: 22000, // ₹220.00
      version: 1,
    },
    {
      id: "blank_pen_metal_ball",
      sku: "BLANK-PEN-METAL-BALL",
      name: "Die-Cast Matte Metal Ballpoint Pen with Brass Core",
      category: "corporate-gifts",
      color: "Matte Black",
      stockOnHand: 500,
      reservedQty: 50,
      reorderLevel: 100,
      supplierName: "Luxe Writing Instruments",
      leadTimeDays: 4,
      unitCostPaise: 4500, // ₹45.00
      version: 1,
    },
    {
      id: "blank_notebook_a5_diary",
      sku: "BLANK-NOTEBOOK-A5-DIARY",
      name: "Hardcover Vegan Leather Executive Journal A5, Ruled",
      category: "corporate-gifts",
      color: "Charcoal",
      size: "A5",
      stockOnHand: 240,
      reservedQty: 30,
      reorderLevel: 50,
      supplierName: "CraftPaper Binding House",
      leadTimeDays: 7,
      unitCostPaise: 16000, // ₹160.00
      version: 1,
    },
  ];

  for (const b of defaults) {
    const availableQty = Math.max(0, b.stockOnHand - b.reservedQty);
    const item: BlankSkuData = {
      ...b,
      availableQty,
      isLowStock: b.stockOnHand <= b.reorderLevel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    BLANK_SKU_STORE.set(item.id, item);
    BLANK_SKU_STORE.set(item.sku, item);

    // Initial purchase movement
    MOVEMENT_STORE.push({
      id: `mov_init_${item.id}`,
      blankSkuId: item.id,
      sku: item.sku,
      changeQty: item.stockOnHand,
      reason: "PURCHASE",
      balanceAfter: item.stockOnHand,
      actor: "System Initializer",
      notes: "Opening balance verified from warehouse physical count",
      createdAt: new Date().toISOString(),
    });
  }
}

initializeDefaultBlanks();

/**
 * Retrieve blank inventory list with search and low-stock filters
 */
export async function getBlankInventory(filters?: {
  category?: string;
  lowStockOnly?: boolean;
  search?: string;
}): Promise<BlankSkuData[]> {
  initializeDefaultBlanks();

  const unique = Array.from(
    new Map(Array.from(BLANK_SKU_STORE.values()).map((b) => [b.id, b])).values()
  );

  return unique.filter((item) => {
    if (filters?.lowStockOnly && !item.isLowStock) return false;
    if (filters?.category && filters.category !== "all") {
      if (item.category !== filters.category) return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Retrieve a specific blank SKU by id or SKU string
 */
export async function getBlankSku(idOrSku: string): Promise<BlankSkuData | null> {
  initializeDefaultBlanks();
  return BLANK_SKU_STORE.get(idOrSku) || null;
}

/**
 * Retrieve stock movement history ledger for a blank SKU
 */
export async function getStockMovements(blankSkuId?: string): Promise<StockMovementData[]> {
  initializeDefaultBlanks();
  if (blankSkuId) {
    return MOVEMENT_STORE.filter(
      (m) => m.blankSkuId === blankSkuId || m.sku === blankSkuId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return [...MOVEMENT_STORE].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Quick stock adjustment with audit trail and immutable movement record.
 */
export async function adjustStock(params: {
  skuId: string;
  newStockOnHand?: number;
  delta?: number;
  reason: "PURCHASE" | "ADJUSTMENT" | "RETURN";
  notes?: string;
  expectedVersion?: number;
  actor: { name: string; role: string; ip?: string };
}): Promise<{ success: boolean; item?: BlankSkuData; error?: string }> {
  initializeDefaultBlanks();

  const item = BLANK_SKU_STORE.get(params.skuId);
  if (!item) {
    return { success: false, error: `Blank SKU '${params.skuId}' not found.` };
  }

  // Optimistic concurrency check
  if (params.expectedVersion !== undefined && item.version !== params.expectedVersion) {
    return {
      success: false,
      error: `Conflict: Inventory was modified by another operator (version ${item.version}). Please refresh.`,
    };
  }

  let finalStock = item.stockOnHand;
  let changeQty = 0;

  if (params.newStockOnHand !== undefined) {
    changeQty = params.newStockOnHand - item.stockOnHand;
    finalStock = Math.max(0, params.newStockOnHand);
  } else if (params.delta !== undefined) {
    changeQty = params.delta;
    finalStock = Math.max(0, item.stockOnHand + params.delta);
  }

  const beforeStock = item.stockOnHand;
  item.stockOnHand = finalStock;
  item.availableQty = Math.max(0, finalStock - item.reservedQty);
  item.isLowStock = item.stockOnHand <= item.reorderLevel;
  item.version += 1;
  item.updatedAt = new Date().toISOString();

  BLANK_SKU_STORE.set(item.id, item);
  BLANK_SKU_STORE.set(item.sku, item);

  // Record movement ledger
  const movement: StockMovementData = {
    id: `mov_${crypto.randomUUID()}`,
    blankSkuId: item.id,
    sku: item.sku,
    changeQty,
    reason: params.reason,
    balanceAfter: finalStock,
    actor: params.actor.name,
    notes: params.notes || `Stock adjusted from ${beforeStock} to ${finalStock}`,
    createdAt: new Date().toISOString(),
  };
  MOVEMENT_STORE.unshift(movement);

  // Write immutable AuditLog
  await writeAudit({
    actor: params.actor.name,
    actorRole: params.actor.role,
    action: "admin:adjust_inventory",
    entityType: "BlankSku",
    entityId: item.id,
    before: { stockOnHand: beforeStock, version: item.version - 1 },
    after: { stockOnHand: finalStock, version: item.version, reason: params.reason },
    metadata: { notes: params.notes },
  });

  return { success: true, item };
}

/**
 * Reservation: Reserve blank SKUs when an order is paid.
 */
export async function reserveBlanksForOrder(
  orderId: string,
  items: Array<{ blankSkuId?: string; productSlug?: string; qty: number }>,
  actorName: string = "Order Processor"
): Promise<{ success: boolean; reservedCount: number; shortageWarnings: string[] }> {
  initializeDefaultBlanks();

  let reservedCount = 0;
  const shortageWarnings: string[] = [];

  for (const it of items) {
    // Resolve blank SKU either directly or by fuzzy matching productSlug
    let blank = it.blankSkuId ? BLANK_SKU_STORE.get(it.blankSkuId) : null;
    if (!blank && it.productSlug) {
      blank = findBlankForProduct(it.productSlug);
    }

    if (!blank) continue;

    // Check availability
    if (blank.availableQty < it.qty) {
      shortageWarnings.push(
        `Shortage on ${blank.sku}: Needed ${it.qty}, only ${blank.availableQty} available.`
      );
    }

    blank.reservedQty += it.qty;
    blank.availableQty = Math.max(0, blank.stockOnHand - blank.reservedQty);
    blank.version += 1;
    blank.updatedAt = new Date().toISOString();

    BLANK_SKU_STORE.set(blank.id, blank);
    BLANK_SKU_STORE.set(blank.sku, blank);

    // Record reservation ledger row
    MOVEMENT_STORE.unshift({
      id: `mov_res_${crypto.randomUUID()}`,
      blankSkuId: blank.id,
      sku: blank.sku,
      changeQty: -it.qty, // Earmarked from available
      reason: "ORDER_RESERVATION",
      balanceAfter: blank.stockOnHand,
      actor: actorName,
      referenceId: orderId,
      notes: `Reserved ${it.qty} pcs for Order ${orderId}`,
      createdAt: new Date().toISOString(),
    });

    reservedCount += it.qty;
  }

  return { success: true, reservedCount, shortageWarnings };
}

/**
 * Consumption: Consumes reserved blanks when order moves to IN_PRINTING.
 */
export async function consumeBlanksForOrder(
  orderId: string,
  items: Array<{ blankSkuId?: string; productSlug?: string; qty: number }>,
  actorName: string = "Factory Manager"
): Promise<{ success: boolean; consumedCount: number }> {
  initializeDefaultBlanks();

  let consumedCount = 0;

  for (const it of items) {
    let blank = it.blankSkuId ? BLANK_SKU_STORE.get(it.blankSkuId) : null;
    if (!blank && it.productSlug) {
      blank = findBlankForProduct(it.productSlug);
    }

    if (!blank) continue;

    // Deduct both reservation and physical stock on hand
    blank.reservedQty = Math.max(0, blank.reservedQty - it.qty);
    blank.stockOnHand = Math.max(0, blank.stockOnHand - it.qty);
    blank.availableQty = Math.max(0, blank.stockOnHand - blank.reservedQty);
    blank.isLowStock = blank.stockOnHand <= blank.reorderLevel;
    blank.version += 1;
    blank.updatedAt = new Date().toISOString();

    BLANK_SKU_STORE.set(blank.id, blank);
    BLANK_SKU_STORE.set(blank.sku, blank);

    // Record production consumption row
    MOVEMENT_STORE.unshift({
      id: `mov_use_${crypto.randomUUID()}`,
      blankSkuId: blank.id,
      sku: blank.sku,
      changeQty: -it.qty,
      reason: "PRODUCTION_USE",
      balanceAfter: blank.stockOnHand,
      actor: actorName,
      referenceId: orderId,
      notes: `Consumed into printing floor for Order ${orderId}`,
      createdAt: new Date().toISOString(),
    });

    consumedCount += it.qty;
  }

  return { success: true, consumedCount };
}

/**
 * Release: Releases reserved blanks when an order is cancelled.
 */
export async function releaseBlanksForOrder(
  orderId: string,
  items: Array<{ blankSkuId?: string; productSlug?: string; qty: number }>,
  actorName: string = "Order Cancellation Handler"
): Promise<{ success: boolean; releasedCount: number }> {
  initializeDefaultBlanks();

  let releasedCount = 0;

  for (const it of items) {
    let blank = it.blankSkuId ? BLANK_SKU_STORE.get(it.blankSkuId) : null;
    if (!blank && it.productSlug) {
      blank = findBlankForProduct(it.productSlug);
    }

    if (!blank) continue;

    blank.reservedQty = Math.max(0, blank.reservedQty - it.qty);
    blank.availableQty = Math.max(0, blank.stockOnHand - blank.reservedQty);
    blank.version += 1;
    blank.updatedAt = new Date().toISOString();

    BLANK_SKU_STORE.set(blank.id, blank);
    BLANK_SKU_STORE.set(blank.sku, blank);

    MOVEMENT_STORE.unshift({
      id: `mov_rel_${crypto.randomUUID()}`,
      blankSkuId: blank.id,
      sku: blank.sku,
      changeQty: it.qty, // Restored to available pool
      reason: "ORDER_RELEASE",
      balanceAfter: blank.stockOnHand,
      actor: actorName,
      referenceId: orderId,
      notes: `Released reservation due to cancellation of Order ${orderId}`,
      createdAt: new Date().toISOString(),
    });

    releasedCount += it.qty;
  }

  return { success: true, releasedCount };
}

/**
 * Helper to match product slug to representative blank SKU
 */
function findBlankForProduct(productSlug: string): BlankSkuData | null {
  const norm = productSlug.toLowerCase();
  if (norm.includes("polo")) return BLANK_SKU_STORE.get("blank_polo_navy_m") || null;
  if (norm.includes("tee") || norm.includes("tshirt")) return BLANK_SKU_STORE.get("blank_tee_black_l") || null;
  if (norm.includes("hoodie")) return BLANK_SKU_STORE.get("blank_hoodie_grey_xl") || null;
  if (norm.includes("badge")) return BLANK_SKU_STORE.get("blank_badge_gloss_58") || null;
  if (norm.includes("cap")) return BLANK_SKU_STORE.get("blank_cap_black_os") || null;
  if (norm.includes("flask") || norm.includes("bottle")) return BLANK_SKU_STORE.get("blank_flask_steel_750") || null;
  if (norm.includes("pen")) return BLANK_SKU_STORE.get("blank_pen_metal_ball") || null;
  if (norm.includes("notebook") || norm.includes("diary")) return BLANK_SKU_STORE.get("blank_notebook_a5_diary") || null;
  return null;
}
