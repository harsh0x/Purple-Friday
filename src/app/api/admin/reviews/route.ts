import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import {
  getAdminReviews,
  updateAdminReviewStatus,
} from "@/lib/admin/admin-store";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = getAdminReviews();
  return NextResponse.json({ success: true, reviews });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json({ error: "Valid ID and status (APPROVED/REJECTED) required" }, { status: 400 });
    }

    const updated = updateAdminReviewStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await logAdminAction({
      adminId: (session?.user as { id?: string })?.id || "admin",
      adminEmail: session?.user?.email || "admin@purplefriday.com",
      action: "MODERATE_REVIEW",
      targetId: id,
      details: { status },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error moderating review";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

