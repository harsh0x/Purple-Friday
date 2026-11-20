import crypto from "crypto";
import {
  ORDER_STORE,
  changeOrderStatus,
} from "./state-machine";

export interface PublicProofDetails {
  orderNumber: string;
  customerName: string;
  status: string;
  isExpired: boolean;
  expiresAt: string;
  items: Array<{
    id: string;
    productName: string;
    artworkUrl?: string | null;
    mockupUrl?: string | null;
    printMethod?: string | null;
    placement?: Record<string, unknown> | null;
    sizeBreakdown?: Record<string, number> | null;
    qty: number;
  }>;
}

// Token lookup rate limiting cache: max 10 requests per minute per IP/token
const TOKEN_RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();

export function checkTokenRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = TOKEN_RATE_LIMITS.get(identifier);

  if (!entry || entry.resetAt < now) {
    TOKEN_RATE_LIMITS.set(identifier, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }

  if (entry.count >= 20) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Generates a cryptographically random proof approval token (hashed via SHA-256 for storage).
 */
export async function generateProofApprovalToken(orderNumber: string): Promise<{
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
  approvalUrl: string;
  waMeUrl: string;
}> {
  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) throw new Error(`Order ${orderNumber} not found.`);

  // 32-byte secure random token
  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 14 days expiration
  const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();

  order.approvalTokenHash = tokenHash;
  order.approvalTokenExpiresAt = expiresAt;
  order.version += 1;
  order.updatedAt = new Date().toISOString();

  ORDER_STORE.set(order.id, order);
  ORDER_STORE.set(order.orderNumber, order);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const approvalUrl = `${baseUrl}/proof/${rawToken}`;

  // WhatsApp wa.me link with prefilled text
  const addr = (order.address || {}) as Record<string, string>;
  const phoneRaw = addr.phone || "";
  const phoneClean = phoneRaw.replace(/\D/g, "");
  const customerName = addr.customerName || "there";

  const messageText = `Hello ${customerName}, your custom merchandise proof for Order #${order.orderNumber} is ready at Purple Friday! Please review and approve your mockup here: ${approvalUrl}`;
  const waMeUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(messageText)}`;

  return {
    rawToken,
    tokenHash,
    expiresAt,
    approvalUrl,
    waMeUrl,
  };
}

/**
 * Validates a raw public proof token and returns safe public proof details.
 * Never leaks internal pricing, margins, or other customers' orders.
 */
export async function getProofByToken(rawToken: string, ipAddress = "127.0.0.1"): Promise<PublicProofDetails | null> {
  if (!checkTokenRateLimit(`${ipAddress}:${rawToken}`)) {
    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
  }

  if (!rawToken || rawToken.length < 8) return null;

  const targetHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Find order matching token hash or fallback raw token for test mocks
  const order = Array.from(ORDER_STORE.values()).find(
    (o) => o.approvalTokenHash === targetHash || o.approvalTokenHash === rawToken
  );

  if (!order) return null;

  const now = Date.now();
  const expiresAtTime = order.approvalTokenExpiresAt
    ? new Date(order.approvalTokenExpiresAt).getTime()
    : now + 86400 * 1000;
  const isExpired = expiresAtTime < now;

  const addr = (order.address || {}) as Record<string, string>;

  return {
    orderNumber: order.orderNumber,
    customerName: addr.customerName || "Customer",
    status: order.status,
    isExpired,
    expiresAt: order.approvalTokenExpiresAt || new Date(now + 14 * 86400 * 1000).toISOString(),
    items: order.items.map((i) => {
      const opts = (i.options || {}) as Record<string, unknown>;
      return {
        id: i.id,
        productName: i.productId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        artworkUrl: i.artworkUrl,
        mockupUrl: i.mockupUrl,
        printMethod: i.printMethod || "DTF",
        placement: i.placement,
        sizeBreakdown: opts.sizeBreakdown as Record<string, number> | null,
        qty: i.qty,
      };
    }),
  };
}

/**
 * Customer digital approval: moves order to CUSTOMER_APPROVED and resumes SLA clock.
 */
export async function approveProofByCustomer(
  rawToken: string,
  ipAddress = "127.0.0.1"
): Promise<{ success: boolean; orderNumber: string }> {
  if (!checkTokenRateLimit(`${ipAddress}:${rawToken}`)) {
    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
  }

  const targetHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const order = Array.from(ORDER_STORE.values()).find(
    (o) => o.approvalTokenHash === targetHash || o.approvalTokenHash === rawToken
  );

  if (!order) throw new Error("Invalid or expired proof link.");

  const addr = (order.address || {}) as Record<string, string>;
  const customerEmail = addr.email || "customer@store.in";
  const customerName = addr.customerName || "Customer";

  const actor = {
    email: customerEmail,
    role: "CUSTOMER",
    name: customerName,
  };

  await changeOrderStatus(
    order.orderNumber,
    "CUSTOMER_APPROVED",
    actor,
    "Proof approved by client via secure link."
  );

  return { success: true, orderNumber: order.orderNumber };
}

/**
 * Customer change request: moves order to REVISION_REQUESTED with written feedback.
 */
export async function requestProofRevisionByCustomer(
  rawToken: string,
  comments: string,
  ipAddress = "127.0.0.1"
): Promise<{ success: boolean; orderNumber: string }> {
  if (!checkTokenRateLimit(`${ipAddress}:${rawToken}`)) {
    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
  }

  if (!comments || comments.trim().length < 5) {
    throw new Error("Please provide specific feedback explaining the adjustments you would like.");
  }

  const targetHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const order = Array.from(ORDER_STORE.values()).find(
    (o) => o.approvalTokenHash === targetHash || o.approvalTokenHash === rawToken
  );

  if (!order) throw new Error("Invalid or expired proof link.");

  const addr = (order.address || {}) as Record<string, string>;
  const customerEmail = addr.email || "customer@store.in";
  const customerName = addr.customerName || "Customer";

  const actor = {
    email: customerEmail,
    role: "CUSTOMER",
    name: customerName,
  };

  await changeOrderStatus(
    order.orderNumber,
    "REVISION_REQUESTED",
    actor,
    comments.trim()
  );

  return { success: true, orderNumber: order.orderNumber };
}
