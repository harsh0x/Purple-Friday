/**
 * Purple Friday - Coupon Management & Race-Safe Redemption Service
 * 
 * Rules:
 * - Code, type (PERCENTAGE or FLAT), value, maxDiscountCap, minSubtotal, firstOrderOnly
 * - Per-user limits, global usage limits, start/end dates, applicable categories
 * - FIRSTORDER (12% with cap and min cart value) works end-to-end
 * - Atomic race-safe redemption to prevent double redemptions
 * - Optimistic concurrency and immutable AuditLog
 */

import { writeAudit } from "@/lib/admin/audit";
import { toPaise, toRupees, roundHalfUp, CouponRule } from "@/server/pricing/engine";

export interface CouponData {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number; // percentage (e.g. 12) or flat paise (e.g. 50000 = ₹500)
  maxDiscountCapPaise?: number; // in paise
  minSubtotalPaise: number; // in paise
  firstOrderOnly: boolean;
  perUserLimit: number;
  totalUsageLimit?: number;
  usageCount: number;
  applicableCategories?: string[];
  startsAt: string;
  expiresAt?: string | null;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponRedemptionRecord {
  id: string;
  couponId: string;
  code: string;
  userId: string;
  orderId: string;
  discountPaise: number;
  redeemedAt: string;
}

// In-Memory stores
const COUPON_STORE = new Map<string, CouponData>();
const REDEMPTIONS_STORE: CouponRedemptionRecord[] = [];

// Lock mutex map to prevent race conditions during redemption
const COUPON_MUTEXES = new Map<string, Promise<void>>();

function initializeDefaultCoupons() {
  if (COUPON_STORE.size > 0) return;

  const defaults: CouponData[] = [
    {
      id: "coup_firstorder",
      code: "FIRSTORDER",
      type: "PERCENTAGE",
      value: 12, // 12% off
      maxDiscountCapPaise: 50000, // ₹500 cap
      minSubtotalPaise: 100000, // ₹1,000 minimum cart value
      firstOrderOnly: true,
      perUserLimit: 1,
      totalUsageLimit: 1000,
      usageCount: 42,
      startsAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-12-31T23:59:59Z",
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "coup_bulk500",
      code: "BULK500",
      type: "FLAT",
      value: 50000, // ₹500 flat in paise
      minSubtotalPaise: 500000, // ₹5,000 minimum cart value
      firstOrderOnly: false,
      perUserLimit: 3,
      totalUsageLimit: 200,
      usageCount: 18,
      startsAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-12-31T23:59:59Z",
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "coup_swagfest",
      code: "SWAGFEST",
      type: "PERCENTAGE",
      value: 15,
      maxDiscountCapPaise: 75000, // ₹750 cap
      minSubtotalPaise: 250000, // ₹2,500 minimum cart value
      firstOrderOnly: false,
      perUserLimit: 2,
      totalUsageLimit: 500,
      usageCount: 65,
      applicableCategories: ["hoodies", "polo-shirts"],
      startsAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-12-31T23:59:59Z",
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const c of defaults) {
    COUPON_STORE.set(c.id, c);
    COUPON_STORE.set(c.code.toUpperCase(), c);
  }
}

initializeDefaultCoupons();

/**
 * Retrieve all coupons with optional filters
 */
export async function getAllCoupons(filters?: {
  activeOnly?: boolean;
  search?: string;
}): Promise<CouponData[]> {
  initializeDefaultCoupons();

  const unique = Array.from(
    new Map(Array.from(COUPON_STORE.values()).map((c) => [c.id, c])).values()
  );

  return unique.filter((c) => {
    if (filters?.activeOnly && !c.active) return false;
    if (filters?.search) {
      const q = filters.search.toUpperCase();
      if (!c.code.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Retrieve coupon by code
 */
export async function getCouponByCode(code: string): Promise<CouponData | null> {
  initializeDefaultCoupons();
  return COUPON_STORE.get(code.trim().toUpperCase()) || null;
}

/**
 * Validates whether a coupon can be applied to a given cart context.
 */
export async function validateCoupon(params: {
  code: string;
  cartSubtotalPaise: number;
  userId?: string;
  isFirstOrder?: boolean;
  cartCategories?: string[];
}): Promise<{
  valid: boolean;
  couponRule?: CouponRule;
  discountPaise: number;
  reason?: string;
}> {
  initializeDefaultCoupons();
  const cleanCode = params.code.trim().toUpperCase();
  const coupon = COUPON_STORE.get(cleanCode);

  if (!coupon || !coupon.active) {
    return { valid: false, discountPaise: 0, reason: "Coupon is invalid or inactive." };
  }

  // 1. Date Checks
  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { valid: false, discountPaise: 0, reason: "Coupon is not yet active." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) {
    return { valid: false, discountPaise: 0, reason: "Coupon has expired." };
  }

  // 2. Minimum Cart Subtotal Check
  if (params.cartSubtotalPaise < coupon.minSubtotalPaise) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum cart value of ₹${toRupees(
        coupon.minSubtotalPaise
      )} required for ${coupon.code}.`,
    };
  }

  // 3. First Order Only Check
  if (coupon.firstOrderOnly && params.isFirstOrder === false) {
    return {
      valid: false,
      discountPaise: 0,
      reason: "This coupon is exclusively valid on your first order.",
    };
  }

  // 4. Global Total Usage Limit
  if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
    return {
      valid: false,
      discountPaise: 0,
      reason: "This coupon has reached its maximum global redemption limit.",
    };
  }

  // 5. Per-User Limit Check
  if (params.userId) {
    const userRedemptions = REDEMPTIONS_STORE.filter(
      (r) => r.couponId === coupon.id && r.userId === params.userId
    ).length;
    if (userRedemptions >= coupon.perUserLimit) {
      return {
        valid: false,
        discountPaise: 0,
        reason: `You have reached the usage limit (${coupon.perUserLimit}) for this coupon.`,
      };
    }
  }

  // 6. Category Applicability Check
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const hasCategory = (params.cartCategories || []).some((c) =>
      coupon.applicableCategories!.includes(c)
    );
    if (!hasCategory) {
      return {
        valid: false,
        discountPaise: 0,
        reason: `Coupon only applies to items in: ${coupon.applicableCategories.join(", ")}.`,
      };
    }
  }

  // 7. Calculate Discount
  let discountPaise = 0;
  if (coupon.type === "PERCENTAGE") {
    discountPaise = roundHalfUp((params.cartSubtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountCapPaise && discountPaise > coupon.maxDiscountCapPaise) {
      discountPaise = coupon.maxDiscountCapPaise;
    }
  } else {
    discountPaise = Math.min(coupon.value, params.cartSubtotalPaise);
  }

  const couponRule: CouponRule = {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscountCapPaise: coupon.maxDiscountCapPaise,
    minSubtotalPaise: coupon.minSubtotalPaise,
    applicableCategories: coupon.applicableCategories,
    firstOrderOnly: coupon.firstOrderOnly,
    active: coupon.active,
    expiresAt: coupon.expiresAt,
  };

  return { valid: true, couponRule, discountPaise };
}

/**
 * Race-Safe Atomic Coupon Redemption inside Order Transaction.
 */
export async function redeemCouponAtomically(params: {
  couponCode: string;
  userId: string;
  orderId: string;
  cartSubtotalPaise: number;
  isFirstOrder?: boolean;
}): Promise<{ success: boolean; discountPaise: number; error?: string }> {
  initializeDefaultCoupons();
  const cleanCode = params.couponCode.trim().toUpperCase();

  // Wait for any concurrent redemption on this coupon code to settle
  while (COUPON_MUTEXES.has(cleanCode)) {
    await COUPON_MUTEXES.get(cleanCode);
  }

  let resolveMutex: () => void = () => {};
  const mutexPromise = new Promise<void>((resolve) => {
    resolveMutex = resolve;
  });
  COUPON_MUTEXES.set(cleanCode, mutexPromise);

  try {
    const validation = await validateCoupon({
      code: cleanCode,
      cartSubtotalPaise: params.cartSubtotalPaise,
      userId: params.userId,
      isFirstOrder: params.isFirstOrder,
    });

    if (!validation.valid) {
      return { success: false, discountPaise: 0, error: validation.reason };
    }

    const coupon = COUPON_STORE.get(cleanCode)!;

    // Check again inside critical section
    if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
      return {
        success: false,
        discountPaise: 0,
        error: "Coupon reached usage limit during concurrent checkout.",
      };
    }

    // Atomically increment usage count & record redemption
    coupon.usageCount += 1;
    coupon.version += 1;
    coupon.updatedAt = new Date().toISOString();

    COUPON_STORE.set(coupon.id, coupon);
    COUPON_STORE.set(coupon.code, coupon);

    const redemption: CouponRedemptionRecord = {
      id: `red_${crypto.randomUUID()}`,
      couponId: coupon.id,
      code: coupon.code,
      userId: params.userId,
      orderId: params.orderId,
      discountPaise: validation.discountPaise,
      redeemedAt: new Date().toISOString(),
    };
    REDEMPTIONS_STORE.push(redemption);

    return { success: true, discountPaise: validation.discountPaise };
  } finally {
    COUPON_MUTEXES.delete(cleanCode);
    resolveMutex();
  }
}

/**
 * Create or Update a Coupon with audit logging.
 */
export async function saveCoupon(
  data: {
    id?: string;
    code: string;
    type: "PERCENTAGE" | "FLAT";
    value: number; // percentage or flat in rupees
    maxDiscountCap?: number; // in rupees
    minSubtotal?: number; // in rupees
    firstOrderOnly?: boolean;
    perUserLimit?: number;
    totalUsageLimit?: number;
    applicableCategories?: string[];
    startsAt?: string;
    expiresAt?: string | null;
    active?: boolean;
    expectedVersion?: number;
  },
  actor: { name: string; role: string }
): Promise<{ success: boolean; coupon?: CouponData; error?: string }> {
  initializeDefaultCoupons();

  const cleanCode = data.code.trim().toUpperCase();
  if (!cleanCode || !data.value) {
    return { success: false, error: "Coupon code and value are required." };
  }

  const existing = data.id ? COUPON_STORE.get(data.id) : COUPON_STORE.get(cleanCode);

  if (existing && data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
    return {
      success: false,
      error: `Conflict: Coupon was modified by another operator (version ${existing.version}). Please refresh.`,
    };
  }

  const id = existing?.id || data.id || `coup_${crypto.randomUUID()}`;
  const valuePaise = data.type === "FLAT" ? toPaise(data.value) : data.value;
  const maxCapPaise = data.maxDiscountCap ? toPaise(data.maxDiscountCap) : undefined;
  const minSubtotalPaise = toPaise(data.minSubtotal || 0);

  const updatedCoupon: CouponData = {
    id,
    code: cleanCode,
    type: data.type,
    value: valuePaise,
    maxDiscountCapPaise: maxCapPaise,
    minSubtotalPaise,
    firstOrderOnly: Boolean(data.firstOrderOnly),
    perUserLimit: data.perUserLimit || 1,
    totalUsageLimit: data.totalUsageLimit,
    usageCount: existing?.usageCount || 0,
    applicableCategories: data.applicableCategories || [],
    startsAt: data.startsAt || existing?.startsAt || new Date().toISOString(),
    expiresAt: data.expiresAt !== undefined ? data.expiresAt : existing?.expiresAt || null,
    active: data.active !== undefined ? data.active : existing?.active ?? true,
    version: (existing?.version || 0) + 1,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  COUPON_STORE.set(id, updatedCoupon);
  COUPON_STORE.set(cleanCode, updatedCoupon);

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: existing ? "admin:update_coupon" : "admin:create_coupon",
    entityType: "Coupon",
    entityId: id,
    before: existing ? (existing as unknown as Record<string, unknown>) : null,
    after: updatedCoupon as unknown as Record<string, unknown>,
  });

  return { success: true, coupon: updatedCoupon };
}

/**
 * Toggle or Delete a Coupon.
 */
export async function toggleCouponActive(
  idOrCode: string,
  actor: { name: string; role: string }
): Promise<{ success: boolean; coupon?: CouponData; error?: string }> {
  initializeDefaultCoupons();
  const coupon = COUPON_STORE.get(idOrCode) || COUPON_STORE.get(idOrCode.toUpperCase());
  if (!coupon) return { success: false, error: "Coupon not found." };

  const wasActive = coupon.active;
  coupon.active = !wasActive;
  coupon.version += 1;
  coupon.updatedAt = new Date().toISOString();

  COUPON_STORE.set(coupon.id, coupon);
  COUPON_STORE.set(coupon.code, coupon);

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: "admin:toggle_coupon",
    entityType: "Coupon",
    entityId: coupon.id,
    after: { active: coupon.active },
  });

  return { success: true, coupon };
}
