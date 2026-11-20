import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { createRazorpayPaymentLink } from "@/server/quotes/quotes-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (
    !user ||
    (!hasPermission(user.role as never, "admin:view_orders") &&
      !hasPermission(user.role as never, "admin:manage_products"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await createRazorpayPaymentLink(id);

  return NextResponse.json({ success: true, ...result });
}
