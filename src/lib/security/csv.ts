import { StoredOrder } from "../orders";

/**
 * Sanitizes a CSV cell to prevent CSV Formula Injection (DDE injection).
 * If any cell starts with =, +, -, @, \t, or \r, it is prefixed with a single quote (').
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Check if string begins with unsafe formula trigger characters
  const unsafeTriggers = ["=", "+", "-", "@", "\t", "\r"];
  let safeStr = str;

  if (unsafeTriggers.some((char) => str.startsWith(char))) {
    safeStr = `'${str}`;
  }

  // Escape inner double quotes and wrap in quotes if contains comma, quote, or newline
  if (safeStr.includes('"') || safeStr.includes(",") || safeStr.includes("\n")) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}

export const safeCsvCell = sanitizeCsvCell;

/**
 * Exports an array of orders to a safe, sanitized CSV format.
 */
export function exportOrdersToCsv(orders: StoredOrder[]): string {
  const headers = [
    "Order Number",
    "Date",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Status",
    "Items Count",
    "Taxable Subtotal",
    "Discount",
    "GST 18%",
    "Total INR",
    "Destination City",
    "Destination State",
    "PIN Code",
    "Buyer GSTIN",
  ];

  const rows = orders.map((o) => [
    sanitizeCsvCell(o.orderNumber),
    sanitizeCsvCell(new Date(o.createdAt).toLocaleDateString("en-IN")),
    sanitizeCsvCell(o.customerName),
    sanitizeCsvCell(o.customerEmail),
    sanitizeCsvCell(o.customerPhone),
    sanitizeCsvCell(o.status),
    sanitizeCsvCell(o.items.length),
    sanitizeCsvCell(o.subtotal),
    sanitizeCsvCell(o.discount),
    sanitizeCsvCell(o.gst),
    sanitizeCsvCell(o.total),
    sanitizeCsvCell(o.shippingAddress.city),
    sanitizeCsvCell(o.shippingAddress.state),
    sanitizeCsvCell(o.shippingAddress.pin),
    sanitizeCsvCell(o.gstin || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Exports an array of audit records to safe, formula-injection sanitized CSV.
 */
export function exportAuditLogsToCsv(logs: Array<{
  id: string;
  time: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string;
  ipHash?: string;
}>): string {
  const headers = [
    "Log ID",
    "Timestamp (IST)",
    "Actor",
    "Actor Role",
    "Action",
    "Entity Type",
    "Entity ID",
    "Before Summary",
    "After Summary",
    "Request ID",
    "IP Hash",
  ];

  const rows = logs.map((l) => [
    sanitizeCsvCell(l.id),
    sanitizeCsvCell(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(l.time))
    ),
    sanitizeCsvCell(l.actor),
    sanitizeCsvCell(l.actorRole),
    sanitizeCsvCell(l.action),
    sanitizeCsvCell(l.entityType),
    sanitizeCsvCell(l.entityId || ""),
    sanitizeCsvCell(l.before ? JSON.stringify(l.before) : ""),
    sanitizeCsvCell(l.after ? JSON.stringify(l.after) : ""),
    sanitizeCsvCell(l.requestId || ""),
    sanitizeCsvCell(l.ipHash || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

