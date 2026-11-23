import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { calculateCartPricing, CartItemInput } from "./pricing";
import { validateCodEligibility } from "@/server/payments/cod-service";
import { toPaise } from "@/server/pricing/engine";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";
import { notifyAdmin } from "@/server/notifications/admin-dispatcher";

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
  | "ORDER_PLACED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROOF_PENDING"
  | "PROOF_READY"
  | "CHANGES_REQUESTED"
  | "REVISION_REQUESTED"
  | "CUSTOMER_APPROVED"
  | "APPROVED"
  | "IN_PRODUCTION"
  | "IN_PRINTING"
  | "PACKED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "RTO"
  | (string & {});
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentReference?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  advancePaidPaise?: number;
  balanceDuePaise?: number;
  rtoRiskScore?: number;
  isPrepaidOnly?: boolean;
  couponCode?: string;
  verifyError?: string | null;
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
  const advancePaidPaise = 0;
  const balanceDuePaise = totalPaise;

  const codCheck = await validateCodEligibility({
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    shippingAddress: params.shippingAddress,
    billingAddress: params.billingAddress,
    paymentMethod: "COD",
    totalPaise,
  });

  const orderId = `ord_${crypto.randomUUID()}`;
  const orderNumber = generateOrderNumber();

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
    status: "ORDER_PLACED",
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    advancePaidPaise,
    balanceDuePaise,
    rtoRiskScore: codCheck.rtoScore,
    couponCode: params.couponCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ORDER_REGISTRY.set(orderId, orderRecord);
  ORDER_REGISTRY.set(orderNumber, orderRecord);
  ORDER_REGISTRY.set(orderNumber.toUpperCase(), orderRecord);

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
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    advancePaidPaise,
    balanceDuePaise,
    rtoRiskScore: codCheck.rtoScore,
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
        message: `Order placed via Cash on Delivery / Pay Later. Total payable on delivery: Rs ${calculation.total}.`,
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
          status: "ORDER_PLACED",
          subtotal: calculation.subtotal,
          discount: calculation.discount,
          shipping: calculation.shipping,
          gst: calculation.gst,
          total: calculation.total,
          address: params.shippingAddress as unknown as Prisma.InputJsonValue,
          gstin: params.gstin,
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

  try {
    await notifyAdmin("ORDER_PLACED", {
      orderNumber: orderRecord.orderNumber,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      userId: params.userId,
      total: totalPaise,
      paymentMethod: "COD",
    });
  } catch (err) {
    console.warn("[orders] notifyAdmin ORDER_PLACED error:", err);
  }

  return orderRecord;
}

function convertStateRecordToStoredOrder(rec: StoredOrderRecord): StoredOrder {
  const addr = (rec.address || {}) as Record<string, string>;
  return {
    id: rec.id,
    orderNumber: rec.orderNumber,
    userId: rec.userId || undefined,
    customerName: addr.customerName || (rec as unknown as Record<string, string>).customerName || "Customer",
    customerEmail: addr.customerEmail || (rec as unknown as Record<string, string>).customerEmail || "",
    customerPhone: addr.customerPhone || (rec as unknown as Record<string, string>).customerPhone || "",
    companyName: addr.companyName || (rec as unknown as Record<string, string>).companyName || undefined,
    gstin: rec.gstin || undefined,
    shippingAddress: {
      line1: addr.line1 || "",
      line2: addr.line2,
      city: addr.city || "",
      state: addr.state || "",
      pin: addr.pin || "",
    },
    items: (rec.items || []).map((it) => {
      const itRec = it as unknown as Record<string, unknown>;
      const unitRupees = typeof it.unitPrice === "number" && it.unitPrice > 1000
        ? Math.round(it.unitPrice / 100)
        : it.unitPrice || 0;
      return {
        productId: it.productId,
        productName: (itRec.productName as string) || "Custom Merch",
        template: (itRec.template as string) || "Custom Merch",
        unitPrice: unitRupees,
        qty: it.qty,
        lineTotal: unitRupees * it.qty,
        designId: itRec.designId as string | undefined,
        options: (it.options || {}) as Record<string, string>,
      };
    }),
    subtotal: typeof rec.subtotal === "number" && rec.subtotal > 10000 ? Math.round(rec.subtotal / 100) : rec.subtotal,
    discount: typeof rec.discount === "number" && rec.discount > 10000 ? Math.round(rec.discount / 100) : rec.discount || 0,
    shipping: typeof rec.shipping === "number" && rec.shipping > 10000 ? Math.round(rec.shipping / 100) : rec.shipping || 0,
    gst: typeof rec.gst === "number" && rec.gst > 10000 ? Math.round(rec.gst / 100) : rec.gst,
    total: typeof rec.total === "number" && rec.total > 10000 ? Math.round(rec.total / 100) : rec.total,
    status: rec.status,
    paymentMethod: rec.paymentMethod || "COD",
    paymentStatus: rec.paymentStatus || "PENDING",
    createdAt: rec.createdAt || new Date().toISOString(),
    updatedAt: rec.updatedAt || new Date().toISOString(),
  };
}

export function getOrderByNumber(orderNumber: string): StoredOrder | undefined {
  if (!orderNumber) return undefined;
  const clean = orderNumber.trim();
  const direct = ORDER_REGISTRY.get(clean) || ORDER_REGISTRY.get(clean.toUpperCase());
  if (direct) return direct;

  const stateMem = ORDER_STORE.get(clean) || ORDER_STORE.get(clean.toUpperCase());
  if (stateMem) {
    const converted = convertStateRecordToStoredOrder(stateMem);
    ORDER_REGISTRY.set(clean, converted);
    return converted;
  }

  return undefined;
}

export async function getOrderByNumberAsync(orderNumber: string): Promise<StoredOrder | undefined> {
  const memoryResult = getOrderByNumber(orderNumber);
  if (memoryResult) return memoryResult;

  if (!orderNumber) return undefined;
  const clean = orderNumber.trim();

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const dbOrder = await prisma.order.findFirst({
        where: {
          OR: [{ id: clean }, { orderNumber: clean }],
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (dbOrder) {
        const addr = (dbOrder.address || {}) as Record<string, string>;
        const mapped: StoredOrder = {
          id: dbOrder.id,
          orderNumber: dbOrder.orderNumber,
          userId: dbOrder.userId || undefined,
          customerName: addr.customerName || "Customer",
          customerEmail: addr.customerEmail || "",
          customerPhone: addr.customerPhone || "",
          companyName: addr.companyName,
          gstin: dbOrder.gstin || undefined,
          shippingAddress: {
            line1: addr.line1 || "",
            line2: addr.line2,
            city: addr.city || "",
            state: addr.state || "",
            pin: addr.pin || "",
          },
          items: dbOrder.items.map((it) => ({
            productId: it.productId,
            productName: it.product?.name || "Custom Item",
            template: it.product?.shortName || "Custom Item",
            unitPrice: it.unitPrice,
            qty: it.qty,
            lineTotal: it.unitPrice * it.qty,
            designId: it.designId || undefined,
            options: (it.options || {}) as Record<string, string>,
          })),
          subtotal: dbOrder.subtotal,
          discount: dbOrder.discount,
          shipping: dbOrder.shipping,
          gst: dbOrder.gst,
          total: dbOrder.total,
          status: dbOrder.status as StoredOrder["status"],
          paymentMethod: dbOrder.paymentMethod,
          paymentStatus: dbOrder.paymentStatus,
          createdAt: dbOrder.createdAt.toISOString(),
          updatedAt: dbOrder.updatedAt.toISOString(),
        };

        ORDER_REGISTRY.set(dbOrder.orderNumber, mapped);
        ORDER_REGISTRY.set(dbOrder.id, mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn("[orders] Database order fetch error:", err);
  }

  return undefined;
}

export function getOrderById(orderId: string): StoredOrder | undefined {
  return ORDER_REGISTRY.get(orderId);
}

export async function markOrderPaid(
  orderIdOrNumber: string,
  paymentReference?: string
): Promise<StoredOrder | undefined> {
  const order = ORDER_REGISTRY.get(orderIdOrNumber);
  if (!order) return undefined;

  order.status = "PAID";
  order.paymentStatus = "PAID";
  if (paymentReference) {
    order.paymentReference = paymentReference;
  }
  order.updatedAt = new Date().toISOString();

  const stateRecord = ORDER_STORE.get(order.orderNumber) || ORDER_STORE.get(order.id);
  if (stateRecord) {
    stateRecord.paymentStatus = "PAID";
    stateRecord.balanceDuePaise = 0;
    stateRecord.updatedAt = order.updatedAt;
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

  try {
    await notifyAdmin("ORDER_PAID", {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      userId: order.userId,
      paymentMethod: order.paymentMethod,
      isAdvance: false,
      amount: Math.round(order.total * 100),
    });
  } catch (err) {
    console.warn("[orders] notifyAdmin ORDER_PAID error:", err);
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