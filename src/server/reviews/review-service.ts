import crypto from "crypto";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { getReviewSettings } from "@/lib/admin/app-settings";
import { createNotification } from "@/lib/admin/notifications";
import { writeAudit } from "@/lib/admin/audit";

export interface StoredReview {
  id: string;
  productId: string;
  productTitle?: string;
  orderNumber?: string;
  orderId?: string;
  authorName: string;
  rating: number; // 1 to 5
  title: string;
  body: string;
  photoUrls: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  verified: boolean;
  supportTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: string;
  senderRole: string; // CUSTOMER, SUPPORT_AGENT, SUPER_ADMIN
  message: string;
  createdAt: string;
}

export interface StoredSupportTicket {
  id: string;
  ticketNumber: string;
  orderNumber: string;
  orderId?: string;
  reviewId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  status: "OPEN" | "PENDING_CUSTOMER" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignee: string;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

// In-memory registries
export const REVIEW_STORE = new Map<string, StoredReview>();
export const SUPPORT_TICKET_STORE = new Map<string, StoredSupportTicket>();
export const REVIEW_TOKEN_MAP = new Map<string, { orderNumber: string; productId: string; expiresAt: number }>();

/**
 * Seed initial review and ticket samples so admin lists have data immediately.
 */
function seedInitialReviewsAndTickets() {
  if (REVIEW_STORE.size > 0) return;

  const r1: StoredReview = {
    id: "rev_001",
    productId: "prod-polo",
    productTitle: "Classic Pique Polo Shirt",
    orderNumber: "PF-2611-40891",
    authorName: "Ananya Deshmukh",
    rating: 5,
    title: "Exceptional embroidery and fabric quality for our team",
    body: "We ordered 120 polos for our tech summit. The embroidery was crisp, thread color matched our hex code exactly, and delivery was 1 day early.",
    photoUrls: ["/assets/products/polo-navy.jpg"],
    status: "APPROVED",
    verified: true,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const r2: StoredReview = {
    id: "rev_002",
    productId: "prod-hoodie",
    productTitle: "Apex Heavyweight Pullover Hoodie",
    orderNumber: "PF-2611-40892",
    authorName: "Kunal Shah",
    rating: 5,
    title: "Premium fleece, executive team loved the feel",
    body: "Substantial 380 GSM fleece. Very durable ribbed cuffs. Definitely our permanent vendor for winter swag.",
    photoUrls: ["/assets/products/hoodie-black.jpg"],
    status: "APPROVED",
    verified: true,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const r3: StoredReview = {
    id: "rev_003",
    productId: "prod-tumbler",
    productTitle: "Insulated Hydra Flask 750ml",
    orderNumber: "PF-2611-40893",
    authorName: "Vikramaditya Rao",
    rating: 2,
    title: "Engraving alignment slightly off on 3 units",
    body: "Overall flask is great, but 3 units in the batch had laser etching that wasn't centered with the cap seam.",
    photoUrls: [],
    status: "REJECTED", // Not published because <= 3 stars
    verified: true,
    supportTicketId: "TKT-2026-1001",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  REVIEW_STORE.set(r1.id, r1);
  REVIEW_STORE.set(r2.id, r2);
  REVIEW_STORE.set(r3.id, r3);

  // Initial Support Ticket spawned from r3
  const t1: StoredSupportTicket = {
    id: "tkt_001",
    ticketNumber: "TKT-2026-1001",
    orderNumber: "PF-2611-40893",
    reviewId: "rev_003",
    customerName: "Vikramaditya Rao",
    customerEmail: "admin@infosys.com",
    customerPhone: "9876543210",
    subject: "Quality Issue: Laser engraving alignment on 3 flasks (Review Feedback)",
    status: "OPEN",
    priority: "HIGH",
    assignee: "support@purplefriday.in",
    messages: [
      {
        id: "msg_1",
        sender: "Vikramaditya Rao",
        senderRole: "CUSTOMER",
        message: "Customer submitted a 2-star review: 'Engraving alignment slightly off on 3 units. Overall flask is great, but 3 units in the batch had laser etching that wasn't centered.'",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "msg_2",
        sender: "support@purplefriday.in",
        senderRole: "SUPPORT_AGENT",
        message: "Hi Vikramaditya, apologies for the defect! We have alerted our factory QC. We are dispatching 3 complimentary replacements via BlueDart today.",
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  SUPPORT_TICKET_STORE.set(t1.ticketNumber, t1);
}

seedInitialReviewsAndTickets();

/**
 * Generates a secure single-use review invitation token for an order.
 */
export function generateReviewInviteToken(orderNumber: string, productId: string): string {
  const token = `rev_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 days valid
  REVIEW_TOKEN_MAP.set(token, { orderNumber, productId, expiresAt });
  return token;
}

/**
 * Checks all DELIVERED orders that reached delivery >= 3 days ago and queues review invitations.
 */
export async function triggerScheduledReviewRequests(): Promise<{ requestsSent: number }> {
  const settings = await getReviewSettings();
  const delayMs = (settings.reviewRequestDelayDays || 3) * 24 * 3600 * 1000;
  const now = Date.now();
  let requestsSent = 0;

  for (const order of ORDER_STORE.values()) {
    if (order.status !== "DELIVERED") continue;

    const deliveredEvent = (order.events || []).find((e) => e.status === "DELIVERED");
    const deliveredTime = deliveredEvent ? new Date(deliveredEvent.createdAt).getTime() : new Date(order.updatedAt).getTime();

    // Check if >= delay (3 days) has passed
    if (now - deliveredTime >= delayMs) {
      // Check if already requested
      const alreadyRequested = (order.events || []).some((e) => e.type === "REVIEW_REQUESTED");
      if (!alreadyRequested) {
        const firstItem = (order.items || [])[0];
        const productId = firstItem ? firstItem.productId : "general";
        const inviteToken = generateReviewInviteToken(order.orderNumber, productId);

        if (!order.events) order.events = [];
        order.events.push({
          id: `evt_rev_req_${Date.now()}`,
          type: "REVIEW_REQUESTED",
          status: order.status,
          actor: "system@scheduler",
          actorRole: "SYSTEM",
          message: `Automated review invitation queued for delivery after 3 days. Token link generated.`,
          createdAt: new Date().toISOString(),
        });

        await createNotification({
          userOrRole: order.userId || "role:CUSTOMER",
          title: `How is your merchandise from Order #${order.orderNumber}?`,
          body: `Share your review and photo of your custom merchandise to earn exclusive corporate perks.`,
          link: `/review/${inviteToken}`,
        });

        requestsSent++;
      }
    }
  }

  return { requestsSent };
}

/**
 * Ingests a customer review:
 * - 4 to 5 stars with photos: approved candidate (or auto-approved based on AppSettings)
 * - 1 to 3 stars: strictly NOT published, automatically spawns private SupportTicket
 */
export async function submitCustomerReview(params: {
  productId: string;
  orderNumber?: string;
  authorName: string;
  rating: number; // 1 to 5
  title: string;
  body: string;
  photoUrls?: string[];
}): Promise<{ review: StoredReview; supportTicket?: StoredSupportTicket }> {
  const reviewSettings = await getReviewSettings();
  const reviewId = `rev_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const isPositive = params.rating >= 4;
  let status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";
  let supportTicket: StoredSupportTicket | undefined = undefined;

  if (isPositive) {
    status = reviewSettings.autoApprovePositiveReviews ? "APPROVED" : "PENDING";
  } else {
    // 1 to 3 stars: NOT published, automatically triggers private SupportTicket
    status = "REJECTED";

    const ticketNumber = `TKT-${new Date().getFullYear()}-${1000 + SUPPORT_TICKET_STORE.size + 1}`;
    const order = params.orderNumber ? ORDER_STORE.get(params.orderNumber) : undefined;
    const addr = (order?.address || {}) as Record<string, string>;

    supportTicket = {
      id: `tkt_${crypto.randomUUID()}`,
      ticketNumber,
      orderNumber: params.orderNumber || "PF-GENERAL",
      orderId: order?.id,
      reviewId,
      customerName: params.authorName,
      customerEmail: addr.customerEmail || addr.email || "support.incoming@purplefriday.in",
      customerPhone: addr.customerPhone || addr.phone,
      subject: `Customer Feedback Alert (${params.rating}★): ${params.title}`,
      status: "OPEN",
      priority: params.rating === 1 ? "URGENT" : "HIGH",
      assignee: "support@purplefriday.in",
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: params.authorName,
          senderRole: "CUSTOMER",
          message: `Customer submitted ${params.rating}-star review: "${params.title}" - ${params.body}`,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    SUPPORT_TICKET_STORE.set(ticketNumber, supportTicket);

    // Notify Support Team
    await createNotification({
      userOrRole: "role:SUPPORT_AGENT",
      title: `New Support Ticket ${ticketNumber}: Low rating (${params.rating}★) on Order #${params.orderNumber || "N/A"}`,
      body: `Customer ${params.authorName} left low feedback. Review quarantined from storefront. Follow up initiated.`,
      link: `/admin/support`,
    });
  }

  const review: StoredReview = {
    id: reviewId,
    productId: params.productId,
    orderNumber: params.orderNumber,
    authorName: params.authorName,
    rating: params.rating,
    title: params.title,
    body: params.body,
    photoUrls: params.photoUrls || [],
    status,
    verified: Boolean(params.orderNumber),
    supportTicketId: supportTicket?.ticketNumber,
    createdAt: now,
    updatedAt: now,
  };

  REVIEW_STORE.set(reviewId, review);

  return { review, supportTicket };
}

/**
 * Staff moderation of customer reviews.
 */
export async function moderateReview(params: {
  reviewId: string;
  action: "APPROVE" | "REJECT";
  actor: string;
  actorRole: string;
}): Promise<StoredReview> {
  const review = REVIEW_STORE.get(params.reviewId);
  if (!review) {
    throw new Error(`Review ${params.reviewId} not found.`);
  }

  const previousStatus = review.status;
  review.status = params.action === "APPROVE" ? "APPROVED" : "REJECTED";
  review.updatedAt = new Date().toISOString();

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "reviews.moderated",
    entityType: "REVIEW",
    entityId: review.id,
    before: { status: previousStatus },
    after: { status: review.status },
  });

  return review;
}

/**
 * Add a message / reply to a support ticket.
 */
export async function addSupportTicketReply(params: {
  ticketNumber: string;
  message: string;
  newStatus?: StoredSupportTicket["status"];
  actor: string;
  actorRole: string;
}): Promise<StoredSupportTicket> {
  const ticket = SUPPORT_TICKET_STORE.get(params.ticketNumber);
  if (!ticket) {
    throw new Error(`Support ticket ${params.ticketNumber} not found.`);
  }

  ticket.messages.push({
    id: `msg_${Date.now()}`,
    sender: params.actor,
    senderRole: params.actorRole,
    message: params.message,
    createdAt: new Date().toISOString(),
  });

  if (params.newStatus) {
    ticket.status = params.newStatus;
  }
  ticket.updatedAt = new Date().toISOString();

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "support.ticket_reply",
    entityType: "SUPPORT_TICKET",
    entityId: ticket.ticketNumber,
    after: { status: ticket.status, message: params.message },
  });

  return ticket;
}
