import { describe, it, expect } from "vitest";
import { sanitizeCsvCell, exportOrdersToCsv } from "@/lib/security/csv";
import { validatePriceTiers, isUserAdmin } from "@/lib/admin/tier-validator";
import { StoredOrder } from "@/lib/orders";

describe("Admin Security - CSV Injection Sanitization (Formula Protection)", () => {
  it("prefixes cells starting with formula triggers with a single quote", () => {
    // Formula attacks via =, +, -, @, \t, \r
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(sanitizeCsvCell("-2+3*cmd")).toBe("'-2+3*cmd");
    expect(sanitizeCsvCell("@SUM(1+1)")).toBe("'@SUM(1+1)");
    expect(sanitizeCsvCell("\t=1+1")).toBe("'\t=1+1");
  });

  it("leaves benign alphanumeric strings and numbers unmodified", () => {
    expect(sanitizeCsvCell("Vikram Sharma")).toBe("Vikram Sharma");
    expect(sanitizeCsvCell("PF-2611-12345")).toBe("PF-2611-12345");
    expect(sanitizeCsvCell(2450)).toBe("2450");
  });

  it("escapes inner quotes and commas properly", () => {
    expect(sanitizeCsvCell('Tech "Park" Main, Bengaluru')).toBe('"Tech ""Park"" Main, Bengaluru"');
  });

  it("exports orders table into clean CSV without formula injection risks", () => {
    const mockOrder: StoredOrder = {
      id: "ord_1",
      orderNumber: "=PF-2611-99999", // Malicious formula attempt in order number
      customerName: "+BadActor", // Malicious formula attempt in customer name
      customerEmail: "actor@malicious.com",
      customerPhone: "9876543210",
      shippingAddress: {
        line1: "123 Street",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
      },
      items: [
        {
          productId: "p1",
          productName: "Tee",
          template: "tee",
          unitPrice: 200,
          qty: 10,
          lineTotal: 2000,
        },
      ],
      subtotal: 2000,
      discount: 0,
      shipping: 0,
      gst: 360,
      total: 2360,
      status: "PAID",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const csv = exportOrdersToCsv([mockOrder]);
    expect(csv).toContain("Order Number");
    expect(csv).toContain("'=PF-2611-99999");
    expect(csv).toContain("'+BadActor");
  });
});

describe("Admin Tier Pricing - Live Contiguity & Descending Price Validator", () => {
  it("accepts valid, contiguous, strictly decreasing volume pricing tiers", () => {
    const validTiers = [
      { minQty: 10, maxQty: 49, unitPrice: 250 },
      { minQty: 50, maxQty: 99, unitPrice: 210 },
      { minQty: 100, maxQty: 249, unitPrice: 180 },
      { minQty: 250, maxQty: null, unitPrice: 150 },
    ];

    const result = validatePriceTiers(validTiers);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("rejects non-contiguous quantity gaps between tiers", () => {
    // Gap: Tier 1 ends at 49, Tier 2 starts at 55 (missing 50-54)
    const gappedTiers = [
      { minQty: 10, maxQty: 49, unitPrice: 250 },
      { minQty: 55, maxQty: 99, unitPrice: 210 },
      { minQty: 100, maxQty: null, unitPrice: 180 },
    ];

    const result = validatePriceTiers(gappedTiers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Non-contiguous"))).toBe(true);
  });

  it("rejects overlapping quantity ranges between tiers", () => {
    // Overlap: Tier 1 ends at 50, Tier 2 starts at 45
    const overlappingTiers = [
      { minQty: 10, maxQty: 50, unitPrice: 250 },
      { minQty: 45, maxQty: 99, unitPrice: 210 },
      { minQty: 100, maxQty: null, unitPrice: 180 },
    ];

    const result = validatePriceTiers(overlappingTiers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Non-contiguous"))).toBe(true);
  });

  it("rejects non-decreasing unit prices (price increases with volume)", () => {
    // Error: Tier 2 is more expensive than Tier 1
    const increasingTiers = [
      { minQty: 10, maxQty: 49, unitPrice: 200 },
      { minQty: 50, maxQty: 99, unitPrice: 220 }, // Bad: 220 > 200
      { minQty: 100, maxQty: null, unitPrice: 180 },
    ];

    const result = validatePriceTiers(increasingTiers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("strictly decrease"))).toBe(true);
  });

  it("requires final tier to have maxQty === null", () => {
    const closedTiers = [
      { minQty: 10, maxQty: 49, unitPrice: 200 },
      { minQty: 50, maxQty: 100, unitPrice: 180 }, // Should be null
    ];

    const result = validatePriceTiers(closedTiers);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("open-ended"))).toBe(true);
  });
});

describe("Admin Role Guard Authorization", () => {
  it("allows access for verified ADMIN users", () => {
    expect(isUserAdmin({ role: "ADMIN" })).toBe(true);
    expect(isUserAdmin({ role: "admin" })).toBe(true);
  });

  it("denies access for standard CUSTOMER users or guests", () => {
    expect(isUserAdmin({ role: "CUSTOMER" })).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin(undefined)).toBe(false);
  });
});

