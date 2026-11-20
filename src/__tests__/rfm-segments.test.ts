import { describe, it, expect } from "vitest";
import {
  assignQuintileScores,
  classifyRfmSegment,
  computeRfmCustomerProfiles,
  generateReorderNudgeDraft,
} from "@/server/analytics/rfm";
import { StoredOrderRecord } from "@/server/orders/state-machine";

describe("Part 5: RFM Scoring & Reorder Nudges", () => {
  it("assigns quintiles 1 to 5 accurately across distribution", () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const scores = assignQuintileScores(values, false);

    expect(scores.length).toBe(10);
    expect(scores[0]).toBe(1); // lowest rank
    expect(scores[9]).toBe(5); // highest rank
  });

  it("classifies customer segments based on RFM coordinates", () => {
    expect(classifyRfmSegment(5, 5, 5, 200, 5)).toBe("VIP Corporate Buyers");
    expect(classifyRfmSegment(4, 5, 4, 150, 4)).toBe("VIP Corporate Buyers");
    expect(classifyRfmSegment(1, 4, 4, 100, 3)).toBe("At-Risk Repeat Clients");
    expect(classifyRfmSegment(4, 1, 1, 2, 1)).toBe("One-Time Sample Buyers");
    expect(classifyRfmSegment(5, 1, 3, 20, 1)).toBe("New Customers");
    expect(classifyRfmSegment(1, 1, 1, 20, 1)).toBe("Lapsed");
  });

  it("calculates customer reorder gaps and flags reorder due", () => {
    const now = Date.now();
    const day = 86400000;

    const pastOrder1: StoredOrderRecord = {
      id: "o1",
      orderNumber: "PF-1",
      version: 1,
      status: "DELIVERED",
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      subtotal: 65000,
      discount: 0,
      shipping: 0,
      gst: 0,
      totalPausedDurationMs: 0,
      total: 65000,
      address: { customerName: "Flipkart", email: "procurement@flipkart.com", companyName: "Flipkart" },
      items: [{ id: "i1", productId: "p1", options: {}, qty: 100, unitPrice: 650 }],
      nudgeCount: 0,
      createdAt: new Date(now - 120 * day).toISOString(),
      updatedAt: new Date(now - 120 * day).toISOString(),
      events: [],
    };

    const pastOrder2: StoredOrderRecord = {
      ...pastOrder1,
      id: "o2",
      orderNumber: "PF-2",
      createdAt: new Date(now - 80 * day).toISOString(), // 40-day gap
      updatedAt: new Date(now - 80 * day).toISOString(),
    };

    // Customer last ordered 80 days ago; typical gap is 40 days -> overdue!
    const profiles = computeRfmCustomerProfiles([pastOrder1, pastOrder2]);
    expect(profiles.length).toBe(1);
    const p = profiles[0];
    expect(p.isOverdueForReorder).toBe(true);
    expect(p.daysOverdueForReorder).toBeGreaterThan(0);
  });

  it("generates personalized WhatsApp and Email draft messages with safety guard", () => {
    const draft = generateReorderNudgeDraft({
      customerName: "Sanjay Verma",
      companyName: "Infosys Bangalore",
      lastOrderNumber: "PF-2026-101",
      daysSinceLastOrder: 92,
      averageGapDays: 60,
    });

    expect(draft.emailSubject).toContain("Infosys Bangalore");
    expect(draft.emailBody).toContain("Sanjay");
    expect(draft.emailBody).toContain("92 days");
    expect(draft.whatsappText).toContain("WhatsApp");
  });
});