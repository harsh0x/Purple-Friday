import crypto from "crypto";
import { notify } from "../notifications/notify";
import { notifyAdmin } from "../notifications/admin-dispatcher";

export type CustomerEventType =
  | "registered"
  | "email_changed"
  | "phone_changed"
  | "password_changed"
  | "address_added"
  | "address_updated"
  | "address_deleted"
  | "order_address_changed"
  | "problem_reported"
  | "account_deleted";

export interface CustomerEventRecord {
  id: string;
  userId?: string;
  customerEmail: string;
  type: CustomerEventType;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Global in-memory customer event registry
export const CUSTOMER_EVENTS: CustomerEventRecord[] = [];

/**
 * Records a customer lifecycle event and automatically triggers
 * in-app admin notification without duplicating data.
 */
export async function recordCustomerEvent(params: {
  userId?: string;
  customerEmail: string;
  type: CustomerEventType;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<CustomerEventRecord> {
  const now = new Date().toISOString();
  const id = `cevt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

  const record: CustomerEventRecord = {
    id,
    userId: params.userId,
    customerEmail: params.customerEmail.toLowerCase().trim(),
    type: params.type,
    summary: params.summary,
    metadata: params.metadata,
    createdAt: now,
  };

  CUSTOMER_EVENTS.unshift(record);
  if (CUSTOMER_EVENTS.length > 1000) {
    CUSTOMER_EVENTS.pop();
  }

  // Trigger real-time admin in-app notification via notify()
  await notify("admin_customer_event", "role:SUPER_ADMIN", {
    type: params.type,
    summary: `${params.customerEmail}: ${params.summary}`,
  });

  // Targeted admin alert dispatching across Bell, Email, and Phone push channels
  try {
    if (params.type === "registered") {
      await notifyAdmin("CUSTOMER_REGISTERED", {
        userId: params.userId,
        email: params.customerEmail,
        name: (params.metadata?.name as string) || params.summary,
      });
    } else if (params.type === "problem_reported") {
      await notifyAdmin("PROBLEM_REPORTED", {
        orderNumber: (params.metadata?.orderNumber as string) || "",
        reason: params.summary,
        comment: (params.metadata?.comment as string) || "",
      });
    } else if (
      params.type === "email_changed" ||
      params.type === "phone_changed" ||
      params.type === "address_added" ||
      params.type === "address_updated" ||
      params.type === "address_deleted" ||
      params.type === "order_address_changed"
    ) {
      await notifyAdmin("CUSTOMER_PROFILE_CHANGED", {
        userId: params.userId,
        customerEmail: params.customerEmail,
        field: params.type.replace(/_/g, " "),
        detail: params.summary,
      });
    }
  } catch (err) {
    console.warn("[customer-events] notifyAdmin dispatch error:", err);
  }

  return record;
}

/**
 * Retrieves all events for a given user or email.
 */
export function getCustomerEvents(identifier: string): CustomerEventRecord[] {
  const normalized = identifier.toLowerCase().trim();
  return CUSTOMER_EVENTS.filter(
    (e) => e.customerEmail === normalized || e.userId === identifier
  );
}
