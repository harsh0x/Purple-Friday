import prisma from "@/lib/prisma";
import { RtoRiskSettings, DEFAULT_RTO_RISK_SETTINGS } from "@/lib/admin/app-settings";
import { writeAudit } from "@/lib/admin/audit";

export interface RiskOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
  };
  billingAddress?: {
    state?: string;
  };
  paymentMethod: "COD" | "PREPAID" | "RAZORPAY" | string;
  totalPaise: number;
}

export interface RiskEvaluationResult {
  score: number;
  threshold: number;
  isRisky: boolean;
  reasons: string[];
  customerExplanation?: string;
  recommendedPayment: "ALLOW_COD" | "PREPAID_ONLY";
}

export interface StoredPinStat {
  pincode: string;
  deliveredCount: number;
  rtoCount: number;
  totalOrders: number;
  rtoRate: number;
}

// In-memory fallback for PinStats & order phone history
export const PIN_STATS_STORE = new Map<string, StoredPinStat>();
export const PHONE_HISTORY_STORE = new Map<
  string,
  { rtoCount: number; deliveredCount: number; namesUsed: Set<string> }
>();
export const ADDRESS_HISTORY_STORE = new Map<string, Set<string>>(); // normalized address -> Set of names

/**
 * Record a completed delivery for a pincode and phone.
 */
export async function recordDeliveredOrder(pincode: string, phone: string, name: string) {
  const normPin = pincode.trim();
  const current = PIN_STATS_STORE.get(normPin) || {
    pincode: normPin,
    deliveredCount: 0,
    rtoCount: 0,
    totalOrders: 0,
    rtoRate: 0,
  };

  current.deliveredCount += 1;
  current.totalOrders += 1;
  current.rtoRate = current.rtoCount / current.totalOrders;
  PIN_STATS_STORE.set(normPin, current);

  // Phone history
  const normPhone = phone.trim();
  const phoneHist = PHONE_HISTORY_STORE.get(normPhone) || {
    rtoCount: 0,
    deliveredCount: 0,
    namesUsed: new Set<string>(),
  };
  phoneHist.deliveredCount += 1;
  phoneHist.namesUsed.add(name.trim().toLowerCase());
  PHONE_HISTORY_STORE.set(normPhone, phoneHist);

  // DB Sync if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.pinStats.upsert({
        where: { pincode: normPin },
        update: {
          deliveredCount: current.deliveredCount,
          totalOrders: current.totalOrders,
          rtoRate: current.rtoRate,
        },
        create: {
          pincode: normPin,
          deliveredCount: current.deliveredCount,
          rtoCount: current.rtoCount,
          totalOrders: current.totalOrders,
          rtoRate: current.rtoRate,
        },
      });
    }
  } catch {
    // Memory fallback
  }
}

/**
 * Record a Return-to-Origin (RTO) for a pincode and phone.
 */
export async function recordRtoOrder(pincode: string, phone: string, name: string) {
  const normPin = pincode.trim();
  const current = PIN_STATS_STORE.get(normPin) || {
    pincode: normPin,
    deliveredCount: 0,
    rtoCount: 0,
    totalOrders: 0,
    rtoRate: 0,
  };

  current.rtoCount += 1;
  current.totalOrders += 1;
  current.rtoRate = current.rtoCount / current.totalOrders;
  PIN_STATS_STORE.set(normPin, current);

  // Phone history
  const normPhone = phone.trim();
  const phoneHist = PHONE_HISTORY_STORE.get(normPhone) || {
    rtoCount: 0,
    deliveredCount: 0,
    namesUsed: new Set<string>(),
  };
  phoneHist.rtoCount += 1;
  phoneHist.namesUsed.add(name.trim().toLowerCase());
  PHONE_HISTORY_STORE.set(normPhone, phoneHist);

  // DB Sync if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.pinStats.upsert({
        where: { pincode: normPin },
        update: {
          rtoCount: current.rtoCount,
          totalOrders: current.totalOrders,
          rtoRate: current.rtoRate,
        },
        create: {
          pincode: normPin,
          deliveredCount: current.deliveredCount,
          rtoCount: current.rtoCount,
          totalOrders: current.totalOrders,
          rtoRate: current.rtoRate,
        },
      });
    }
  } catch {
    // Memory fallback
  }
}

/**
 * Normalizes an address string for anomaly detection.
 */
function normalizeAddressKey(addr: { line1: string; city: string; pin: string }): string {
  return `${addr.line1.toLowerCase().replace(/[^a-z0-9]/g, "")}_${addr.city.toLowerCase()}_${addr.pin}`;
}

/**
 * Checks whether an address line looks incomplete, gibberish, or suspicious.
 */
export function isSuspiciousAddress(addressLine: string): { suspicious: boolean; reason?: string } {
  const clean = (addressLine || "").trim();

  // 1. Minimum meaningful length check (< 12 characters is suspicious for an Indian address)
  if (clean.length < 12) {
    return { suspicious: true, reason: "Address is too brief (missing street, landmark, or house number)" };
  }

  // 2. Repeated character patterns (e.g. "aaaaa", "111111", "xxxx")
  if (/(.)\1{4,}/i.test(clean)) {
    return { suspicious: true, reason: "Address contains repeated character sequences" };
  }

  // 3. Gibberish keyboard mashing check
  const lower = clean.toLowerCase();
  const mashWords = ["asdf", "qwer", "zxcv", "test", "dummy", "na na", "xyz"];
  if (mashWords.some((m) => lower.includes(m))) {
    return { suspicious: true, reason: "Address appears to contain placeholder or test text" };
  }

  // 4. No digits (most Indian addresses require at least a house/flat/building/floor number)
  if (!/\d/.test(clean) && !lower.includes("floor") && !lower.includes("near") && !lower.includes("cross")) {
    return { suspicious: true, reason: "Address missing house, building, or premise number" };
  }

  return { suspicious: false };
}

/**
 * Pure RTO Risk Scoring Engine.
 * Evaluates risk points based on courier delivery reliability and order characteristics.
 */
export function scoreRtoRisk(
  order: RiskOrderInput,
  settings: RtoRiskSettings = DEFAULT_RTO_RISK_SETTINGS,
  context?: {
    pinStats?: StoredPinStat;
    previousPhoneRto?: boolean;
    phoneNamesCount?: number;
    addressNamesCount?: number;
    customerDeliveredCount?: number;
  }
): RiskEvaluationResult {
  let score = 0;
  const reasons: string[] = [];

  const pin = order.shippingAddress.pin.trim();
  const phone = order.customerPhone.trim();
  const addrKey = normalizeAddressKey(order.shippingAddress);

  // 1. PIN Code Historic RTO Rate Check
  const pinData = context?.pinStats || PIN_STATS_STORE.get(pin);
  if (pinData && pinData.totalOrders >= 5) {
    if (pinData.rtoRate >= settings.pinRtoRateThreshold) {
      score += settings.pinRtoWeight;
      const ratePct = Math.round(pinData.rtoRate * 100);
      reasons.push(`PIN ${pin} has high courier return rate (${ratePct}% RTO over ${pinData.totalOrders} shipments).`);
    }
  }

  // 2. Phone Number RTO History
  const hasPhoneRto =
    context?.previousPhoneRto ??
    Boolean(PHONE_HISTORY_STORE.get(phone)?.rtoCount && PHONE_HISTORY_STORE.get(phone)!.rtoCount > 0);
  if (hasPhoneRto) {
    score += settings.phoneRtoWeight;
    reasons.push("Phone number has previous unaccepted / returned COD orders.");
  }

  // 3. Multi-Name Identity Abuse (same phone or address with 3+ different names)
  const phoneNames = context?.phoneNamesCount ?? (PHONE_HISTORY_STORE.get(phone)?.namesUsed.size || 1);
  const addrNames = context?.addressNamesCount ?? (ADDRESS_HISTORY_STORE.get(addrKey)?.size || 1);

  if (phoneNames >= 3 || addrNames >= 3) {
    score += settings.multiNameWeight;
    reasons.push("Multiple customer names associated with this contact number or physical address.");
  }

  // 4. Incomplete or Suspicious Address
  const addrCheck = isSuspiciousAddress(order.shippingAddress.line1);
  if (addrCheck.suspicious) {
    score += settings.suspiciousAddressWeight;
    reasons.push(addrCheck.reason || "Delivery address appears incomplete or invalid.");
  }

  // 5. Billing vs Shipping State Mismatch on COD
  if (order.paymentMethod === "COD" && order.billingAddress?.state) {
    const shipState = order.shippingAddress.state.trim().toLowerCase();
    const billState = order.billingAddress.state.trim().toLowerCase();
    if (shipState !== billState) {
      score += settings.stateMismatchWeight;
      reasons.push(`State mismatch: Delivery state (${order.shippingAddress.state}) differs from billing state (${order.billingAddress.state}).`);
    }
  }

  // 6. High COD Order Value for First-Time Customer
  const isFirstTime = (context?.customerDeliveredCount ?? (PHONE_HISTORY_STORE.get(phone)?.deliveredCount || 0)) === 0;
  if (order.paymentMethod === "COD" && isFirstTime && order.totalPaise >= settings.highCodThresholdPaise) {
    score += settings.highCodWeight;
    const rupeeAmount = Math.round(order.totalPaise / 100);
    reasons.push(`High COD basket value (Rs ${rupeeAmount}) for an unverified first-time customer.`);
  }

  const isRisky = score >= settings.threshold;

  let customerExplanation: string | undefined = undefined;
  if (isRisky) {
    customerExplanation = "Prepaid only for this address: Cash on Delivery is unavailable for this delivery address or order profile. Please complete payment online via UPI, NetBanking, or Card.";
  }

  return {
    score,
    threshold: settings.threshold,
    isRisky,
    reasons,
    customerExplanation,
    recommendedPayment: isRisky ? "PREPAID_ONLY" : "ALLOW_COD",
  };
}

/**
 * Staff manual override of RTO risk for an order.
 */
export async function overrideOrderRtoRisk(params: {
  orderNumber: string;
  actor: string;
  actorRole: string;
  reason: string;
}) {
  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error("A valid written justification reason is required to override RTO risk.");
  }

  // Sync to database if available
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.order.update({
        where: { orderNumber: params.orderNumber },
        data: {
          rtoRiskOverrideReason: params.reason,
          rtoRiskOverriddenBy: params.actor,
          isPrepaidOnly: false,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "risk.override_rto",
    entityType: "ORDER",
    entityId: params.orderNumber,
    after: {
      overrideReason: params.reason,
      overriddenBy: params.actor,
      unlockedPayment: "COD_ALLOWED",
    },
  });

  return { success: true, orderNumber: params.orderNumber, overrideReason: params.reason };
}
