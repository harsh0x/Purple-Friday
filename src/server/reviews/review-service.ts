import crypto from "crypto";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { getReviewSettings } from "@/lib/admin/app-settings";
import { createNotification } from "@/lib/admin/notifications";
import { writeAudit } from "@/lib/admin/audit";
import { IN_MEMORY_PRODUCTS } from "@/server/products/product-service";

async function safeRevalidateTag(tag: string) {
  try {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(tag);
  } catch {}
}

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
  adminReply?: string;
  repliedAt?: string;
  adminRepliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory registries
export const REVIEW_STORE = new Map<string, StoredReview>();
export const REVIEW_TOKEN_MAP = new Map<string, { orderNumber: string; productId: string; expiresAt: number }>();

/**
 * Seed initial review samples so admin list has data immediately.
 */
function seedInitialReviews() {
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
    status: "PENDING",
    verified: true,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  REVIEW_STORE.set(r1.id, r1);
  REVIEW_STORE.set(r2.id, r2);
  REVIEW_STORE.set(r3.id, r3);
}

seedInitialReviews();

/**
 * Generates a secure single-use review invitation token for an order.
 */
export function generateReviewInviteToken(orderNumber: string, productId: string): string {
  const token = `rev_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 days valid
  REVIEW_TOKEN_MAP.set(token, { orderNumber, productId, expiresAt });
  return token;
}

export function validateReviewInviteToken(token: string): { orderNumber: string; productId: string } | null {
  const record = REVIEW_TOKEN_MAP.get(token);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    REVIEW_TOKEN_MAP.delete(token);
    return null;
  }
  return { orderNumber: record.orderNumber, productId: record.productId };
}

/**
 * Checks all DELIVERED orders that reached delivery >= 3 days ago and queues review invitations.
 */
export async function triggerScheduledReviewRequests(): Promise<{ requestsSent: number }> {
  const settings = await getReviewSettings();
  const delayMs = (settings.reviewRequestDelayDays || 3) * 24 * 3600 * 1000;
  const now = Date.now();
  let requestsSent = 0;

    for (const order of new Set(ORDER_STORE.values())) {
      if (order.status !== "DELIVERED") continue;

      const deliveredEvent = (order.events || []).find((e) => e.status === "DELIVERED");
      const deliveredTime = deliveredEvent ? new Date(deliveredEvent.createdAt).getTime() : new Date(order.updatedAt).getTime();

      // Check if >= delay (3 days) has passed
      if (now - deliveredTime >= delayMs) {
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
   * Ingests a customer review.
   */
  export async function submitCustomerReview(params: {
    productId: string;
    orderNumber?: string;
    authorName: string;
    rating: number; // 1 to 5
    title: string;
    body: string;
    photoUrls?: string[];
  }): Promise<{ review: StoredReview }> {
    const reviewSettings = await getReviewSettings();
    const reviewId = `rev_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const isPositive = params.rating >= 4;
    let status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";

    if (isPositive) {
      status = reviewSettings.autoApprovePositiveReviews ? "APPROVED" : "PENDING";
    } else {
      status = "PENDING"; // Quarantined for moderation
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
      createdAt: now,
      updatedAt: now,
    };

    REVIEW_STORE.set(reviewId, review);

    return { review };
  }

  /**
   * Recalculates product rating average and count based strictly on APPROVED reviews.
   * Updates in-memory catalogue and revalidates cache tags.
   */
  export async function recalculateProductRating(productId: string): Promise<{ average: number; count: number }> {
    const approved = Array.from(REVIEW_STORE.values()).filter(
      (r) => (r.productId === productId || r.productTitle === productId) && r.status === "APPROVED"
    );
    const count = approved.length;
    const average =
      count > 0 ? Math.round((approved.reduce((acc, r) => acc + r.rating, 0) / count) * 10) / 10 : 0;

    for (const [key, prod] of IN_MEMORY_PRODUCTS.entries()) {
      if (prod.id === productId || prod.slug === productId || key === productId) {
        prod.rating = average;
        prod.reviewCount = count;
        prod.updatedAt = new Date().toISOString();
      }
    }

    try {
      safeRevalidateTag("catalogue");
      safeRevalidateTag("products");
    } catch {
      // Outside request context in tests
    }

    return { average, count };
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

    await recalculateProductRating(review.productId);

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
   * Staff public reply under customer review (shown publicly on storefront).
   */
  export async function replyToReview(params: {
    reviewId: string;
    replyText: string;
    actor: string;
    actorRole?: string;
  }): Promise<StoredReview> {
    const review = REVIEW_STORE.get(params.reviewId);
    if (!review) throw new Error(`Review ${params.reviewId} not found.`);

    review.adminReply = params.replyText.trim();
    review.repliedAt = new Date().toISOString();
    review.adminRepliedBy = params.actor;
    review.updatedAt = new Date().toISOString();

    await writeAudit({
      actor: params.actor,
      actorRole: params.actorRole || "SUPER_ADMIN",
      action: "reviews.replied",
      entityType: "REVIEW",
      entityId: review.id,
      after: { adminReply: review.adminReply },
    });

    return review;
  }

  /**
   * Staff deletion of review with confirmation and recalculation.
   */
  export async function deleteReview(params: {
    reviewId: string;
    actor: string;
    actorRole?: string;
  }): Promise<boolean> {
    const review = REVIEW_STORE.get(params.reviewId);
    if (!review) throw new Error(`Review ${params.reviewId} not found.`);

    const productId = review.productId;
    REVIEW_STORE.delete(params.reviewId);

    await recalculateProductRating(productId);

    await writeAudit({
      actor: params.actor,
      actorRole: params.actorRole || "SUPER_ADMIN",
      action: "reviews.deleted",
      entityType: "REVIEW",
      entityId: params.reviewId,
    });

    return true;
  }

  /**
   * Bulk approve multiple reviews.
   */
  export async function bulkApproveReviews(params: {
    reviewIds: string[];
    actor: string;
    actorRole?: string;
  }): Promise<{ approvedCount: number }> {
    let count = 0;
    const affectedProducts = new Set<string>();

    for (const id of params.reviewIds) {
      const rev = REVIEW_STORE.get(id);
      if (rev) {
        rev.status = "APPROVED";
        rev.updatedAt = new Date().toISOString();
        affectedProducts.add(rev.productId);
        count++;
      }
    }

    for (const pid of affectedProducts) {
      await recalculateProductRating(pid);
    }

    await writeAudit({
      actor: params.actor,
      actorRole: params.actorRole || "SUPER_ADMIN",
      action: "reviews.bulk_approved",
      entityType: "REVIEW",
      entityId: params.reviewIds.join(","),
      after: { approvedCount: count },
    });

    return { approvedCount: count };
  }
