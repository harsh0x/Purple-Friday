import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { calculateCartPricing, CartItemInput } from "./pricing";

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
  items: CartItemInput[];
  couponCode?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<StoredOrder> {
  // 1. Recalculate everything on the server - never trust any client number
  const calculation = await calculateCartPricing(params.items, params.couponCode);

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
    razorpayOrderId,
    couponCode: params.couponCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ORDER_REGISTRY.set(orderId, orderRecord);
  ORDER_REGISTRY.set(orderNumber, orderRecord);

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