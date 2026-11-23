import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import {
  REVIEW_STORE,
  moderateReview,
  replyToReview,
  deleteReview,
  bulkApproveReviews,
} from "@/server/reviews/review-service";
import {
  getAdminReviews,
  updateAdminReviewStatus,
} from "@/lib/admin/admin-store";

  export async function GET(req: NextRequest) {
    const adminSession = await getAdminSession();
    const nextAuthSession = await getServerSession(authOptions);

    const isAuthorized =
      Boolean(adminSession) ||
      isUserAdmin(nextAuthSession?.user as { role?: string } | undefined);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const ratingFilter = searchParams.get("rating");
    const query = searchParams.get("q")?.toLowerCase();

      let reviews = Array.from(REVIEW_STORE.values());
      if (reviews.length === 0) {
        reviews = getAdminReviews() as unknown as typeof reviews;
      }

      if (status && status !== "ALL") {
        reviews = reviews.filter((r) => r.status === status);
      }

      if (ratingFilter) {
        const targetRating = parseInt(ratingFilter, 10);
        if (!isNaN(targetRating)) {
          reviews = reviews.filter((r) => r.rating === targetRating);
        }
      }

      if (query) {
        reviews = reviews.filter(
          (r) =>
            r.authorName.toLowerCase().includes(query) ||
            r.title.toLowerCase().includes(query) ||
            r.body.toLowerCase().includes(query) ||
            (r.productTitle && r.productTitle.toLowerCase().includes(query)) ||
            (r.orderNumber && r.orderNumber.toLowerCase().includes(query))
        );
      }

      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const allReviews = Array.from(REVIEW_STORE.values());

      return NextResponse.json({
        success: true,
        reviews,
        counts: {
          all: allReviews.length,
          pending: allReviews.filter((r) => r.status === "PENDING").length,
          approved: allReviews.filter((r) => r.status === "APPROVED").length,
          rejected: allReviews.filter((r) => r.status === "REJECTED").length,
        },
      });
    }

    export async function POST(req: NextRequest) {
      const adminSession = await getAdminSession();
      const nextAuthSession = await getServerSession(authOptions);

      const isAuthorized =
        Boolean(adminSession) ||
        isUserAdmin(nextAuthSession?.user as { role?: string } | undefined);

      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const actorEmail = adminSession?.email || nextAuthSession?.user?.email || "admin@purplefriday.in";
      const actorRole = adminSession?.role || (nextAuthSession?.user as { role?: string })?.role || "SUPER_ADMIN";

      try {
        const body = await req.json();
        const { action, reviewId, replyText, reviewIds } = body;

        if (action === "REPLY") {
          if (!reviewId || !replyText?.trim()) {
            return NextResponse.json({ error: "Review ID and reply text are required" }, { status: 400 });
          }
          const updated = await replyToReview({
            reviewId,
            replyText,
            actor: actorEmail,
            actorRole,
          });
          return NextResponse.json({ success: true, review: updated });
        }

          if (action === "BULK_APPROVE") {
            if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
              return NextResponse.json({ error: "Array of reviewIds is required" }, { status: 400 });
            }
            const res = await bulkApproveReviews({
              reviewIds,
              actor: actorEmail,
              actorRole,
            });
            return NextResponse.json({ success: true, ...res });
          }

          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error processing review action";
          return NextResponse.json({ error: msg }, { status: 500 });
        }
      }

      export async function PATCH(req: NextRequest) {
        const adminSession = await getAdminSession();
        const nextAuthSession = await getServerSession(authOptions);

          const isAuthorized =
            Boolean(adminSession) ||
            isUserAdmin(nextAuthSession?.user as { role?: string } | undefined);

          if(!isAuthorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

  try {
            const body = await req.json();
            const { id, reviewId, status, action } = body;
            const targetId = reviewId || id;
            const targetAction = action || (status === "APPROVED" ? "APPROVE" : "REJECT");

            if(!targetId || (targetAction !== "APPROVE" && targetAction !== "REJECT")) {
          return NextResponse.json(
            { error: "Valid ID and action (APPROVE/REJECT) required" },
            { status: 400 }
          );
        }

        let updatedReview;
        if (REVIEW_STORE.has(targetId)) {
          updatedReview = await moderateReview({
            reviewId: targetId,
            action: targetAction,
            actor: adminSession?.name || "Admin",
            actorRole: adminSession?.role || "SUPER_ADMIN",
          });
        } else {
          updatedReview = updateAdminReviewStatus(targetId, targetAction === "APPROVE" ? "APPROVED" : "REJECTED");
        }

          if (!updatedReview) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
          }

          return NextResponse.json({ success: true, review: updatedReview });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error moderating review";
          return NextResponse.json({ error: msg }, { status: 500 });
        }
      }

      export async function DELETE(req: NextRequest) {
        const adminSession = await getAdminSession();
        const nextAuthSession = await getServerSession(authOptions);

          const isAuthorized =
            Boolean(adminSession) ||
            isUserAdmin(nextAuthSession?.user as { role?: string } | undefined);

          if (!isAuthorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const actorEmail = adminSession?.email || nextAuthSession?.user?.email || "admin@purplefriday.in";
          const actorRole = adminSession?.role || (nextAuthSession?.user as { role?: string })?.role || "SUPER_ADMIN";

          try {
            const { searchParams } = new URL(req.url);
            const paramId = searchParams.get("id") || searchParams.get("reviewId");
            const body = paramId ? {} : await req.json().catch(() => ({}));
            const reviewId = paramId || body.reviewId || body.id;

            if (!reviewId) {
              return NextResponse.json({ error: "Review ID required" }, { status: 400 });
            }

    const deleted = await deleteReview({
          reviewId,
          actor: actorEmail,
          actorRole,
        });

        return NextResponse.json({ success: deleted });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error deleting review";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    export async function PUT(req: NextRequest) {
      return PATCH(req);
    }

