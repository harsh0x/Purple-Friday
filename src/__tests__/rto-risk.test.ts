import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreRtoRisk,
  isSuspiciousAddress,
  recordDeliveredOrder,
  recordRtoOrder,
  overrideOrderRtoRisk,
  PIN_STATS_STORE,
  PHONE_HISTORY_STORE,
  RiskOrderInput,
} from "@/server/risk/rto";
import { DEFAULT_RTO_RISK_SETTINGS } from "@/lib/admin/app-settings";

describe("RTO Risk Scoring Engine (Pure Tested Module)", () => {
  const baseOrder: RiskOrderInput = {
    customerName: "Aarav Sharma",
    customerPhone: "9876543210",
    customerEmail: "aarav@example.com",
    shippingAddress: {
      line1: "Flat 402, Prestige Palms, 12th Main Road, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pin: "560038",
    },
    billingAddress: {
      state: "Karnataka",
    },
    paymentMethod: "COD",
    totalPaise: 250000, // Rs 2,500
  };

  beforeEach(() => {
    PIN_STATS_STORE.clear();
    PHONE_HISTORY_STORE.clear();
  });

  it("assigns 0 risk points and allows COD for a clean, verified address and order profile", () => {
    const result = scoreRtoRisk(baseOrder, DEFAULT_RTO_RISK_SETTINGS, {
      customerDeliveredCount: 2,
    });

    expect(result.score).toBe(0);
    expect(result.isRisky).toBe(false);
    expect(result.recommendedPayment).toBe("ALLOW_COD");
    expect(result.customerExplanation).toBeUndefined();
    expect(result.reasons).toHaveLength(0);
  });

  describe("Rule 1: High PIN Code Historic RTO Rate", () => {
    it("flags PIN codes with > 20% historic RTO rate with +30 points", () => {
      // 3 RTOs out of 10 = 30% RTO rate
      const pinStats = {
        pincode: "560038",
        deliveredCount: 7,
        rtoCount: 3,
        totalOrders: 10,
        rtoRate: 0.3,
      };

      const result = scoreRtoRisk(baseOrder, DEFAULT_RTO_RISK_SETTINGS, {
        pinStats,
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(30);
      expect(result.reasons.some((r) => r.includes("high courier return rate"))).toBe(true);
    });

    it("ignores PIN codes with low sample sizes (< 5 orders) even if RTO occurred", () => {
      const pinStats = {
        pincode: "560038",
        deliveredCount: 2,
        rtoCount: 1,
        totalOrders: 3,
        rtoRate: 0.33,
      };

      const result = scoreRtoRisk(baseOrder, DEFAULT_RTO_RISK_SETTINGS, {
        pinStats,
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(0);
    });
  });

  describe("Rule 2: Phone Number Previous RTO History", () => {
    it("flags phone numbers with previous failed / returned COD orders with +35 points", () => {
      const result = scoreRtoRisk(baseOrder, DEFAULT_RTO_RISK_SETTINGS, {
        previousPhoneRto: true,
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(35);
      expect(result.reasons.some((r) => r.includes("previous unaccepted / returned"))).toBe(true);
    });
  });

  describe("Rule 3: Multi-Name Identity Abuse", () => {
    it("flags phone number or address associated with 3 or more distinct names with +20 points", () => {
      const result = scoreRtoRisk(baseOrder, DEFAULT_RTO_RISK_SETTINGS, {
        phoneNamesCount: 3,
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(20);
      expect(result.reasons.some((r) => r.includes("Multiple customer names"))).toBe(true);
    });
  });

  describe("Rule 4: Incomplete or Suspicious Address", () => {
    it("detects address lines that are too short (< 12 chars)", () => {
      expect(isSuspiciousAddress("Main St").suspicious).toBe(true);
    });

    it("detects repeated character sequences (e.g. 'aaaaa' or '11111')", () => {
      expect(isSuspiciousAddress("House aaaaa, 2nd Cross, Whitefield").suspicious).toBe(true);
    });

    it("detects test/placeholder keyboard mashing", () => {
      expect(isSuspiciousAddress("asdfghjkl near test building").suspicious).toBe(true);
    });

    it("accepts valid Indian residential or commercial addresses", () => {
      expect(
        isSuspiciousAddress("Plot 24, Cyber Park, Electronic City Phase 1").suspicious
      ).toBe(false);
    });

    it("adds +25 points when address is incomplete", () => {
      const suspiciousOrder: RiskOrderInput = {
        ...baseOrder,
        shippingAddress: {
          ...baseOrder.shippingAddress,
          line1: "Near temple", // Too short and no number
        },
      };

      const result = scoreRtoRisk(suspiciousOrder, DEFAULT_RTO_RISK_SETTINGS, {
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(25);
    });
  });

  describe("Rule 5: Billing vs Shipping State Mismatch on COD", () => {
    it("flags COD orders where shipping state differs from billing state with +15 points", () => {
      const mismatchOrder: RiskOrderInput = {
        ...baseOrder,
        shippingAddress: {
          ...baseOrder.shippingAddress,
          state: "Maharashtra",
        },
        billingAddress: {
          state: "Karnataka",
        },
      };

      const result = scoreRtoRisk(mismatchOrder, DEFAULT_RTO_RISK_SETTINGS, {
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(15);
      expect(result.reasons.some((r) => r.includes("State mismatch"))).toBe(true);
    });

    it("does not flag prepaid orders with state mismatches", () => {
      const prepaidOrder: RiskOrderInput = {
        ...baseOrder,
        paymentMethod: "PREPAID",
        shippingAddress: {
          ...baseOrder.shippingAddress,
          state: "Maharashtra",
        },
        billingAddress: {
          state: "Karnataka",
        },
      };

      const result = scoreRtoRisk(prepaidOrder, DEFAULT_RTO_RISK_SETTINGS, {
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(0);
    });
  });

  describe("Rule 6: High COD Basket Value for First-Time Customer", () => {
    it("flags first-time COD order >= Rs 5,000 (500,000 paise) with +20 points", () => {
      const highValOrder: RiskOrderInput = {
        ...baseOrder,
        totalPaise: 750000, // Rs 7,500
      };

      const result = scoreRtoRisk(highValOrder, DEFAULT_RTO_RISK_SETTINGS, {
        customerDeliveredCount: 0, // First time
      });

      expect(result.score).toBe(20);
      expect(result.reasons.some((r) => r.includes("High COD basket value"))).toBe(true);
    });

    it("does not flag repeat customers with high COD values", () => {
      const highValOrder: RiskOrderInput = {
        ...baseOrder,
        totalPaise: 750000,
      };

      const result = scoreRtoRisk(highValOrder, DEFAULT_RTO_RISK_SETTINGS, {
        customerDeliveredCount: 3, // Repeat customer with 3 delivered orders
      });

      expect(result.score).toBe(0);
    });
  });

  describe("Threshold Edges & Combined Risk", () => {
    it("allows COD when score is exactly 49 points (below threshold 50)", () => {
      // 30 (PIN) + 15 (state mismatch) + 4 (custom) = 49
      const customSettings = {
        ...DEFAULT_RTO_RISK_SETTINGS,
        threshold: 50,
        pinRtoWeight: 34,
        stateMismatchWeight: 15,
      };

      const mismatchOrder: RiskOrderInput = {
        ...baseOrder,
        shippingAddress: { ...baseOrder.shippingAddress, state: "Delhi" },
        billingAddress: { state: "Karnataka" },
      };

      const pinStats = {
        pincode: "560038",
        deliveredCount: 7,
        rtoCount: 3,
        totalOrders: 10,
        rtoRate: 0.3,
      };

      const result = scoreRtoRisk(mismatchOrder, customSettings, {
        pinStats,
        customerDeliveredCount: 1,
      });

      expect(result.score).toBe(49);
      expect(result.isRisky).toBe(false);
      expect(result.recommendedPayment).toBe("ALLOW_COD");
      expect(result.customerExplanation).toBeUndefined();
    });

    it("strictly disables COD and shows polite reason when score is exactly 50 (at threshold)", () => {
      // 30 (PIN) + 20 (high COD first time) = 50
      const pinStats = {
        pincode: "560038",
        deliveredCount: 7,
        rtoCount: 3,
        totalOrders: 10,
        rtoRate: 0.3,
      };

      const highValOrder: RiskOrderInput = {
        ...baseOrder,
        totalPaise: 600000, // Rs 6,000
      };

      const result = scoreRtoRisk(highValOrder, DEFAULT_RTO_RISK_SETTINGS, {
        pinStats,
        customerDeliveredCount: 0,
      });

      expect(result.score).toBe(50);
      expect(result.isRisky).toBe(true);
      expect(result.recommendedPayment).toBe("PREPAID_ONLY");
      expect(result.customerExplanation).toContain("Cash on Delivery is unavailable");
    });

    it("disables COD when score is 55 (35 phone RTO + 20 high COD)", () => {
      const highValOrder: RiskOrderInput = {
        ...baseOrder,
        totalPaise: 600000,
      };

      const result = scoreRtoRisk(highValOrder, DEFAULT_RTO_RISK_SETTINGS, {
        previousPhoneRto: true,
        customerDeliveredCount: 0,
      });

      expect(result.score).toBe(55);
      expect(result.isRisky).toBe(true);
      expect(result.recommendedPayment).toBe("PREPAID_ONLY");
    });
  });

  describe("PinStats & Phone History Tracking", () => {
    it("updates PinStats and Phone history upon delivered and RTO events", async () => {
      await recordDeliveredOrder("560038", "9876543210", "Aarav Sharma");
      expect(PIN_STATS_STORE.get("560038")?.deliveredCount).toBe(1);
      expect(PIN_STATS_STORE.get("560038")?.rtoRate).toBe(0);

      await recordRtoOrder("560038", "9876543210", "Aarav Sharma");
      expect(PIN_STATS_STORE.get("560038")?.rtoCount).toBe(1);
      expect(PIN_STATS_STORE.get("560038")?.totalOrders).toBe(2);
      expect(PIN_STATS_STORE.get("560038")?.rtoRate).toBe(0.5);

      expect(PHONE_HISTORY_STORE.get("9876543210")?.rtoCount).toBe(1);
    });
  });

  describe("Staff Override", () => {
    it("records written justification audit log for overriding RTO risk", async () => {
      const res = await overrideOrderRtoRisk({
        orderNumber: "PF-2611-40891",
        actor: "staff@purplefriday.in",
        actorRole: "SUPER_ADMIN",
        reason: "Customer verified via phone call, corporate purchase order on file.",
      });

      expect(res.success).toBe(true);
      expect(res.orderNumber).toBe("PF-2611-40891");
      expect(res.overrideReason).toContain("corporate purchase order on file");
    });

    it("rejects blank or short override reasons", async () => {
      await expect(
        overrideOrderRtoRisk({
          orderNumber: "PF-2611-40891",
          actor: "staff@purplefriday.in",
          actorRole: "SUPER_ADMIN",
          reason: "ok",
        })
      ).rejects.toThrow("valid written justification reason is required");
    });
  });
});
