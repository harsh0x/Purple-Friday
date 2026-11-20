import { describe, it, expect, beforeEach } from "vitest";
import {
  submitCustomerReview,
  addSupportTicketReply,
  REVIEW_STORE,
  SUPPORT_TICKET_STORE,
} from "@/server/reviews/review-service";

describe("Part 5: Customer Reviews & Support Loop", () => {
  beforeEach(() => {
    REVIEW_STORE.clear();
    SUPPORT_TICKET_STORE.clear();
  });

  it("auto-approves 5-star positive review and marks verified", async () => {
    const result = await submitCustomerReview({
      productId: "prod_hoodie",
      orderNumber: "PF-2026-101",
      authorName: "Ananya Roy",
      rating: 5,
      title: "Superb embroidery and finish",
      body: "Our startup team loved the heavy GSM feel.",
    });

    expect(result.review.rating).toBe(5);
    expect(result.review.status).toBe("APPROVED");
    expect(result.review.verified).toBe(true);
    expect(result.supportTicket).toBeUndefined();
    expect(REVIEW_STORE.has(result.review.id)).toBe(true);
  });

  it("quarantines 1 to 3 star review and automatically spawns a private SupportTicket", async () => {
    const result = await submitCustomerReview({
      productId: "prod_hoodie",
      orderNumber: "PF-2026-202",
      authorName: "Vikram Malhotra",
      rating: 2,
      title: "Print colour differed from pantone proof",
      body: "Logo was slightly desaturated on dark grey fleece.",
    });

    expect(result.review.rating).toBe(2);
    // Quarantined from storefront
    expect(result.review.status).toBe("REJECTED");
    // Private support ticket created
    expect(result.supportTicket).toBeDefined();
    expect(result.supportTicket?.priority).toBe("HIGH");
    expect(result.supportTicket?.orderNumber).toBe("PF-2026-202");
    expect(result.supportTicket?.status).toBe("OPEN");
    expect(result.supportTicket?.messages.length).toBe(1);
    expect(SUPPORT_TICKET_STORE.has(result.supportTicket!.ticketNumber)).toBe(true);
  });

  it("allows staff to reply and resolve support tickets", async () => {
    const { supportTicket } = await submitCustomerReview({
      productId: "prod_tee",
      orderNumber: "PF-2026-303",
      authorName: "Neha Gupta",
      rating: 1,
      title: "Delayed shipment arrival",
      body: "Merchandise arrived 1 day after our event.",
    });

    expect(supportTicket).toBeDefined();
    const ticketNumber = supportTicket!.ticketNumber;

    const updated = await addSupportTicketReply({
      ticketNumber,
      message: "We have credited a ₹5,000 corporate goodwill coupon to your account.",
      newStatus: "RESOLVED",
      actor: "Support Agent",
      actorRole: "SUPPORT_AGENT",
    });

    expect(updated.status).toBe("RESOLVED");
    expect(updated.messages.length).toBe(2);
    expect(updated.messages[1].message).toContain("goodwill coupon");
  });
});