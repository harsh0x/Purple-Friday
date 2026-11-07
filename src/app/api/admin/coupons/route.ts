import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import {
  getAdminCoupons,
  saveAdminCoupon,
  deleteAdminCoupon,
} from "@/lib/admin/admin-store";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupons = getAdminCoupons();
  return NextResponse.json({ success: true, coupons });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, code, type, value, minSubtotal, firstOrderOnly, expiresAt, active } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required coupon fields" }, { status: 400 });
    }

    const saved = saveAdminCoupon({
      id,
      code,
      type: type === "FLAT" ? "FLAT" : "PERCENTAGE",
      value: Number(value),
      minSubtotal: Number(minSubtotal || 0),
      firstOrderOnly: Boolean(firstOrderOnly),
      expiresAt: expiresAt || null,
      active: active !== undefined ? Boolean(active) : true,
    });

    await logAdminAction({
      adminId: (session?.user as { id?: string })?.id || "admin",
      adminEmail: session?.user?.email || "admin@purplefriday.com",
      action: id ? "UPDATE_COUPON" : "CREATE_COUPON",
      targetId: saved.code,
      details: { type: saved.type, value: saved.value, active: saved.active },
    });

    return NextResponse.json({ success: true, coupon: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving coupon";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
  }

  const deleted = deleteAdminCoupon(id);
  if (deleted) {
    await logAdminAction({
      adminId: (session?.user as { id?: string })?.id || "admin",
      adminEmail: session?.user?.email || "admin@purplefriday.com",
      action: "DELETE_COUPON",
      targetId: id,
    });
  }

  return NextResponse.json({ success: deleted });
}

