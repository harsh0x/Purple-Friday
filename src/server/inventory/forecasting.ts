import { StoredOrderRecord } from "@/server/orders/state-machine";
import { createNotification } from "@/lib/admin/notifications";
import { safeCsvCell } from "@/lib/security/csv";

export interface MonthlySeasonalIndex {
  month: number; // 1 to 12
  name: string;
  multiplier: number; // e.g. 1.0 baseline, 2.2 for Diwali in Oct/Nov, 1.8 for New Year in Dec/Jan, 2.0 for April onboarding
  notes: string;
}

export const DEFAULT_SEASONAL_INDICES: MonthlySeasonalIndex[] = [
  { month: 1, name: "January", multiplier: 1.6, notes: "New Year swag restock & annual kickoffs" },
  { month: 2, name: "February", multiplier: 1.0, notes: "Baseline corporate run" },
  { month: 3, name: "March", multiplier: 1.2, notes: "Fiscal year-end budget utilization" },
  { month: 4, name: "April", multiplier: 2.0, notes: "Corporate new fiscal year & fresher onboarding rush" },
  { month: 5, name: "May", multiplier: 1.1, notes: "Summer corporate offsites" },
  { month: 6, name: "June", multiplier: 1.0, notes: "Mid-year baseline" },
  { month: 7, name: "July", multiplier: 1.0, notes: "Monsoon baseline" },
  { month: 8, name: "August", multiplier: 1.2, notes: "Independence Day & early festive prep" },
  { month: 9, name: "September", multiplier: 1.5, notes: "Pre-festive corporate gifting procurement" },
  { month: 10, name: "October", multiplier: 2.2, notes: "Diwali peak gifting & milestone celebrations" },
  { month: 11, name: "November", multiplier: 2.0, notes: "Post-Diwali & corporate annual day celebrations" },
  { month: 12, name: "December", multiplier: 1.8, notes: "Christmas, New Year corporate gifting hampers" },
];

export const BLANK_SKU_REGISTRY = [
  {
    sku: "BLK-HD-BLK-L",
    name: "380 GSM Heavyweight Hoodie Blank Black L",
    category: "Hoodies",
    stockOnHand: 150,
    reservedQty: 20,
    reorderLevel: 50,
    supplierName: "Tirupur Knit Mills Ltd",
    leadTimeDays: 7,
    unitCostPaise: 38000,
  },
  {
    sku: "BLK-HD-BLK-M",
    name: "380 GSM Heavyweight Hoodie Blank Black M",
    category: "Hoodies",
    stockOnHand: 120,
    reservedQty: 15,
    reorderLevel: 50,
    supplierName: "Tirupur Knit Mills Ltd",
    leadTimeDays: 7,
    unitCostPaise: 38000,
  },
  {
    sku: "BLK-TEE-WHT-L",
    name: "240 GSM Terry Tee Blank White L",
    category: "T-Shirts",
    stockOnHand: 450,
    reservedQty: 40,
    reorderLevel: 80,
    supplierName: "Surat Textile Mills",
    leadTimeDays: 7,
    unitCostPaise: 18000,
  },
  {
    sku: "BLK-TEE-BLK-L",
    name: "240 GSM Terry Tee Blank Black L",
    category: "T-Shirts",
    stockOnHand: 40,
    reservedQty: 30,
    reorderLevel: 80,
    supplierName: "Surat Textile Mills",
    leadTimeDays: 7,
    unitCostPaise: 18000,
  },
  {
    sku: "BLK-FLK-MTE-500",
    name: "Insulated Matte Steel Tumbler 500ml",
    category: "Drinkware",
    stockOnHand: 80,
    reservedQty: 10,
    reorderLevel: 40,
    supplierName: "Apex Merch Impex",
    leadTimeDays: 10,
    unitCostPaise: 28000,
  },
  {
    sku: "BLK-TOT-CAN-12",
    name: "Heavyweight 12oz Canvas Tote Bag",
    category: "Corporate Accessories",
    stockOnHand: 25,
    reservedQty: 15,
    reorderLevel: 60,
    supplierName: "EcoKnit India",
    leadTimeDays: 5,
    unitCostPaise: 12000,
  },
];

export interface BlankSkuForecast {
  sku: string;
  name: string;
  category: string;
  stockOnHand: number;
  reservedQty: number;
  availableStock: number;
  reorderLevel: number;
  supplierName: string;
  leadTimeDays: number;
  weeklyVelocity4w: number; // 4-week moving average units/week
  weeklyVelocity8w: number; // 8-week moving average units/week
  currentSeasonalMultiplier: number;
  leadTimeDemandUnits: number; // Expected units demanded during supplier lead time
  safetyStockUnits: number;
  reorderPointUnits: number; // Lead time demand + safety stock
  suggestedReorderQty: number;
  needsReorder: boolean;
  stockRunoutDays: number;
  unitCostPaise: number;
}

/**
 * Pure function: Computes Weekly Moving Average Velocity and Lead-time Demand Forecast.
 */
export function computeBlankSkuForecast(params: {
  sku: string;
  name: string;
  category: string;
  stockOnHand: number;
  reservedQty: number;
  reorderLevel: number;
  supplierName: string;
  leadTimeDays: number;
  unitCostPaise?: number;
  historicalOrders?: StoredOrderRecord[];
  orders?: StoredOrderRecord[];
  seasonalIndices?: MonthlySeasonalIndex[];
  targetMonth?: number;
  currentDate?: Date;
}): BlankSkuForecast {
  const now = params.currentDate || new Date();
  const nowMs = now.getTime();
  const currentMonth = params.targetMonth || now.getMonth() + 1; // 1 to 12
  const ONE_DAY_MS = 24 * 3600 * 1000;
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;

  const indices = params.seasonalIndices || DEFAULT_SEASONAL_INDICES;
  const seasonalIdx = indices.find((idx) => idx.month === currentMonth);
  const currentSeasonalMultiplier = seasonalIdx ? seasonalIdx.multiplier : 1.0;

  // 1. Calculate historical sales for this SKU in past 4 weeks and past 8 weeks
  let unitsPast4w = 0;
  let unitsPast8w = 0;

  const fourWeeksAgoMs = nowMs - 4 * ONE_WEEK_MS;
  const eightWeeksAgoMs = nowMs - 8 * ONE_WEEK_MS;

  const orderList = params.historicalOrders || params.orders || [];

  for (const o of orderList) {
    if (o.status === "CANCELLED" || o.status === "RTO") continue;
    const orderMs = new Date(o.createdAt).getTime();

    for (const it of o.items || []) {
      // Match by title/category keyword or SKU
      const itRec = it as Record<string, unknown>;
      const itTitle = ((itRec.title || itRec.name || "") as string).toLowerCase();
      const skuLower = params.sku.toLowerCase();
      const matches =
        itRec.sku === params.sku ||
        (skuLower.includes("polo") && itTitle.includes("polo")) ||
        (skuLower.includes("hoodie") && itTitle.includes("hoodie")) ||
        (skuLower.includes("tee") && (itTitle.includes("tee") || itTitle.includes("t-shirt"))) ||
        (skuLower.includes("flask") && (itTitle.includes("flask") || itTitle.includes("tumbler"))) ||
        (skuLower.includes("badge") && (itTitle.includes("badge") || itTitle.includes("pin"))) ||
        (skuLower.includes("kit") && (itTitle.includes("kit") || itTitle.includes("pack")));

      if (matches) {
        if (orderMs >= fourWeeksAgoMs && orderMs <= nowMs) {
          unitsPast4w += it.qty;
        }
        if (orderMs >= eightWeeksAgoMs && orderMs <= nowMs) {
          unitsPast8w += it.qty;
        }
      }
    }
  }

  // Fallback realistic baseline if fresh instance
  if (unitsPast4w === 0 && unitsPast8w === 0) {
    unitsPast4w = 20;
    unitsPast8w = 40;
  }

  const weeklyVelocity4w = Math.round((unitsPast4w / 4) * 10) / 10;
  const weeklyVelocity8w = Math.round((unitsPast8w / 8) * 10) / 10;

  // Effective velocity weighted 60% toward 4-week trend + 40% toward 8-week trend
  const blendedWeeklyVelocity = weeklyVelocity4w * 0.6 + weeklyVelocity8w * 0.4;
  const dailyVelocity = (blendedWeeklyVelocity / 7) * currentSeasonalMultiplier;

  // 2. Projected Demand over supplier lead time
  const leadTimeDemandUnits = Math.round(dailyVelocity * params.leadTimeDays);

  // 3. Safety Stock: 7 days of seasonal demand buffer
  const safetyStockUnits = Math.max(10, Math.round(dailyVelocity * 7));

  // 4. Reorder Point: Lead time demand + safety stock (or static reorderLevel if higher)
  const dynamicReorderPoint = leadTimeDemandUnits + safetyStockUnits;
  const reorderPointUnits = Math.max(params.reorderLevel || 0, dynamicReorderPoint);

  const availableStock = Math.max(0, params.stockOnHand - params.reservedQty);
  const needsReorder = availableStock <= reorderPointUnits;

  // Suggested reorder batch: bring stock back to 30 days of coverage
  const targetCoverageUnits = Math.round(dailyVelocity * 30);
  const suggestedReorderQty = needsReorder ? Math.max(25, targetCoverageUnits - availableStock) : 0;

  // Stock runout days
  const stockRunoutDays = dailyVelocity > 0 ? Math.round(availableStock / dailyVelocity) : 999;

  return {
    sku: params.sku,
    name: params.name,
    category: params.category,
    stockOnHand: params.stockOnHand,
    reservedQty: params.reservedQty,
    availableStock,
    reorderLevel: params.reorderLevel,
    supplierName: params.supplierName,
    leadTimeDays: params.leadTimeDays,
    weeklyVelocity4w,
    weeklyVelocity8w,
    currentSeasonalMultiplier,
    leadTimeDemandUnits,
    safetyStockUnits,
    reorderPointUnits,
    suggestedReorderQty,
    needsReorder,
    stockRunoutDays,
    unitCostPaise: params.unitCostPaise || 18000,
  };
}

/**
 * Checks for low raw material stock and dispatches alerts to Factory Manager and Super Admin.
 */
export async function triggerLowStockForecastingAlerts(
  forecasts?: BlankSkuForecast[]
): Promise<{ alertsCount: number }> {
  const items =
    forecasts ||
    BLANK_SKU_REGISTRY.map((sku) =>
      computeBlankSkuForecast({
        ...sku,
        historicalOrders: [],
      })
    );

  const criticalItems = items.filter((f) => f.needsReorder);
  if (criticalItems.length === 0) return { alertsCount: 0 };

  const skuList = criticalItems
    .slice(0, 3)
    .map((f) => `${f.name} (${f.availableStock} left, reorder at ${f.reorderPointUnits})`)
    .join(", ");

  await createNotification({
    userOrRole: "role:FACTORY_MANAGER",
    title: `Raw Material Reorder Alert: ${criticalItems.length} SKUs below threshold`,
    body: `Critical blanks needing supplier PO: ${skuList}. Lead time coverage is running low.`,
    link: "/admin/forecasting",
  });

  await createNotification({
    userOrRole: "role:SUPER_ADMIN",
    title: `Inventory Forecast Alert: ${criticalItems.length} SKUs require procurement`,
    body: `Estimated reorder PO cost: Rs ${Math.round(
      criticalItems.reduce((sum, f) => sum + (f.suggestedReorderQty * f.unitCostPaise) / 100, 0)
    )}.`,
    link: "/admin/forecasting",
  });

  return { alertsCount: criticalItems.length };
}

/**
 * Generates clean supplier Purchase Order CSV export with formula injection sanitization.
 */
export function generateSupplierPoCsv(forecasts: BlankSkuForecast[]): string {
  const reorderItems = forecasts.filter((f) => f.needsReorder || f.suggestedReorderQty > 0);
  const title = "# Supplier Purchase Order - Purple Friday Raw Material Forecasting\r\n";
  const header = "SKU,Raw Material Name,Category,Supplier,Lead Time Days,Available Stock,Reorder Point,PO Suggested Qty,Estimated Cost (INR)\r\n";

  const rows = reorderItems.map((item) => {
    const estimatedCostInr = Math.round((item.suggestedReorderQty * item.unitCostPaise) / 100);
    return [
      safeCsvCell(item.sku),
      safeCsvCell(item.name),
      safeCsvCell(item.category),
      safeCsvCell(item.supplierName),
      safeCsvCell(item.leadTimeDays),
      safeCsvCell(item.availableStock),
      safeCsvCell(item.reorderPointUnits),
      safeCsvCell(item.suggestedReorderQty),
      safeCsvCell(estimatedCostInr),
    ].join(",");
  });

  return title + header + rows.join("\r\n");
}
