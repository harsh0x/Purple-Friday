import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { ORDER_STORE } from "@/server/orders/state-machine";
import {
  computeBlankSkuForecast,
  DEFAULT_SEASONAL_INDICES,
  generateSupplierPoCsv,
  BLANK_SKU_REGISTRY,
} from "@/server/inventory/forecasting";
import { writeAudit } from "@/lib/admin/audit";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get("export");

  const orders = Array.from(ORDER_STORE.values());
  const currentMonth = new Date().getMonth() + 1;

  const forecasts = BLANK_SKU_REGISTRY.map((sku) =>
    computeBlankSkuForecast({
      ...sku,
      orders,
      targetMonth: currentMonth,
    })
  );

  // CSV PO Export
  if (exportFormat === "csv") {
    const csvContent = generateSupplierPoCsv(forecasts);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="purple_friday_supplier_purchase_order_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const reorderNowCount = forecasts.filter((f) => f.needsReorder).length;

  return NextResponse.json({
    forecasts,
    alertsCount: reorderNowCount,
    seasonalIndices: DEFAULT_SEASONAL_INDICES,
    currentMonth,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can update forecasting parameters" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { month, multiplier, notes } = body;

    const idx = DEFAULT_SEASONAL_INDICES.find((m) => m.month === Number(month));
    if (!idx) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    const previousMultiplier = idx.multiplier;
    idx.multiplier = Number(multiplier);
    if (notes) idx.notes = notes;

    await writeAudit({
      actor: session.name,
      actorRole: session.role,
      action: "forecasting.seasonal_index_updated",
      entityType: "FORECASTING",
      entityId: `month_${month}`,
      before: { multiplier: previousMultiplier },
      after: { multiplier: idx.multiplier, notes: idx.notes },
    });

    return NextResponse.json({ success: true, updated: idx });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update seasonal index";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}