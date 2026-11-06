import { describe, it, expect } from "vitest";

interface PriceTier {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

function resolveActiveTier(tiers: PriceTier[], qty: number): PriceTier | undefined {
  return tiers.find((t) => {
    if (t.maxQty === null) return qty >= t.minQty;
    return qty >= t.minQty && qty <= t.maxQty;
  });
}

function computeUpsellNudge(tiers: PriceTier[], currentQty: number) {
  const activeIndex = tiers.findIndex((t) => {
    if (t.maxQty === null) return currentQty >= t.minQty;
    return currentQty >= t.minQty && currentQty <= t.maxQty;
  });

  if (activeIndex === -1 || activeIndex >= tiers.length - 1) {
    return null; // Already at highest tier or invalid
  }

  const currentTier = tiers[activeIndex];
  const nextTier = tiers[activeIndex + 1];
  const piecesNeeded = nextTier.minQty - currentQty;
  const savingPerPiece = currentTier.unitPrice - nextTier.unitPrice;

  return {
    nextTierQty: nextTier.minQty,
    piecesNeeded,
    savingPerPiece,
    nextUnitPrice: nextTier.unitPrice,
  };
}

describe("Product Tier Grid & Upsell Nudge Logic", () => {
  const sampleTiers: PriceTier[] = [
    { minQty: 10, maxQty: 49, unitPrice: 85 },
    { minQty: 50, maxQty: 99, unitPrice: 65 },
    { minQty: 100, maxQty: 249, unitPrice: 52 },
    { minQty: 250, maxQty: null, unitPrice: 42 },
  ];

  it("accurately identifies Tier 0 for base minQty", () => {
    const tier = resolveActiveTier(sampleTiers, 10);
    expect(tier).toBeDefined();
    expect(tier?.unitPrice).toBe(85);
  });

  it("accurately transitions to Tier 1 when quantity is 50", () => {
    const tier = resolveActiveTier(sampleTiers, 50);
    expect(tier?.unitPrice).toBe(65);
  });

  it("accurately identifies highest Tier 3 for bulk 300 units", () => {
    const tier = resolveActiveTier(sampleTiers, 300);
    expect(tier?.unitPrice).toBe(42);
    expect(tier?.maxQty).toBeNull();
  });

  it("calculates 'Make it N' nudge when at 15 pieces", () => {
    const nudge = computeUpsellNudge(sampleTiers, 15);
    expect(nudge).not.toBeNull();
    expect(nudge?.piecesNeeded).toBe(35); // 50 - 15
    expect(nudge?.savingPerPiece).toBe(20); // 85 - 65
    expect(nudge?.nextTierQty).toBe(50);
    expect(nudge?.nextUnitPrice).toBe(65);
  });

  it("calculates 'Make it N' nudge when at 80 pieces", () => {
    const nudge = computeUpsellNudge(sampleTiers, 80);
    expect(nudge).not.toBeNull();
    expect(nudge?.piecesNeeded).toBe(20); // 100 - 80
    expect(nudge?.savingPerPiece).toBe(13); // 65 - 52
    expect(nudge?.nextTierQty).toBe(100);
  });

  it("returns null for upsell nudge when at maximum tier (250+)", () => {
    const nudge = computeUpsellNudge(sampleTiers, 250);
    expect(nudge).toBeNull();
  });
});
