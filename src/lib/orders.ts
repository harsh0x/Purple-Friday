import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { calculateCartPricing, CartItemInput } from "./pricing";
import { reserveBlanksForOrder } from "@/server/inventory/inventory-service";
import { validateCodEligibility } from "@/server/payments/cod-service";
import { toPaise, toRupees } from "@/server/pricing/engine";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

export interface StoredOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  companyName?: string;
  gstin?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    template: string;
    unitPrice: number;
    qty: number;
    lineTotal: number;
    designId?: string;
    options?: Record<string, string>;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  total: number;
  status:
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROOF_PENDING"
  | "PROOF_READY"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "IN_PRODUCTION"
  | "PACKED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  advancePaidPaise?: number;
  balanceDuePaise?: number;
  rtoRiskScore?: number;
  isPrepaidOnly?: boolean;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_REGISTRY = new Map<string, StoredOrder>();

/**
 * Generates official order number formatted as PF-YYMM-XXXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const randomSuffix = crypto.randomInt(10000, 99999);
  return `PF-${yy}${mm}-${randomSuffix}`;
}

export interface CreateOrderParams {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  gstin?: string;
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
  paymentMethod?: string;
  items: CartItemInput[];
  couponCode?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<StoredOrder> {
  // 1. Recalculate everything on the server - never trust any client number
  const calculation = await calculateCartPricing(params.items, params.couponCode);

  const totalPaise = toPaise(calculation.total);
  const isCod = params.paymentMethod === "COD";
  let advancePaidPaise = 0;
  let balanceDuePaise = 0;

  if (isCod) {
    const codCheck = await validateCodEligibility({
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      shippingAddress: params.shippingAddress,
      billingAddress: params.billingAddress,
      paymentMethod: "COD",
      totalPaise,
    });

    if (!codCheck.eligible) {
      throw new Error(codCheck.reason || "Cash on Delivery is unavailable for this order.");
    }

    advancePaidPaise = codCheck.advancePaise;
    balanceDuePaise = codCheck.balanceDuePaise;
  }

  const orderId = `ord_${crypto.randomUUID()}`;
  const orderNumber = generateOrderNumber();

  // Razorpay Mock / Live order ID
  const razorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;

  const orderRecord: StoredOrder = {
    id: orderId,
    orderNumber,
    userId: params.userId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    companyName: params.companyName,
    gstin: params.gstin,
    shippingAddress: params.shippingAddress,
    items: calculation.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      template: item.template,
      unitPrice: item.unitPrice,
      qty: item.qty,
      lineTotal: item.lineTotal,
      designId: item.designId,
      options: item.options,
    })),
    subtotal: calculation.subtotal,
    discount: calculation.discount,
    shipping: calculation.shipping,
    gst: calculation.gst,
    total: calculation.total,
    status: "PENDING_PAYMENT",
    paymentMethod: isCod ? "COD" : "RAZORPAY",
    paymentStatus: "PENDING",
    advancePaidPaise,
    balanceDuePaise,
    razorpayOrderId,
    couponCode: params.couponCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ORDER_REGISTRY.set(orderId, orderRecord);
  ORDER_REGISTRY.set(orderNumber, orderRecord);

  // Sync to ORDER_STORE
  const stateRecord: StoredOrderRecord = {
    id: orderId,
    orderNumber,
    userId: params.userId,
    status: "ORDER_PLACED",
    subtotal: toPaise(calculation.subtotal),
    discount: toPaise(calculation.discount),
    gst: toPaise(calculation.gst),
    shipping: toPaise(calculation.shipping),
    total: totalPaise,
    paymentMethod: isCod ? "COD" : "RAZORPAY",
    paymentStatus: "PENDING",
    advancePaidPaise,
    balanceDuePaise,
    address: {
      ...params.shippingAddress,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
    },
    gstin: params.gstin,
    version: 1,
    totalPausedDurationMs: 0,
    nudgeCount: 0,
    createdAt: orderRecord.createdAt,
    updatedAt: orderRecord.updatedAt,
    items: calculation.items.map((it, idx) => ({
      id: `item_${orderId}_${idx}`,
      productId: it.productId,
      qty: it.qty,
      unitPrice: toPaise(it.unitPrice),
      options: it.options || {},
    })),
    events: [
      {
        id: `evt_${Date.now()}`,
        type: "ORDER_CREATED",
        status: "ORDER_PLACED",
        actor: params.customerEmail,
        actorRole: "CUSTOMER",
        message: isCod
          ? `Order placed via Partial COD. Advance due online: Rs ${toRupees(advancePaidPaise)}, Balance due on delivery: Rs ${toRupees(balanceDuePaise)}.`
          : `Order placed via Prepaid online. Total payable: Rs ${calculation.total}.`,
        createdAt: orderRecord.createdAt,
      },
    ],
  };

  ORDER_STORE.set(orderId, stateRecord);
  ORDER_STORE.set(orderNumber, stateRecord);

  // Sync to Prisma DB if active
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.order.create({
        data: {
          id: orderId,
          orderNumber,
          userId: params.userId,
          status: "PENDING_PAYMENT",
          subtotal: calculation.subtotal,
          discount: calculation.discount,
          shipping: calculation.shipping,
          gst: calculation.gst,
          total: calculation.total,
          address: params.shippingAddress as unknown as Prisma.InputJsonValue,
          gstin: params.gstin,
          razorpayOrderId,
          items: {
            create: calculation.items.map((item) => ({
              productId: item.productId,
              options: (item.options || {}) as unknown as Prisma.InputJsonValue,
              qty: item.qty,
              unitPrice: item.unitPrice,
              designId: item.designId,
            })),
          },
        },
      });
    }
  } catch {
    // Memory fallback
  }

  return orderRecord;
}

export function getOrderByNumber(orderNumber: string): StoredOrder | undefined {
  return ORDER_REGISTRY.get(orderNumber);
}

export function getOrderById(orderId: string): StoredOrder | undefined {
  return ORDER_REGISTRY.get(orderId);
}

export async function markOrderPaid(
  orderIdOrNumber: string,
  paymentId: string
): Promise<StoredOrder | undefined> {
  const order = ORDER_REGISTRY.get(orderIdOrNumber);
  if (!order) return undefined;

  order.status = "PAID";
  order.razorpayPaymentId = paymentId;
  order.updatedAt = new Date().toISOString();

  // Transactional reservation of blank inventory
  try {
    await reserveBlanksForOrder(
      order.id,
      order.items.map((i) => ({ productSlug: i.productId, qty: i.qty })),
      order.customerName
    );
  } catch {
    // Non-blocking reservation
  }

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
        },
      });
    }
  } catch {
    // Memory fallback
  }

  return order;
}

export function getAllOrders(): StoredOrder[] {
  // Deduplicate keys (since stored by both id and orderNumber)
  const unique = new Map<string, StoredOrder>();
  for (const o of ORDER_REGISTRY.values()) {
    unique.set(o.id, o);
  }
  return Array.from(unique.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}