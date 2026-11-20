import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import {
  REVIEW_STORE,
  moderateReview,
} from "@/server/reviews/review-service";
import {
  getAdminReviews,
  updateAdminReviewStatus,
} from "@/lib/admin/admin-store";
import { writeAudit } from "@/lib/admin/audit";

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

  let reviews = Array.from(REVIEW_STORE.values());
  if (reviews.length === 0) {
    reviews = getAdminReviews() as unknown as typeof reviews;
  }

  if (status && status !== "ALL") {
    reviews = reviews.filter((r) => r.status === status);
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

export async function PATCH(req: NextRequest) {
  const adminSession = await getAdminSession();
  const nextAuthSession = await getServerSession(authOptions);

  const isAuthorized =
    Boolean(adminSession) ||
    isUserAdmin(nextAuthSession?.user as { role?: string } | undefined);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, reviewId, status, action } = body;
    const targetId = reviewId || id;
    const targetAction = action || (status === "APPROVED" ? "APPROVE" : "REJECT");

    if (!targetId || (targetAction !== "APPROVE" && targetAction !== "REJECT")) {
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

    await writeAudit({
      actor: adminSession?.name || "Admin",
      actorRole: adminSession?.role || "SUPER_ADMIN",
      action: "reviews.moderated",
      entityType: "REVIEW",
      entityId: targetId,
      after: { status: updatedReview.status },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error moderating review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

