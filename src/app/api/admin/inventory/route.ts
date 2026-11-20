import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import {
  getBlankInventory,
  adjustStock,
} from "@/server/inventory/inventory-service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  // Super Admin, Factory Manager, and Support Agent can view inventory
  if (
    !user ||
    (!hasPermission(user.role as never, "admin:manage_products") &&
      !hasPermission(user.role as never, "admin:manage_production") &&
      !hasPermission(user.role as never, "admin:view_orders"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const lowStockOnly = searchParams.get("lowStockOnly") === "true";

  const inventory = await getBlankInventory({ search, category, lowStockOnly });
  return NextResponse.json({ success: true, inventory });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

  // Super Admin and Factory Manager can adjust blank inventory
  if (
    !user ||
    (!hasPermission(user.role as never, "admin:manage_products") &&
      !hasPermission(user.role as never, "admin:manage_production"))
  ) {
    return NextResponse.json({ error: "Forbidden: Stock adjustments restricted" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { skuId, newStockOnHand, delta, reason, notes, expectedVersion } = body;

    if (!skuId || !reason) {
      return NextResponse.json(
        { error: "SKU ID and adjustment reason are required." },
        { status: 400 }
      );
    }

    const result = await adjustStock({
      skuId,
      newStockOnHand: newStockOnHand !== undefined ? Number(newStockOnHand) : undefined,
      delta: delta !== undefined ? Number(delta) : undefined,
      reason,
      notes,
      expectedVersion,
      actor: {
        name: user.name || user.email || "Warehouse Operator",
        role: user.role || "FACTORY_MANAGER",
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: result.item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to adjust stock";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
