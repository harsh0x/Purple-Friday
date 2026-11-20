import { describe, it, expect } from "vitest";
import {
  getAllCoupons,
  getCouponByCode,
  validateCoupon,
  saveCoupon,
  redeemCouponAtomically,
} from "@/server/coupons/coupon-service";

describe("Coupon Management - FIRSTORDER End-to-End Rules", () => {
  it("lists all seeded promo campaigns", async () => {
    const list = await getAllCoupons();
    expect(list.length).toBeGreaterThanOrEqual(3);
  });

  it("validates FIRSTORDER coupon (12% off with ₹500 cap and ₹1,000 min cart)", async () => {
    const coupon = await getCouponByCode("FIRSTORDER");
    expect(coupon).not.toBeNull();
    expect(coupon?.value).toBe(12);
    expect(coupon?.maxDiscountCapPaise).toBe(50000); // ₹500
    expect(coupon?.minSubtotalPaise).toBe(100000); // ₹1,000

    // Cart of ₹2,000 (200,000 paise) -> 12% is ₹240 (24,000 paise)
    const res1 = await validateCoupon({
      code: "FIRSTORDER",
      cartSubtotalPaise: 200000,
      isFirstOrder: true,
      userId: "user_test_1",
    });
    expect(res1.valid).toBe(true);
    expect(res1.discountPaise).toBe(24000);

    // Cart of ₹10,000 (1,000,000 paise) -> 12% is ₹1,200, capped at ₹500 (50,000 paise)
    const res2 = await validateCoupon({
      code: "FIRSTORDER",
      cartSubtotalPaise: 1000000,
      isFirstOrder: true,
      userId: "user_test_2",
    });
    expect(res2.valid).toBe(true);
    expect(res2.discountPaise).toBe(50000); // Capped!
  });

  it("rejects FIRSTORDER if cart subtotal is below ₹1,000 minimum", async () => {
    const res = await validateCoupon({
      code: "FIRSTORDER",
      cartSubtotalPaise: 80000, // ₹800
      isFirstOrder: true,
      userId: "user_test_3",
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("Minimum cart value of ₹1000 required");
  });

  it("rejects FIRSTORDER if customer is not a first-time buyer", async () => {
    const res = await validateCoupon({
      code: "FIRSTORDER",
      cartSubtotalPaise: 200000,
      isFirstOrder: false, // Returning customer!
      userId: "user_returning",
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("exclusively valid on your first order");
  });
});

describe("Coupon Management - Category Targeting & Flat Discounts", () => {
  it("enforces category applicability (SWAGFEST applies only to hoodies & polos)", async () => {
    // Cart with only caps: rejected
    const res1 = await validateCoupon({
      code: "SWAGFEST",
      cartSubtotalPaise: 300000,
      cartCategories: ["caps"],
    });
    expect(res1.valid).toBe(false);
    expect(res1.reason).toContain("Coupon only applies to items in: hoodies, polo-shirts");

    // Cart with hoodies: accepted (15% off)
    const res2 = await validateCoupon({
      code: "SWAGFEST",
      cartSubtotalPaise: 300000,
      cartCategories: ["hoodies"],
    });
    expect(res2.valid).toBe(true);
    expect(res2.discountPaise).toBe(45000); // 15% of 300,000 = 45,000
  });

  it("applies flat discount (BULK500 = ₹500 flat)", async () => {
    const res = await validateCoupon({
      code: "BULK500",
      cartSubtotalPaise: 600000, // ₹6,000
    });
    expect(res.valid).toBe(true);
    expect(res.discountPaise).toBe(50000); // ₹500 flat
  });
});

describe("Coupon Management - Atomic Race-Safe Redemption", () => {
  it("safely redeems coupon atomically inside order transaction and enforces quota", async () => {
    // Create a special limited coupon with quota of 2
    const created = await saveCoupon(
      {
        code: "FLASHQUOTA",
        type: "PERCENTAGE",
        value: 20,
        minSubtotal: 500,
        totalUsageLimit: 2, // Only 2 redemptions globally!
        perUserLimit: 1,
      },
      { name: "Super Admin", role: "SUPER_ADMIN" }
    );
    expect(created.success).toBe(true);

    // Order 1: Success
    const r1 = await redeemCouponAtomically({
      couponCode: "FLASHQUOTA",
      userId: "cust_1",
      orderId: "ord_101",
      cartSubtotalPaise: 100000,
      isFirstOrder: true,
    });
    expect(r1.success).toBe(true);
    expect(r1.discountPaise).toBe(20000);

    // Order 2: Success
    const r2 = await redeemCouponAtomically({
      couponCode: "FLASHQUOTA",
      userId: "cust_2",
      orderId: "ord_102",
      cartSubtotalPaise: 100000,
      isFirstOrder: true,
    });
    expect(r2.success).toBe(true);

    // Order 3: Should be rejected because quota of 2 is exhausted!
    const r3 = await redeemCouponAtomically({
      couponCode: "FLASHQUOTA",
      userId: "cust_3",
      orderId: "ord_103",
      cartSubtotalPaise: 100000,
      isFirstOrder: true,
    });
    expect(r3.success).toBe(false);
    expect(r3.error).toContain("maximum global redemption limit");

    // Repeat attempt by same user: should be rejected by perUserLimit
    const rDuplicate = await redeemCouponAtomically({
      couponCode: "FIRSTORDER",
      userId: "cust_repeat",
      orderId: "ord_dup_1",
      cartSubtotalPaise: 200000,
      isFirstOrder: true,
    });
    expect(rDuplicate.success).toBe(true);

    const rSecondAttempt = await redeemCouponAtomically({
      couponCode: "FIRSTORDER",
      userId: "cust_repeat", // Same user!
      orderId: "ord_dup_2",
      cartSubtotalPaise: 200000,
      isFirstOrder: true,
    });
    expect(rSecondAttempt.success).toBe(false);
    expect(rSecondAttempt.error).toContain("usage limit");
  });
});
