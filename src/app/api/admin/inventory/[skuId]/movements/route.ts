import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getStockMovements } from "@/server/inventory/inventory-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ skuId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (
    !user ||
    (!hasPermission(user.role as never, "admin:manage_products") &&
      !hasPermission(user.role as never, "admin:manage_production"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { skuId } = await params;
  const movements = await getStockMovements(skuId);

  return NextResponse.json({ success: true, movements });
}
