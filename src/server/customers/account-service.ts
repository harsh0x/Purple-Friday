import crypto from "crypto";
import { recordCustomerEvent } from "./customer-events";
import { ORDER_STORE } from "../orders/state-machine";

export interface CustomerAddress {
  id: string;
  userId: string;
  label: "Home" | "Office" | "Other";
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  gstin?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderIssue {
  id: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  reason: string;
  comment: string;
  photoUrls: string[];
  status: "OPEN" | "ANSWERED" | "REFUNDED" | "CLOSED";
  adminReply?: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory registries
export const CUSTOMER_ADDRESSES = new Map<string, CustomerAddress>();
export const ORDER_ISSUES = new Map<string, OrderIssue>();

// -----------------------------------------------------------------------------
// ADDRESS MANAGEMENT
// -----------------------------------------------------------------------------

export function getCustomerAddresses(userId: string): CustomerAddress[] {
  return Array.from(CUSTOMER_ADDRESSES.values()).filter((a) => a.userId === userId);
}

export async function addCustomerAddress(params: {
  userId: string;
  customerEmail: string;
  label: "Home" | "Office" | "Other";
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  gstin?: string;
  isDefault?: boolean;
}): Promise<CustomerAddress> {
  const id = `addr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  // If this address is set as default, unset other defaults
  if (params.isDefault) {
    for (const a of CUSTOMER_ADDRESSES.values()) {
      if (a.userId === params.userId) {
        a.isDefault = false;
      }
    }
  }

  const existing = getCustomerAddresses(params.userId);
  const isDefault = params.isDefault !== undefined ? params.isDefault : existing.length === 0;

  const record: CustomerAddress = {
    id,
    userId: params.userId,
    label: params.label,
    name: params.name,
    phone: params.phone,
    line1: params.line1,
    line2: params.line2,
    city: params.city,
    state: params.state,
    pin: params.pin,
    gstin: params.gstin,
    isDefault,
    createdAt: now,
    updatedAt: now,
  };

  CUSTOMER_ADDRESSES.set(id, record);

  await recordCustomerEvent({
    userId: params.userId,
    customerEmail: params.customerEmail,
    type: "address_added",
    summary: `Added ${params.label} delivery address in ${params.city} (${params.pin}).`,
  });

  return record;
}

export async function updateCustomerAddress(
  id: string,
  userId: string,
  customerEmail: string,
  patch: Partial<CustomerAddress>
): Promise<CustomerAddress> {
  const address = CUSTOMER_ADDRESSES.get(id);
  if (!address || address.userId !== userId) {
    throw new Error("Address not found or permission denied.");
  }

  if (patch.isDefault) {
    for (const a of CUSTOMER_ADDRESSES.values()) {
      if (a.userId === userId) {
        a.isDefault = false;
      }
    }
  }

  Object.assign(address, patch, { updatedAt: new Date().toISOString() });

  await recordCustomerEvent({
    userId,
    customerEmail,
    type: "address_updated",
    summary: `Updated ${address.label} delivery address.`,
  });

  return address;
}

export async function deleteCustomerAddress(
  id: string,
  userId: string,
  customerEmail: string
): Promise<boolean> {
  const address = CUSTOMER_ADDRESSES.get(id);
  if (!address || address.userId !== userId) {
    throw new Error("Address not found or permission denied.");
  }

  CUSTOMER_ADDRESSES.delete(id);

  await recordCustomerEvent({
    userId,
    customerEmail,
    type: "address_deleted",
    summary: `Deleted ${address.label} address in ${address.city}.`,
  });

  return true;
}

// -----------------------------------------------------------------------------
// ORDER ADDRESS UPDATE BEFORE PRINTING
// -----------------------------------------------------------------------------

export async function changeOrderDeliveryAddress(params: {
  orderNumber: string;
  userId: string;
  customerEmail: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
  };
}): Promise<void> {
  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error("Order not found.");
  }

  // Record ownership check
  const orderAddr = (order.address || {}) as Record<string, string>;
  const isOwner = order.userId === params.userId || orderAddr.email === params.customerEmail;
  if (!isOwner) {
    throw new Error("Permission denied: You do not own this order.");
  }

  // Allowed strictly before printing
  const lockedStatuses = ["IN_PRINTING", "DISPATCHED", "DELIVERED", "CANCELLED", "REFUNDED", "RTO"];
  if (lockedStatuses.includes(order.status)) {
    throw new Error(`Delivery address cannot be modified once the order is ${order.status.toLowerCase().replace(/_/g, " ")}.`);
  }

  order.shippingAddress = {
    line1: params.address.line1,
    line2: params.address.line2,
    city: params.address.city,
    state: params.address.state,
    pin: params.address.pin,
  };
  order.version += 1;
  order.updatedAt = new Date().toISOString();

  // Audit event on order
  order.events = [
    {
      id: `evt_addr_${Date.now()}`,
      type: "ADDRESS_UPDATED",
      status: order.status,
      actor: params.customerEmail,
      actorRole: "CUSTOMER",
      message: `Delivery address changed by customer to ${params.address.city} - ${params.address.pin}`,
      createdAt: new Date().toISOString(),
    },
    ...(order.events || []),
  ];

  ORDER_STORE.set(order.id, order);
  ORDER_STORE.set(order.orderNumber, order);

  await recordCustomerEvent({
    userId: params.userId,
    customerEmail: params.customerEmail,
    type: "order_address_changed",
    summary: `Changed delivery address for Order #${params.orderNumber}.`,
    metadata: { orderNumber: params.orderNumber, address: params.address },
  });
}

// -----------------------------------------------------------------------------
// REPORT A PROBLEM (DELIVERED ORDERS WITHIN 7 DAYS)
// -----------------------------------------------------------------------------

export async function reportOrderProblem(params: {
  orderNumber: string;
  userId: string;
  customerEmail: string;
  reason: string;
  comment: string;
  photoUrls: string[];
}): Promise<OrderIssue> {
  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error("Order not found.");
  }

  // Ownership check
  const orderAddr = (order.address || {}) as Record<string, string>;
  const isOwner = order.userId === params.userId || orderAddr.email === params.customerEmail;
  if (!isOwner) {
    throw new Error("Permission denied: You do not own this order.");
  }

  // Must be DELIVERED
  if (order.status !== "DELIVERED") {
    throw new Error("You can only report issues on delivered orders.");
  }

  // Within 7 days window
  const deliveredEvent = order.events?.find((e) => e.status === "DELIVERED");
  const deliveryTime = deliveredEvent ? new Date(deliveredEvent.createdAt).getTime() : new Date(order.updatedAt).getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - deliveryTime > SEVEN_DAYS_MS) {
    throw new Error("Problem reporting window (7 days post-delivery) has expired.");
  }

  const issueId = `issue_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const issue: OrderIssue = {
    id: issueId,
    orderNumber: params.orderNumber,
    userId: params.userId,
    customerEmail: params.customerEmail,
    reason: params.reason,
    comment: params.comment,
    photoUrls: params.photoUrls.slice(0, 3), // max 3 photos
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };

  ORDER_ISSUES.set(issueId, issue);

  // Add event to order timeline
  order.events = [
    {
      id: `evt_issue_${Date.now()}`,
      type: "PROBLEM_REPORTED",
      status: order.status,
      actor: params.customerEmail,
      actorRole: "CUSTOMER",
      message: `Customer reported issue: "${params.reason}" - ${params.comment}`,
      createdAt: now,
    },
    ...(order.events || []),
  ];

  ORDER_STORE.set(order.id, order);
  ORDER_STORE.set(order.orderNumber, order);

  await recordCustomerEvent({
    userId: params.userId,
    customerEmail: params.customerEmail,
    type: "problem_reported",
    summary: `Reported issue on Order #${params.orderNumber}: ${params.reason}`,
    metadata: { orderNumber: params.orderNumber, issueId },
  });

  return issue;
}
