import { describe, it, expect } from "vitest";
import {
  computeBlankSkuForecast,
  generateSupplierPoCsv,
} from "@/server/inventory/forecasting";

describe("Part 5: Raw Material Forecasting & Reorder Point", () => {
  it("computes 4-week and 8-week moving velocities and reorder alerts", () => {
    const forecast = computeBlankSkuForecast({
      sku: "BLK-HD-BLK-L",
      name: "380 GSM Heavyweight Hoodie Blank Black L",
      category: "Hoodies",
      stockOnHand: 45, // Low stock
      reservedQty: 10,
      reorderLevel: 50,
      supplierName: "Tirupur Knit Mills Ltd",
      leadTimeDays: 7,
      orders: [],
      unitCostPaise: 38000,
      targetMonth: 10, // October (Diwali multiplier = 2.2)
    });

    expect(forecast.availableStock).toBe(35); // 45 - 10
    expect(forecast.currentSeasonalMultiplier).toBe(2.2);
    expect(forecast.needsReorder).toBe(true);
    expect(forecast.suggestedReorderQty).toBeGreaterThan(0);
    expect(forecast.stockRunoutDays).toBeGreaterThan(0);
  });

  it("exports supplier PO CSV safely", () => {
    const mockForecast = computeBlankSkuForecast({
      sku: "BLK-TEE-WHT-M",
      name: "240 GSM Terry Tee Blank White M",
      category: "T-Shirts",
      stockOnHand: 20,
      reservedQty: 0,
      reorderLevel: 60,
      supplierName: "Surat Mills",
      leadTimeDays: 7,
      unitCostPaise: 18000,
    });

    const csv = generateSupplierPoCsv([mockForecast]);
    expect(csv).toContain("Supplier Purchase Order");
    expect(csv).toContain("BLK-TEE-WHT-M");
    expect(csv).toContain("Surat Mills");
    expect(csv).toContain("PO Suggested Qty");
  });
});