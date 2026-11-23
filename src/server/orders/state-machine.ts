import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { writeAudit } from "@/lib/admin/audit";
import { createNotification } from "@/lib/admin/notifications";
import { getStoreSettings } from "@/lib/admin/app-settings";
import { recordDeliveredOrder, recordRtoOrder } from "@/server/risk/rto";
import { notify } from "@/server/notifications/notify";
import { notifyAdmin } from "@/server/notifications/admin-dispatcher";

export type OrderStatus =
  | "ORDER_PLACED"
  | "ARTWORK_UPLOADED"
  | "MOCKUP_SENT"
  | "REVISION_REQUESTED"
  | "CUSTOMER_APPROVED"
  | "IN_PRINTING"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "RTO";

export interface TransitionContext {
  orderCreatedAt?: Date | string | number;
  moneyPaid?: boolean;
  reason?: string;
  now?: Date | string | number;
  cancellationWindowHours?: number; // From AppSetting (default 2)
  paymentMethod?: string;
  paymentStatus?: string;
  isCustomer?: boolean;
  courier?: string;
  trackingNumber?: string;
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

export interface OrderActor {
  id?: string;
  email: string;
  role?: string;
  name?: string;
}

/**
 * Mapping table from legacy/deprecated statuses to canonical statuses.
 * QC_PASSED is migrated to IN_PRINTING.
 */
export const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING_PAYMENT: "ORDER_PLACED",
  PAID: "ORDER_PLACED",
  PROOF_PENDING: "ARTWORK_UPLOADED",
  PROOF_READY: "MOCKUP_SENT",
  CHANGES_REQUESTED: "REVISION_REQUESTED",
  APPROVED: "CUSTOMER_APPROVED",
  IN_PRODUCTION: "IN_PRINTING",
  PACKED: "IN_PRINTING",
  QC_PASSED: "IN_PRINTING",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  RTO: "RTO",
};

export function normalizeOrderStatus(status: string): OrderStatus {
  const norm = status.toUpperCase();
  return LEGACY_STATUS_MAP[norm] || (norm as OrderStatus);
}

/**
 * Pure Transition Table:
 * IN_PRINTING moves directly to DISPATCHED (no factory/QC queue).
 */
export const TRANSITION_TABLE: Record<OrderStatus, readonly OrderStatus[]> = {
  ORDER_PLACED: ["ARTWORK_UPLOADED", "CANCELLED"],
  ARTWORK_UPLOADED: ["MOCKUP_SENT", "CANCELLED"],
  MOCKUP_SENT: ["CUSTOMER_APPROVED", "REVISION_REQUESTED", "CANCELLED"],
  REVISION_REQUESTED: ["MOCKUP_SENT", "CANCELLED"],
  CUSTOMER_APPROVED: ["IN_PRINTING", "CANCELLED"],
  IN_PRINTING: ["DISPATCHED"],
  DISPATCHED: ["DELIVERED", "RTO"],
  DELIVERED: [],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
  RTO: [],
};

const PRE_PRINTING_STATUSES: OrderStatus[] = [
  "ORDER_PLACED",
  "ARTWORK_UPLOADED",
  "MOCKUP_SENT",
  "REVISION_REQUESTED",
  "CUSTOMER_APPROVED",
];

/**
 * Checks whether an order transition is permitted.
 * The single client admin may perform any allowed transition in the transition table.
 * Customers are governed strictly by the 2-hour cancellation gate before IN_PRINTING.
 */
export function canTransition(
  fromRaw: string,
  toRaw: string,
  contextOrRole?: TransitionContext | string,
  maybeContext?: TransitionContext
): TransitionResult {
  const from = normalizeOrderStatus(fromRaw);
  const to = normalizeOrderStatus(toRaw);

  const context: TransitionContext =
    typeof contextOrRole === "object" && contextOrRole !== null
      ? contextOrRole
      : maybeContext || {};

  const isCustomer =
    context.isCustomer ||
    (typeof contextOrRole === "string" && contextOrRole.toUpperCase() === "CUSTOMER");

  // 1. Table transition validation
  const allowedDestinations = TRANSITION_TABLE[from];
  if (!allowedDestinations || !allowedDestinations.includes(to)) {
    return {
      allowed: false,
      reason: `Illegal state transition: Cannot transition from ${from} to ${to}. Allowed targets: [${(allowedDestinations || []).join(", ")}].`,
    };
  }

  // 2. Cancellation Gate for customer
  if (to === "CANCELLED") {
    if (isCustomer) {
      if (!PRE_PRINTING_STATUSES.includes(from)) {
        return {
          allowed: false,
          reason: `Customer cancellation denied: Order has already entered printing (${from}).`,
        };
      }

      const windowHours = context.cancellationWindowHours ?? 2;
      const windowMs = windowHours * 60 * 60 * 1000;
      const orderCreatedTime = context.orderCreatedAt
        ? new Date(context.orderCreatedAt).getTime()
        : Date.now();
      const currentTime = context.now ? new Date(context.now).getTime() : Date.now();
      const elapsed = currentTime - orderCreatedTime;

      if (elapsed > windowMs) {
        return {
          allowed: false,
          reason: `Customer cancellation window of ${windowHours} hours has expired. Please contact support.`,
        };
      }
      return { allowed: true };
    } else {
      if (!context.reason || context.reason.trim().length === 0) {
        return {
          allowed: false,
          reason: "Cancellation requires a written justification reason.",
        };
      }
    }
  }

  // 3. Refund Gate
  if (to === "REFUNDED") {
    if (context.moneyPaid === false) {
      return {
        allowed: false,
        reason: "Cannot refund order: no payment was captured.",
      };
    }
  }

  // 4. Partial COD Advance Gate before IN_PRINTING
  if (to === "IN_PRINTING" && context.paymentMethod === "COD") {
    if (context.paymentStatus !== "ADVANCE_PAID" && context.paymentStatus !== "PAID") {
      return {
        allowed: false,
        reason: "Order cannot move to printing until the partial COD advance payment is verified online.",
      };
    }
  }

  // Admin and system internal operations can perform all table transitions
  return { allowed: true };
}

export type Order = StoredOrderRecord;
export interface StoredOrderRecord {
  id: string;
  orderNumber: string;
  userId?: string | null;
  status: OrderStatus;
  subtotal: number; // in integer paise
  discount: number; // in integer paise
  gst: number; // in integer paise
  shipping: number; // in integer paise
  total: number; // in integer paise
  paymentMethod: string;
  paymentStatus: string;
  address: Record<string, unknown>;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  companyName?: string;
  shippingAddress?: { line1?: string; line2?: string; city?: string; state?: string; pin?: string };
  gstin?: string | null;
  trackingNumber?: string | null;
  courier?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  couponCode?: string | null;
  paymentReference?: string | null;
  verifyError?: string | null;
  notes?: string | null;
  version: number;
  assignedDesignerId?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  approvalTokenHash?: string | null;
  approvalTokenExpiresAt?: string | null;
  mockupSentAt?: string | null;
  customerApprovedAt?: string | null;
  totalPausedDurationMs?: number;
  pausedAt?: string | null;
  slaDueAt?: string | null;
  nudgeCount: number;
  advancePaidPaise?: number;
  balanceDuePaise?: number;
  balanceCollectedAt?: string | null;
  balanceCollectedBy?: string | null;
  rtoRiskScore?: number | null;
  rtoRiskReasons?: string[];
  rtoRiskOverrideReason?: string | null;
  rtoRiskOverriddenBy?: string | null;
  isPrepaidOnly?: boolean;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    options: Record<string, unknown>;
    qty: number;
    unitPrice: number; // in integer paise
    artworkUrl?: string | null;
    mockupUrl?: string | null;
    printMethod?: string | null;
    placement?: Record<string, unknown> | null;
  }>;
  events?: Array<{
    id: string;
    type: string;
    status: string;
    actor: string;
    actorRole: string;
    message: string;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

// Global in-memory registry fallback for dev / tests
export const ORDER_STORE = new Map<string, StoredOrderRecord>();

export async function getOrderByIdOrNumber(identifier: string): Promise<StoredOrderRecord | null> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: identifier }, { orderNumber: identifier }],
        },
        include: {
          items: true,
          events: { orderBy: { createdAt: "desc" } },
        },
      });

      if (order) {
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          status: normalizeOrderStatus(order.status),
          subtotal: order.subtotal,
          discount: order.discount,
          gst: order.gst,
          shipping: order.shipping,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus || "PAID",
          address: order.address as Record<string, unknown>,
          gstin: order.gstin,
          trackingNumber: order.trackingNumber,
          notes: order.notes,
          version: order.version,
          assignedDesignerId: order.assignedDesignerId,
          cancellationReason: order.cancellationReason,
          cancelledBy: order.cancelledBy,
          cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
          approvalTokenHash: order.approvalTokenHash,
          approvalTokenExpiresAt: order.approvalTokenExpiresAt
            ? order.approvalTokenExpiresAt.toISOString()
            : null,
          mockupSentAt: order.mockupSentAt ? order.mockupSentAt.toISOString() : null,
          customerApprovedAt: order.customerApprovedAt
            ? order.customerApprovedAt.toISOString()
            : null,
          nudgeCount: order.nudgeCount || 0,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          items: order.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            options: i.options as Record<string, unknown>,
            qty: i.qty,
            unitPrice: i.unitPrice,
            artworkUrl: i.artworkUrl,
            mockupUrl: i.mockupUrl,
            printMethod: i.printMethod,
            placement: i.placement as Record<string, unknown> | null,
          })),
          events: order.events.map((e) => ({
            id: e.id,
            type: e.type,
            status: e.status,
            actor: e.actor,
            actorRole: e.actorRole,
            message: e.message,
            metadata: e.metadata as Record<string, unknown> | null,
            createdAt: e.createdAt.toISOString(),
          })),
        };
      }
    }
  } catch {
    // Fallback to memory
  }

  return (
    ORDER_STORE.get(identifier) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === identifier || o.id === identifier) ||
    null
  );
}

/**
 * Sole entry point for order status mutations across the platform.
 * Enforces transition table, version checks, AuditLog, and OrderEvents.
 */
export async function changeOrderStatus(
  orderId: string,
  toRaw: string,
  actorArg?: OrderActor | string,
  reason?: string,
  expectedVersion?: number,
  customContext?: TransitionContext
): Promise<{ success: boolean; order: StoredOrderRecord; eventId: string }> {
  const order = await getOrderByIdOrNumber(orderId);
  if (!order) {
    throw new Error(`Order "${orderId}" not found.`);
  }

  // 1. Optimistic Concurrency Version Check
  if (expectedVersion !== undefined && order.version !== expectedVersion) {
    throw new Error("Someone else changed this order, refresh.");
  }

  const from = order.status;
  const to = normalizeOrderStatus(toRaw);

  const actorEmail =
    typeof actorArg === "string"
      ? actorArg
      : actorArg?.email || "admin@purplefriday.in";
  const actorName =
    typeof actorArg === "object" && actorArg !== null ? actorArg.name : undefined;
  const actorRole =
    typeof actorArg === "object" && actorArg !== null
      ? (actorArg.role || "ADMIN").toUpperCase()
      : "ADMIN";

  // 2. Fetch cancellation window setting
  let cancellationWindowHours = 2;
  try {
    const settings = await getStoreSettings();
    if ((settings as unknown as { cancellationWindowHours?: number }).cancellationWindowHours) {
      cancellationWindowHours = (settings as unknown as { cancellationWindowHours: number })
        .cancellationWindowHours;
    }
  } catch {
    // Default 2 hours
  }

  // 3. Evaluate State Machine Transition
  const check = canTransition(from, to, {
    orderCreatedAt: order.createdAt,
    moneyPaid: order.paymentStatus === "PAID" || order.paymentStatus === "ADVANCE_PAID" || order.total > 0,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    reason,
    cancellationWindowHours,
    isCustomer: actorRole === "CUSTOMER",
    ...customContext,
  });

  if (!check.allowed) {
    throw new Error(check.reason || `Transition from ${from} to ${to} is forbidden.`);
  }

  const now = new Date();
  const nextVersion = order.version + 1;

  let newMockupSentAt: string | null = order.mockupSentAt || null;
  let newCustomerApprovedAt: string | null = order.customerApprovedAt || null;

  if (to === "MOCKUP_SENT" && !order.mockupSentAt) {
    newMockupSentAt = now.toISOString();
  }
  if (to === "CUSTOMER_APPROVED") {
    newCustomerApprovedAt = now.toISOString();
  }

  // 4. Order Cancellation Details
  const newCancellationReason = to === "CANCELLED" ? reason || order.cancellationReason : order.cancellationReason;
  const newCancelledBy = to === "CANCELLED" ? actorEmail : order.cancelledBy;
  const newCancelledAt = to === "CANCELLED" ? now.toISOString() : order.cancelledAt;

  // 5. Create OrderEvent row
  const eventId = `evt_${now.getTime()}_${crypto.randomBytes(3).toString("hex")}`;
  const eventMessage = reason
    ? `Status changed from ${from} to ${to}. Reason: ${reason}`
    : `Status changed from ${from} to ${to}.`;

  const orderEvent = {
    id: eventId,
    type: "STATUS_CHANGE",
    status: to,
    actor: actorName ? `${actorName} (${actorEmail})` : actorEmail,
    actorRole,
    message: eventMessage,
    metadata: {
      fromStatus: from,
      toStatus: to,
      reason: reason || null,
      version: nextVersion,
    },
    createdAt: now.toISOString(),
  };

  // 6. Write Immutable AuditLog row
  await writeAudit({
    actor: actorEmail,
    actorRole,
    action: `order.status_transition.${to.toLowerCase()}`,
    entityType: "ORDER",
    entityId: order.orderNumber,
    before: { status: from, version: order.version },
    after: { status: to, version: nextVersion, reason: reason || null },
  });

  // 7. Generate Target Notifications
  const orderAddr = (order.address || {}) as Record<string, string>;
  const customerEmail = (order.customerEmail || orderAddr.email || "").toLowerCase().trim();

  if (to === "MOCKUP_SENT") {
    await createNotification({
      userOrRole: order.userId ? order.userId : "role:CUSTOMER",
      title: `Proof Ready: Order #${order.orderNumber}`,
      body: `Your custom merchandise mockup has been prepared. Please review and approve.`,
      link: `/proof/${order.approvalTokenHash || order.orderNumber}`,
    });
  } else if (to === "CUSTOMER_APPROVED") {
    await createNotification({
      userOrRole: "role:ADMIN",
      title: `Proof Approved: Order #${order.orderNumber}`,
      body: `Customer approved the design proof. Order is ready for printing.`,
      link: `/admin/orders`,
    });
    try {
      await notifyAdmin("PROOF_DECISION", {
        orderNumber: order.orderNumber,
        decision: "APPROVED",
      });
    } catch { }
  } else if (to === "REVISION_REQUESTED") {
    await createNotification({
      userOrRole: "role:ADMIN",
      title: `Revision Requested: Order #${order.orderNumber}`,
      body: `Customer requested adjustments on the proof. Reason: ${reason || "Check comments"}.`,
      link: `/admin/orders`,
    });
    try {
      await notifyAdmin("PROOF_DECISION", {
        orderNumber: order.orderNumber,
        decision: "REVISION_REQUESTED",
        comment: reason || "Check comments",
      });
    } catch { }
  } else if (to === "CANCELLED") {
    await createNotification({
      userOrRole: "role:ADMIN",
      title: `Order Cancelled: #${order.orderNumber}`,
      body: `Order was cancelled by ${actorRole} (${actorEmail}). Reason: ${reason || "N/A"}.`,
      link: `/admin/orders`,
    });
    if (customerEmail) {
      try {
        await notify("cancelled_or_refunded", customerEmail, {
          orderNumber: order.orderNumber,
          reason: reason || "Order cancelled.",
        });
      } catch { }
    }
    try {
      await notifyAdmin("ORDER_CANCELLED", {
        orderNumber: order.orderNumber,
        customerName: actorName || orderAddr.customerName || "Customer",
        customerEmail,
        reason: reason || "Order cancelled.",
      });
    } catch { }
  } else if (to === "DISPATCHED") {
    const courier = customContext?.courier || order.courier || "Delhivery";
    const trackingNumber = customContext?.trackingNumber || order.trackingNumber || "DEL12345678IN";
    if (customerEmail) {
      try {
        await notify("shipped", customerEmail, {
          orderNumber: order.orderNumber,
          courier,
          trackingNumber,
          trackingUrl: trackingNumber ? `https://track.delhivery.com/p/${trackingNumber}` : undefined,
        });
      } catch { }
    }
  } else if (to === "DELIVERED") {
    if (customerEmail) {
      try {
        await notify("delivered", customerEmail, {
          orderNumber: order.orderNumber,
        });
      } catch { }
    }
  }

  // 8. PinStats & RTO History Tracking
  try {
    if (to === "DELIVERED" || to === "RTO") {
      const addr = (order.address as Record<string, unknown>) || {};
      const pin = (addr.pin as string) || (addr.postalCode as string);
      const phone = (addr.phone as string) || (addr.customerPhone as string) || "";
      const name = (addr.customerName as string) || (addr.name as string) || "";
      if (pin) {
        if (to === "DELIVERED") {
          await recordDeliveredOrder(String(pin), String(phone), String(name));
        } else {
          await recordRtoOrder(String(pin), String(phone), String(name));
        }
      }
    }
  } catch {
    // Non-blocking statistics update
  }

  // 9. Persist to Database if active
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: to,
          version: nextVersion,
          cancellationReason: newCancellationReason,
          cancelledBy: newCancelledBy,
          cancelledAt: newCancelledAt ? new Date(newCancelledAt) : null,
          mockupSentAt: newMockupSentAt ? new Date(newMockupSentAt) : null,
          customerApprovedAt: newCustomerApprovedAt ? new Date(newCustomerApprovedAt) : null,
          events: {
            create: {
              id: orderEvent.id,
              type: orderEvent.type,
              status: orderEvent.status,
              actor: orderEvent.actor,
              actorRole: orderEvent.actorRole,
              message: orderEvent.message,
              metadata: orderEvent.metadata as unknown as Prisma.InputJsonValue,
              createdAt: now,
            },
          },
        },
      });
    }
  } catch {
    // Memory fallback below
  }

  // Update memory store
  const updatedOrder: StoredOrderRecord = {
    ...order,
    status: to,
    courier: customContext?.courier || order.courier,
    trackingNumber: customContext?.trackingNumber || order.trackingNumber,
    version: nextVersion,
    cancellationReason: newCancellationReason,
    cancelledBy: newCancelledBy,
    cancelledAt: newCancelledAt,
    mockupSentAt: newMockupSentAt,
    customerApprovedAt: newCustomerApprovedAt,
    pausedAt: to === "MOCKUP_SENT" ? now.toISOString() : (to === "CUSTOMER_APPROVED" ? null : (order.pausedAt ?? null)),
    updatedAt: now.toISOString(),
    events: [orderEvent, ...(order.events || [])],
  };

  ORDER_STORE.set(order.id, updatedOrder);
  ORDER_STORE.set(order.orderNumber, updatedOrder);

  return { success: true, order: updatedOrder, eventId };
}
