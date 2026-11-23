import { describe, it, expect, beforeEach } from "vitest";
import {
  submitCustomerReview,
  moderateReview,
  generateReviewInviteToken,
  validateReviewInviteToken,
  REVIEW_STORE,
} from "@/server/reviews/review-service";

  describe("Customer Reviews & Moderation", () => {
    beforeEach(() => {
      REVIEW_STORE.clear();
    });

      it("submits 5-star positive review and marks verified when orderNumber is present", async () => {
        const result = await submitCustomerReview({
          productId: "prod_hoodie",
          orderNumber: "PF-2026-101",
          authorName: "Ananya Roy",
          rating: 5,
          title: "Superb embroidery and finish",
          body: "Our startup team loved the heavy GSM feel.",
        });

        expect(result.review.rating).toBe(5);
        expect(result.review.verified).toBe(true);
        expect(result.review.status).toBe("APPROVED");
        expect(REVIEW_STORE.has(result.review.id)).toBe(true);
      });

        it("quarantines 1 to 3 star review for admin moderation", async () => {
          const result = await submitCustomerReview({
            productId: "prod_hoodie",
            orderNumber: "PF-2026-202",
            authorName: "Vikram Malhotra",
            rating: 2,
            title: "Print colour differed from pantone proof",
            body: "Logo was slightly desaturated on dark grey fleece.",
          });

          expect(result.review.rating).toBe(2);
          expect(result.review.status).toBe("PENDING");
        });

            it("allows admin to approve and reject reviews in moderation queue", async () => {
            const { review } = await submitCustomerReview({
              productId: "prod_tee",
              authorName: "Neha Gupta",
              rating: 3,
              title: "Average fit",
              body: "Slightly tighter than expected.",
            });

            expect(review.status).toBe("PENDING");

              const approved = await moderateReview({
                reviewId: review.id,
                action: "APPROVE",
                actor: "admin@purplefriday.com",
                actorRole: "ADMIN",
              });
              expect(approved.status).toBe("APPROVED");

            const rejected = await moderateReview({
              reviewId: review.id,
              action: "REJECT",
              actor: "admin@purplefriday.com",
              actorRole: "ADMIN",
            });
            expect(rejected.status).toBe("REJECTED");
          });

        it("generates and validates review invitation tokens", () => {
          const token = generateReviewInviteToken("PF-2026-555", "prod_polo");
          expect(typeof token).toBe("string");

          const valid = validateReviewInviteToken(token);
          expect(valid).not.toBeNull();
          expect(valid?.orderNumber).toBe("PF-2026-555");
          expect(valid?.productId).toBe("prod_polo");

          const invalid = validateReviewInviteToken("invalid_fake_token");
          expect(invalid).toBeNull();
        });
      });
