import prisma from "@/lib/prisma";
import { getCodSettings } from "@/lib/admin/app-settings";
import { scoreRtoRisk, RiskOrderInput } from "@/server/risk/rto";
import { roundHalfUp, toPaise, toRupees } from "@/server/pricing/engine";
import { writeAudit } from "@/lib/admin/audit";
import { ORDER_STORE } from "@/server/orders/state-machine";

export interface CodEligibilityResult {
  eligible: boolean;
  reason?: string;
  advancePaise: number;
  balanceDuePaise: number;
  advancePercent: number;
  rtoScore?: number;
  isPrepaidOnly?: boolean;
}

/**
 * Validates whether an order is eligible for Partial COD on the server.
 * Evaluates:
 * 1. Global COD enabled setting
 * 2. Maximum COD order value
 * 3. RTO Risk Engine score
 */
export async function validateCodEligibility(
  order: RiskOrderInput,
  overridden: boolean = false
): Promise<CodEligibilityResult> {
  const codSettings = await getCodSettings();

  if (!codSettings.enabled) {
    return {
      eligible: false,
      reason: "Cash on Delivery is currently disabled by store policy.",
      advancePaise: 0,
      balanceDuePaise: order.totalPaise,
      advancePercent: 0,
    };
  }

  if (order.totalPaise > codSettings.maxCodValuePaise) {
    const maxRupees = Math.round(codSettings.maxCodValuePaise / 100);
    return {
      eligible: false,
      reason: `Cash on Delivery is only available for orders up to Rs ${maxRupees}. Please choose online prepaid.`,
      advancePaise: 0,
      balanceDuePaise: order.totalPaise,
      advancePercent: 0,
    };
  }

  // Evaluate RTO risk unless explicitly overridden by staff
  if (!overridden) {
    const risk = scoreRtoRisk(order);
    if (risk.isRisky) {
      return {
        eligible: false,
        reason: risk.customerExplanation || "Prepaid only for this delivery address.",
        advancePaise: 0,
        balanceDuePaise: order.totalPaise,
        advancePercent: 0,
        rtoScore: risk.score,
        isPrepaidOnly: true,
      };
    }
  }

  const advancePercent = codSettings.advancePercent;
  const advancePaise = roundHalfUp((order.totalPaise * advancePercent) / 100);
  const balanceDuePaise = order.totalPaise - advancePaise;

  return {
    eligible: true,
    advancePaise,
    balanceDuePaise,
    advancePercent,
  };
}

/**
 * Process verified COD advance payment from Razorpay webhook.
 * Idempotent: safe to run multiple times with the same eventId or paymentId.
 */
export async function processCodAdvancePayment(params: {
  orderNumber: string;
  paymentId: string;
  amountPaise: number;
  eventId?: string;
}) {
  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error(`Order ${params.orderNumber} not found.`);
  }

  // Idempotency: if already advance paid or paid with this paymentId
  if (
    order.paymentStatus === "ADVANCE_PAID" ||
    order.paymentStatus === "PAID"
  ) {
    return {
      success: true,
      duplicate: true,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      advancePaidPaise: order.advancePaidPaise ?? params.amountPaise,
      balanceDuePaise: order.balanceDuePaise ?? 0,
    };
  }

  const totalPaise = toPaise(order.total);

  // Update order record
  order.paymentStatus = "ADVANCE_PAID";
  order.advancePaidPaise = params.amountPaise;
  order.balanceDuePaise = Math.max(0, totalPaise - params.amountPaise);
  order.updatedAt = new Date().toISOString();

  // Add order event
  if (!order.events) order.events = [];
  order.events.push({
    id: `evt_${Date.now()}`,
    type: "PAYMENT_ADVANCE_VERIFIED",
    status: order.status,
    actor: "system@razorpay.webhook",
    actorRole: "SYSTEM",
    message: `Partial COD advance of Rs ${toRupees(params.amountPaise)} verified online. Balance due on delivery: Rs ${toRupees(order.balanceDuePaise)}.`,
    createdAt: new Date().toISOString(),
  });

  // DB Sync if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.order.update({
        where: { orderNumber: order.orderNumber },
        data: {
          paymentStatus: "ADVANCE_PAID",
          advancePaidPaise: params.amountPaise,
          balanceDuePaise: order.balanceDuePaise,
          razorpayPaymentId: params.paymentId,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  await writeAudit({
    actor: "system@razorpay.webhook",
    actorRole: "SYSTEM",
    action: "payment.cod_advance_captured",
    entityType: "ORDER",
    entityId: order.orderNumber,
    after: {
      paymentStatus: "ADVANCE_PAID",
      advancePaidPaise: params.amountPaise,
      balanceDuePaise: order.balanceDuePaise,
      paymentId: params.paymentId,
    },
  });

  return {
    success: true,
    duplicate: false,
    orderNumber: order.orderNumber,
    paymentStatus: "ADVANCE_PAID",
    advancePaidPaise: params.amountPaise,
    balanceDuePaise: order.balanceDuePaise,
  };
}

/**
 * Staff manual action: Mark remaining COD balance as collected upon courier settlement.
 * Audited and permission-guarded.
 */
export async function markCodBalanceCollected(params: {
  orderNumber: string;
  actor: string;
  actorRole: string;
  notes?: string;
}) {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "FACTORY_MANAGER", "SUPPORT_AGENT"];
  if (!allowedRoles.includes(params.actorRole)) {
    throw new Error(`Role ${params.actorRole} is not authorized to collect COD balance.`);
  }

  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error(`Order ${params.orderNumber} not found.`);
  }

  const previousBalance = order.balanceDuePaise ?? 0;
  const previousStatus = order.paymentStatus;

  order.paymentStatus = "PAID";
  order.balanceDuePaise = 0;
  order.balanceCollectedAt = new Date().toISOString();
  order.balanceCollectedBy = params.actor;
  order.updatedAt = new Date().toISOString();

  if (!order.events) order.events = [];
  order.events.push({
    id: `evt_${Date.now()}`,
    type: "PAYMENT_BALANCE_COLLECTED",
    status: order.status,
    actor: params.actor,
    actorRole: params.actorRole,
    message: `COD balance of Rs ${toRupees(previousBalance)} marked as collected by courier (${params.notes || "Courier cash settlement verified"}).`,
    createdAt: new Date().toISOString(),
  });

  // DB Sync if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.order.update({
        where: { orderNumber: order.orderNumber },
        data: {
          paymentStatus: "PAID",
          balanceDuePaise: 0,
          balanceCollectedAt: new Date(),
          balanceCollectedBy: params.actor,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "payment.cod_balance_collected",
    entityType: "ORDER",
    entityId: order.orderNumber,
    before: {
      paymentStatus: previousStatus,
      balanceDuePaise: previousBalance,
    },
    after: {
      paymentStatus: "PAID",
      balanceDuePaise: 0,
      collectedBy: params.actor,
      notes: params.notes,
    },
  });

  return {
    success: true,
    orderNumber: order.orderNumber,
    paymentStatus: "PAID",
    balanceDuePaise: 0,
    balanceCollectedBy: params.actor,
    balanceCollectedAt: order.balanceCollectedAt,
  };
}
