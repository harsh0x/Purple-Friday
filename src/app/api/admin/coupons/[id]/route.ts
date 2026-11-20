import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { toggleCouponActive } from "@/server/coupons/coupon-service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

  if (!user || !hasPermission(user.role as never, "admin:manage_products")) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const result = await toggleCouponActive(id, {
    name: user.name || user.email || "Super Admin",
    role: user.role || "SUPER_ADMIN",
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, coupon: result.coupon });
}
