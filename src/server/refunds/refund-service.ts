import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getSupportRefundSettings } from "@/lib/admin/app-settings";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { releaseBlanksForOrder } from "@/server/inventory/inventory-service";
import { writeAudit } from "@/lib/admin/audit";
import { toRupees, toPaise, roundHalfUp } from "@/server/pricing/engine";

export interface StoredRefund {
  id: string;
  orderId: string;
  orderNumber: string;
  refundNumber: string;
  amountPaise: number;
  reason: string;
  type: "RAZORPAY" | "MANUAL";
  reference?: string | null;
  status: "PROCESSED" | "FAILED";
  processedBy: string;
  processedRole: string;
  idempotencyKey: string;
  createdAt: string;
}

// In-memory registry for refunds
export const REFUND_STORE = new Map<string, StoredRefund>();
export const REFUND_IDEMPOTENCY_MAP = new Map<string, StoredRefund>();

/**
 * Process order refund with strict role limits, Razorpay adapter, and idempotency.
 */
export async function processOrderRefund(params: {
  orderNumber: string;
  amountPaise?: number; // undefined = full refund
  reason: string;
  idempotencyKey: string;
  actor: string;
  actorRole: string;
  type?: "RAZORPAY" | "MANUAL";
  reference?: string;
}): Promise<StoredRefund> {
  const cleanIdemp = params.idempotencyKey?.trim();
  if (!cleanIdemp) {
    throw new Error("Idempotency key is required for refund execution.");
  }

  // Idempotency: return existing refund if already executed
  const existingIdemp = REFUND_IDEMPOTENCY_MAP.get(cleanIdemp);
  if (existingIdemp) {
    return existingIdemp;
  }

  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error(`Order ${params.orderNumber} not found.`);
  }

  const totalPaidPaise =
    order.paymentStatus === "ADVANCE_PAID"
      ? order.advancePaidPaise || roundHalfUp((order.total * 25) / 100) * 100
      : toPaise(order.total);

  const existingRefunds = getRefundsForOrder(order.orderNumber);
  const alreadyRefundedPaise = existingRefunds.reduce((sum, r) => sum + r.amountPaise, 0);
  const maxRefundablePaise = Math.max(0, totalPaidPaise - alreadyRefundedPaise);

  if (maxRefundablePaise <= 0) {
    throw new Error("This order has already been fully refunded.");
  }

  const targetRefundPaise = params.amountPaise !== undefined ? params.amountPaise : maxRefundablePaise;

  if (targetRefundPaise <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  if (targetRefundPaise > maxRefundablePaise) {
    throw new Error(`Refund amount (Rs ${toRupees(targetRefundPaise)}) exceeds maximum refundable balance (Rs ${toRupees(maxRefundablePaise)}).`);
  }

  // 1. Role Limit Enforcement (AppSettings)
  const refundSettings = await getSupportRefundSettings();
  if (params.actorRole === "SUPPORT_AGENT") {
    if (targetRefundPaise > refundSettings.supportAgentRefundLimitPaise) {
      const limitRupees = Math.round(refundSettings.supportAgentRefundLimitPaise / 100);
      throw new Error(`Support Agent refund limit is Rs ${limitRupees}. Refunds above this amount require Super Admin authorization.`);
    }
  }

  // 2. Gateway execution or manual refund reference
  const isRazorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes("dummy")
  );

  let refundType: "RAZORPAY" | "MANUAL" = params.type || (isRazorpayConfigured ? "RAZORPAY" : "MANUAL");
  let referenceId = params.reference || `REF-${Date.now()}`;

  const razorpayPaymentId = (order as unknown as { razorpayPaymentId?: string }).razorpayPaymentId;
  if (refundType === "RAZORPAY" && isRazorpayConfigured && razorpayPaymentId) {
    try {
      const authHeader = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64");

      const rzpRes = await fetch(
        `https://api.razorpay.com/v1/payments/${razorpayPaymentId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: targetRefundPaise,
            notes: { orderNumber: order.orderNumber, reason: params.reason },
          }),
        }
      );

      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        referenceId = rzpData.id;
      } else {
        // Fallback to recording as manual refund
        refundType = "MANUAL";
      }
    } catch {
      refundType = "MANUAL";
    }
  }

  const refundNumber = `REF-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
  const now = new Date().toISOString();

  const refundRecord: StoredRefund = {
    id: `ref_${crypto.randomUUID()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    refundNumber,
    amountPaise: targetRefundPaise,
    reason: params.reason,
    type: refundType,
    reference: referenceId,
    status: "PROCESSED",
    processedBy: params.actor,
    processedRole: params.actorRole,
    idempotencyKey: cleanIdemp,
    createdAt: now,
  };

  REFUND_STORE.set(refundNumber, refundRecord);
  REFUND_IDEMPOTENCY_MAP.set(cleanIdemp, refundRecord);

  // Update order status
  const newAlreadyRefunded = alreadyRefundedPaise + targetRefundPaise;
  const newPaymentStatus = newAlreadyRefunded >= totalPaidPaise ? "REFUNDED" : "PARTIALLY_REFUNDED";
  order.paymentStatus = newPaymentStatus;
  order.updatedAt = now;

  if (!order.events) order.events = [];
  order.events.push({
    id: `evt_${Date.now()}`,
    type: "REFUND_PROCESSED",
    status: order.status,
    actor: params.actor,
    actorRole: params.actorRole,
    message: `Refund of Rs ${toRupees(targetRefundPaise)} processed via ${refundType} (${referenceId}). Reason: ${params.reason}.`,
    createdAt: now,
  });

  // Release inventory if cancelled order is refunded
  try {
    if (order.status === "CANCELLED") {
      await releaseBlanksForOrder(
        order.id,
        order.items.map((i) => ({ productSlug: i.productId, qty: i.qty })),
        params.actor
      );
    }
  } catch {
    // Non-blocking inventory release
  }

  // DB Sync if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.refund.create({
        data: {
          id: refundRecord.id,
          orderId: order.id,
          refundNumber,
          amountPaise: refundRecord.amountPaise,
          reason: refundRecord.reason,
          type: refundRecord.type,
          reference: refundRecord.reference,
          status: refundRecord.status,
          processedBy: refundRecord.processedBy,
          processedRole: refundRecord.processedRole,
          idempotencyKey: cleanIdemp,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: newPaymentStatus },
      });
    }
  } catch {
    // Memory fallback
  }

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "payment.refund_processed",
    entityType: "REFUND",
    entityId: refundNumber,
    after: {
      orderNumber: order.orderNumber,
      amountPaise: targetRefundPaise,
      amountRupees: toRupees(targetRefundPaise),
      reason: params.reason,
      paymentStatus: newPaymentStatus,
      type: refundType,
      reference: referenceId,
    },
  });

  return refundRecord;
}

export function getRefundsForOrder(orderNumber: string): StoredRefund[] {
  const refunds: StoredRefund[] = [];
  for (const r of REFUND_STORE.values()) {
    if (r.orderNumber === orderNumber) {
      refunds.push(r);
    }
  }
  return refunds.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
