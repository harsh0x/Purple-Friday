import prisma from "@/lib/prisma";
import { scoreRtoRisk, RiskOrderInput } from "@/server/risk/rto";
import { toRupees } from "@/server/pricing/engine";
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
 * Validates order for Cash on Delivery / Pay Later.
 * Always eligible - no partial advance or prepaid gating.
 * RTO risk score is computed for admin visibility badge only.
 */
export async function validateCodEligibility(
  order: RiskOrderInput
): Promise<CodEligibilityResult> {
  const risk = scoreRtoRisk(order);
  return {
    eligible: true,
    advancePaise: 0,
    balanceDuePaise: order.totalPaise,
    advancePercent: 0,
    rtoScore: risk.score,
    isPrepaidOnly: false,
  };
}

/**
 * Staff manual action: Mark order as PAID upon COD cash collection, UPI, or bank transfer.
 * Audited and respects version check.
 */
export async function markOrderPaidManually(params: {
  orderNumber: string;
  method?: "COD" | "UPI" | "BANK_TRANSFER";
  amountPaise?: number;
  reference?: string;
  actor: string;
  actorRole: string;
  expectedVersion?: number;
  notes?: string;
}) {
  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error(`Order ${params.orderNumber} not found.`);
  }

  if (params.expectedVersion !== undefined && order.version !== params.expectedVersion) {
    throw new Error("Someone else changed this order, refresh.");
  }

  const previousStatus = order.paymentStatus;
  const methodLabel =
    params.method === "UPI"
      ? "UPI"
      : params.method === "BANK_TRANSFER"
        ? "Bank Transfer"
        : "COD collected";
  const amountPaid = params.amountPaise ?? order.total;

  order.paymentStatus = "PAID";
  order.balanceDuePaise = 0;
  order.advancePaidPaise = amountPaid;
  order.balanceCollectedAt = new Date().toISOString();
  order.balanceCollectedBy = params.actor;
  order.version = (order.version || 1) + 1;
  order.updatedAt = new Date().toISOString();

  if (!order.events) order.events = [];
  order.events.push({
    id: `evt_${Date.now()}`,
    type: "PAYMENT_COLLECTED",
    status: order.status,
    actor: params.actor,
    actorRole: params.actorRole,
    message: `Payment of Rs ${toRupees(amountPaid)} marked as PAID via ${methodLabel}${params.reference ? ` (Ref: ${params.reference})` : ""}${params.notes ? ` - ${params.notes}` : ""}.`,
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
          version: order.version,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "payment.marked_paid",
    entityType: "ORDER",
    entityId: order.orderNumber,
    before: { paymentStatus: previousStatus },
    after: {
      paymentStatus: "PAID",
      method: params.method || "COD",
      amountPaise: amountPaid,
      reference: params.reference,
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
    version: order.version,
  };
}

export const markCodBalanceCollected = markOrderPaidManually;
