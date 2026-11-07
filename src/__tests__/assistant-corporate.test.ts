import { describe, it, expect } from "vitest";
import { generateAssistantReply } from "@/lib/assistant/responder";
import { recommendCorporateKit } from "@/lib/corporate/kits";

describe("Step 3G - Purple Assistant Knowledge Responder", () => {
  it("answers MOQ questions with product minimums and volume savings", async () => {
    const res = await generateAssistantReply("What is the minimum order quantity for badges?");
    expect(res.reply).toContain("Minimum Order Quantity");
    expect(res.reply).toContain("5 pieces");
    expect(res.reply).toContain("tiered volume pricing");
  });

  it("answers turnaround and delivery inquiries with express courier guarantees", async () => {
    const res = await generateAssistantReply("How long does delivery take?");
    expect(res.reply).toContain("24 to 48 hours");
    expect(res.reply).toContain("Delhivery");
    expect(res.reply).toContain("pre-press proof approval");
  });

  it("answers GST input tax credit inquiries with 18% B2B compliance", async () => {
    const res = await generateAssistantReply("Do you provide GST invoice with input tax credit?");
    expect(res.reply).toContain("GST Tax Invoice");
    expect(res.reply).toContain("18% GST Input Tax Credit");
    expect(res.reply).toContain("HSN");
  });

  it("explains digital pre-press proof inspection guarantee", async () => {
    const res = await generateAssistantReply("Can I see a proof before you print my order?");
    expect(res.reply).toContain("Approve Before We Print");
    expect(res.reply).toContain("24 hours");
    expect(res.reply).toContain("zoom loupe");
  });

  it("gracefully falls back to printmaker overview on unclassified questions", async () => {
    const res = await generateAssistantReply("Hello there, what do you do?");
    expect(res.reply).toContain("Purple Friday");
    expect(res.reply).toContain("custom merchandise");
    expect(res.source).toBe("OFFLINE_RULES");
  });
});

describe("Step 3G - Corporate Gifting Budget Planner Engine", () => {
  it("generates a 3-product kit for new joiners within budget", () => {
    const kit = recommendCorporateKit(50, 1200, "new_joiners");
    expect(kit.items.length).toBe(3);
    expect(kit.kitTitle).toContain("Onboarding");
    expect(kit.bulkPricePerKit).toBeLessThanOrEqual(kit.mrpPerKit);
    expect(kit.percentSavings).toBeGreaterThan(0);
    expect(kit.totalTeamInvestment).toBe(kit.bulkPricePerKit * 50);
  });

  it("recommends premium executive suite for VIP clients", () => {
    const kit = recommendCorporateKit(100, 2000, "client_vip");
    expect(kit.items.length).toBe(3);
    expect(kit.kitTitle).toContain("Executive Prestige");
    expect(kit.totalProjectSavings).toBeGreaterThan(0);
  });

  it("unlocks higher volume tier discounts for large runs (250+ units)", () => {
    const smallRun = recommendCorporateKit(50, 1500, "festive");
    const largeRun = recommendCorporateKit(300, 1500, "festive");

    // The unit price per kit for 250+ units should be equal or lower than 50 units
    expect(largeRun.bulkPricePerKit).toBeLessThanOrEqual(smallRun.bulkPricePerKit);
    expect(largeRun.percentSavings).toBeGreaterThanOrEqual(smallRun.percentSavings);
  });
});

