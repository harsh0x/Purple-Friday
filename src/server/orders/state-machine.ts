import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { writeAudit } from "@/lib/admin/audit";
import { createNotification } from "@/lib/admin/notifications";
import { getStoreSettings } from "@/lib/admin/app-settings";

export type OrderStatus =
  | "ORDER_PLACED"
  | "ARTWORK_UPLOADED"
  | "MOCKUP_SENT"
  | "REVISION_REQUESTED"
  | "CUSTOMER_APPROVED"
  | "IN_PRINTING"
  | "QC_PASSED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "RTO";

export type ActorRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "GRAPHIC_DESIGNER"
  | "FACTORY_MANAGER"
  | "SUPPORT_AGENT"
  | "CUSTOMER"
  | "SYSTEM";

export interface TransitionContext {
  orderCreatedAt?: Date | string | number;
  moneyPaid?: boolean;
  reason?: string;
  now?: Date | string | number;
  cancellationWindowHours?: number; // From AppSetting (default 2)
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

export interface OrderActor {
  id?: string;
  email: string;
  role: ActorRole | string;
  name?: string;
}

/**
 * Mapping table from legacy statuses to new canonical statuses.
 * Keeps existing database records valid and readable.
 */
export const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING_PAYMENT: "ORDER_PLACED",
  PAID: "ORDER_PLACED",
  PROOF_PENDING: "ARTWORK_UPLOADED",
  PROOF_READY: "MOCKUP_SENT",
  CHANGES_REQUESTED: "REVISION_REQUESTED",
  APPROVED: "CUSTOMER_APPROVED",
  IN_PRODUCTION: "IN_PRINTING",
  PACKED: "QC_PASSED",
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
 * Maps each canonical status to its valid next statuses.
 */
export const TRANSITION_TABLE: Record<OrderStatus, readonly OrderStatus[]> = {
  ORDER_PLACED: ["ARTWORK_UPLOADED", "CANCELLED"],
  ARTWORK_UPLOADED: ["MOCKUP_SENT", "CANCELLED"],
  MOCKUP_SENT: ["CUSTOMER_APPROVED", "REVISION_REQUESTED", "CANCELLED"],
  REVISION_REQUESTED: ["MOCKUP_SENT", "CANCELLED"],
  CUSTOMER_APPROVED: ["IN_PRINTING", "CANCELLED"],
  IN_PRINTING: ["QC_PASSED"],
  QC_PASSED: ["DISPATCHED"],
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
 * Checks whether an order transition is permitted given the current status,
 * target status, actor role, and business context (cancellation gate, money paid).
 */
export function canTransition(
  fromRaw: string,
  toRaw: string,
  roleRaw: ActorRole | string,
  context: TransitionContext = {}
): TransitionResult {
  const from = normalizeOrderStatus(fromRaw);
  const to = normalizeOrderStatus(toRaw);
  const role = roleRaw.toUpperCase() as ActorRole;

  // 1. Table transition validation
  const allowedDestinations = TRANSITION_TABLE[from];
  if (!allowedDestinations || !allowedDestinations.includes(to)) {
    return {
      allowed: false,
      reason: `Illegal state transition: Cannot transition from ${from} to ${to}. Allowed targets: [${(allowedDestinations || []).join(", ")}].`,
    };
  }

  // 2. Cancellation Gate
  if (to === "CANCELLED") {
    if (role === "CUSTOMER") {
      // Must be before IN_PRINTING
      if (!PRE_PRINTING_STATUSES.includes(from)) {
        return {
          allowed: false,
          reason: `Customer cancellation denied: Order has already entered production (${from}).`,
        };
      }

      // Must be within cancellation window hours (default 2 hours)
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
          reason: `Customer cancellation window of ${windowHours} hours has expired. Please contact customer support.`,
        };
      }
      return { allowed: true };
    }

    // Staff Cancellation
    if (["SUPPORT_AGENT", "SUPER_ADMIN", "ADMIN"].includes(role)) {
      if (!context.reason || context.reason.trim().length === 0) {
        return {
          allowed: false,
          reason: "Staff cancellation requires a written justification reason for the audit trail.",
        };
      }
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Role ${role} is not permitted to cancel orders.`,
    };
  }

  // 3. Refund Transition Rule
  if (to === "REFUNDED") {
    if (from !== "CANCELLED") {
      return {
        allowed: false,
        reason: "Only cancelled orders can be marked as refunded.",
      };
    }
    if (context.moneyPaid === false) {
      return {
        allowed: false,
        reason: "Refund cannot be issued because no payment was captured for this order.",
      };
    }
    if (!["SUPPORT_AGENT", "SUPER_ADMIN", "ADMIN", "SYSTEM"].includes(role)) {
      return {
        allowed: false,
        reason: `Role ${role} is not authorized to execute refunds.`,
      };
    }
    return { allowed: true };
  }

  // 4. Role-Specific Pipeline Capabilities
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "SYSTEM":
      // Super admin and internal automation can perform all transitions in the table
      return { allowed: true };

    case "GRAPHIC_DESIGNER":
      if (
        (from === "ARTWORK_UPLOADED" && to === "MOCKUP_SENT") ||
        (from === "REVISION_REQUESTED" && to === "MOCKUP_SENT")
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Graphic Designers may only move artwork to MOCKUP_SENT. Cannot perform ${from} -> ${to}.`,
      };

    case "FACTORY_MANAGER":
      if (
        (from === "CUSTOMER_APPROVED" && to === "IN_PRINTING") ||
        (from === "IN_PRINTING" && to === "QC_PASSED") ||
        (from === "QC_PASSED" && to === "DISPATCHED")
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Factory Managers may only manage printing, QC, and dispatch. Cannot perform ${from} -> ${to}.`,
      };

    case "CUSTOMER":
      if (
        (from === "ORDER_PLACED" && to === "ARTWORK_UPLOADED") ||
        (from === "MOCKUP_SENT" && to === "CUSTOMER_APPROVED") ||
        (from === "MOCKUP_SENT" && to === "REVISION_REQUESTED")
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Customers may only approve, request revisions on mockups, or cancel within the 2-hour window.`,
      };

    case "SUPPORT_AGENT":
      if (from === "DISPATCHED" && (to === "DELIVERED" || to === "RTO")) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Support Agents may only handle delivery status resolution, cancellations, or refunds.`,
      };

    default:
      return {
        allowed: false,
        reason: `Unrecognized or unauthorized role: ${role}.`,
      };
  }
}

export interface StoredOrderRecord {
  id: string;
  orderNumber: string;
  userId?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  gst: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  address: Record<string, unknown>;
  gstin?: string | null;
  trackingNumber?: string | null;
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
  totalPausedDurationMs: number;
  pausedAt?: string | null;
  slaDueAt?: string | null;
  nudgeCount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    options: Record<string, unknown>;
    qty: number;
    unitPrice: number;
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
          totalPausedDurationMs: order.totalPausedDurationMs || 0,
          pausedAt: order.pausedAt ? order.pausedAt.toISOString() : null,
          slaDueAt: order.slaDueAt ? order.slaDueAt.toISOString() : null,
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
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === identifier) ||
    null
  );
}

/**
 * Sole entry point for order status mutations across the entire platform.
 * Enforces transition table, role checks, cancellation gate, optimistic locking,
 * AuditLog, OrderEvent, SLA pause/resume calculation, and notifications.
 */
export async function changeOrderStatus(
  orderId: string,
  toRaw: string,
  actor: OrderActor,
  reason?: string,
  expectedVersion?: number
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
  const check = canTransition(from, to, actor.role, {
    orderCreatedAt: order.createdAt,
    moneyPaid: order.paymentStatus === "PAID" || order.total > 0,
    reason,
    cancellationWindowHours,
  });

  if (!check.allowed) {
    throw new Error(check.reason || `Transition from ${from} to ${to} is forbidden.`);
  }

  const now = new Date();
  const nextVersion = order.version + 1;

  // 4. SLA Pause / Resume Logic
  let newPausedAt: string | null = order.pausedAt || null;
  let newTotalPausedMs = order.totalPausedDurationMs || 0;
  let newMockupSentAt: string | null = order.mockupSentAt || null;
  let newCustomerApprovedAt: string | null = order.customerApprovedAt || null;

  // Entering customer waiting state -> Pause SLA clock
  if ((to === "MOCKUP_SENT" || to === "REVISION_REQUESTED") && !order.pausedAt) {
    newPausedAt = now.toISOString();
    if (to === "MOCKUP_SENT" && !order.mockupSentAt) {
      newMockupSentAt = now.toISOString();
    }
  }

  // Exiting customer waiting state -> Resume SLA clock and extend due time
  if (
    (from === "MOCKUP_SENT" || from === "REVISION_REQUESTED") &&
    to !== "REVISION_REQUESTED" &&
    order.pausedAt
  ) {
    const pauseDuration = now.getTime() - new Date(order.pausedAt).getTime();
    newTotalPausedMs += Math.max(0, pauseDuration);
    newPausedAt = null;

    if (to === "CUSTOMER_APPROVED") {
      newCustomerApprovedAt = now.toISOString();
    }
  }

  // Recalculate SLA due time: Order confirmed time + 48 hours + totalPausedDuration
  const initialSlaBase = new Date(order.createdAt).getTime() + 48 * 60 * 60 * 1000;
  const updatedSlaDue = new Date(initialSlaBase + newTotalPausedMs).toISOString();

  // 5. Order Cancellation Details
  const newCancellationReason = to === "CANCELLED" ? reason || order.cancellationReason : order.cancellationReason;
  const newCancelledBy = to === "CANCELLED" ? actor.email : order.cancelledBy;
  const newCancelledAt = to === "CANCELLED" ? now.toISOString() : order.cancelledAt;

  // 6. Create OrderEvent row
  const eventId = `evt_${now.getTime()}_${crypto.randomBytes(3).toString("hex")}`;
  const eventMessage = reason
    ? `Status changed from ${from} to ${to}. Reason: ${reason}`
    : `Status changed from ${from} to ${to}.`;

  const orderEvent = {
    id: eventId,
    type: "STATUS_CHANGE",
    status: to,
    actor: actor.name ? `${actor.name} (${actor.email})` : actor.email,
    actorRole: actor.role.toUpperCase(),
    message: eventMessage,
    metadata: {
      fromStatus: from,
      toStatus: to,
      reason: reason || null,
      version: nextVersion,
    },
    createdAt: now.toISOString(),
  };

  // 7. Write Immutable AuditLog row
  await writeAudit({
    actor: actor.email,
    actorRole: actor.role.toUpperCase(),
    action: `order.status_transition.${to.toLowerCase()}`,
    entityType: "ORDER",
    entityId: order.orderNumber,
    before: { status: from, version: order.version },
    after: { status: to, version: nextVersion, reason: reason || null },
  });

  // 8. Generate Target In-App Notifications
  if (to === "MOCKUP_SENT") {
    await createNotification({
      userOrRole: order.userId ? order.userId : "role:CUSTOMER",
      title: `Proof Ready: Order #${order.orderNumber}`,
      body: `Your custom merchandise mockup has been prepared by our design atelier. Please review and approve.`,
      link: `/proof/${order.approvalTokenHash || order.orderNumber}`,
    });
  } else if (to === "CUSTOMER_APPROVED") {
    await createNotification({
      userOrRole: "role:FACTORY_MANAGER",
      title: `Proof Approved: Order #${order.orderNumber}`,
      body: `Customer approved the design proof. Order is ready for printing batch allocation.`,
      link: `/admin/orders`,
    });
  } else if (to === "REVISION_REQUESTED") {
    await createNotification({
      userOrRole: order.assignedDesignerId ? order.assignedDesignerId : "role:GRAPHIC_DESIGNER",
      title: `Revision Requested: Order #${order.orderNumber}`,
      body: `Customer requested adjustments on the digital proof. Reason: ${reason || "Check comments"}.`,
      link: `/admin/orders`,
    });
  } else if (to === "CANCELLED") {
    await createNotification({
      userOrRole: "role:SUPPORT_AGENT",
      title: `Order Cancelled: #${order.orderNumber}`,
      body: `Order was cancelled by ${actor.role} (${actor.email}). Reason: ${reason || "N/A"}.`,
      link: `/admin/orders`,
    });
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
          totalPausedDurationMs: newTotalPausedMs,
          pausedAt: newPausedAt ? new Date(newPausedAt) : null,
          slaDueAt: new Date(updatedSlaDue),
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
    version: nextVersion,
    cancellationReason: newCancellationReason,
    cancelledBy: newCancelledBy,
    cancelledAt: newCancelledAt,
    mockupSentAt: newMockupSentAt,
    customerApprovedAt: newCustomerApprovedAt,
    totalPausedDurationMs: newTotalPausedMs,
    pausedAt: newPausedAt,
    slaDueAt: updatedSlaDue,
    updatedAt: now.toISOString(),
    events: [orderEvent, ...(order.events || [])],
  };

  ORDER_STORE.set(order.id, updatedOrder);
  ORDER_STORE.set(order.orderNumber, updatedOrder);

  return { success: true, order: updatedOrder, eventId };
}

/**
 * Records a QC failure rework event on IN_PRINTING without altering the status.
 */
export async function recordQcRework(
  orderId: string,
  actor: OrderActor,
  reworkNotes: string,
  expectedVersion?: number
): Promise<{ success: boolean; order: StoredOrderRecord; eventId: string }> {
  const order = await getOrderByIdOrNumber(orderId);
  if (!order) throw new Error(`Order "${orderId}" not found.`);

  if (expectedVersion !== undefined && order.version !== expectedVersion) {
    throw new Error("Someone else changed this order, refresh.");
  }

  if (order.status !== "IN_PRINTING") {
    throw new Error(`QC rework can only be registered on orders currently IN_PRINTING (found: ${order.status}).`);
  }

  const now = new Date();
  const nextVersion = order.version + 1;
  const eventId = `evt_qc_${now.getTime()}_${crypto.randomBytes(3).toString("hex")}`;

  const event = {
    id: eventId,
    type: "QC_REWORK",
    status: "IN_PRINTING",
    actor: actor.name ? `${actor.name} (${actor.email})` : actor.email,
    actorRole: actor.role.toUpperCase(),
    message: `Quality Control rework flagged: ${reworkNotes}`,
    metadata: { reworkNotes, flaggedAt: now.toISOString(), version: nextVersion },
    createdAt: now.toISOString(),
  };

  await writeAudit({
    actor: actor.email,
    actorRole: actor.role.toUpperCase(),
    action: "order.qc_rework_flagged",
    entityType: "ORDER",
    entityId: order.orderNumber,
    after: { reworkNotes, version: nextVersion },
  });

  const updatedOrder: StoredOrderRecord = {
    ...order,
    version: nextVersion,
    updatedAt: now.toISOString(),
    events: [event, ...(order.events || [])],
  };

  ORDER_STORE.set(order.id, updatedOrder);
  ORDER_STORE.set(order.orderNumber, updatedOrder);

  return { success: true, order: updatedOrder, eventId };
}
