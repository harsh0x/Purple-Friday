import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { ORDER_STORE } from "@/server/orders/state-machine";
import {
  computeSampleToBulkConversion,
  computeRetentionCohorts,
  computeAnalyticsMetrics,
} from "@/server/analytics/cohorts";
import { getSampleToBulkSettings, setSampleToBulkSettings } from "@/lib/admin/app-settings";
import { writeAudit } from "@/lib/admin/audit";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = Array.from(ORDER_STORE.values());
  const settings = await getSampleToBulkSettings();

  const sampleToBulk = computeSampleToBulkConversion(orders, settings);
  const cohorts = computeRetentionCohorts(orders, 12);
  const metrics = computeAnalyticsMetrics(orders);

  return NextResponse.json({
    sampleToBulk,
    cohorts,
    metrics,
    settings,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can update analytics parameters" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { sampleMaxQty, bulkMinQty, conversionWindowDays } = body;

    const updated = await setSampleToBulkSettings({
      sampleMaxQty: Number(sampleMaxQty) || 2,
      bulkMinQty: Number(bulkMinQty) || 20,
      conversionWindowDays: Number(conversionWindowDays) || 60,
    });

    await writeAudit({
      actor: session.name,
      actorRole: session.role,
      action: "analytics.settings_updated",
      entityType: "APP_SETTINGS",
      entityId: "sample_to_bulk",
      after: updated as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}