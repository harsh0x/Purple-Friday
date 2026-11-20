import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { ORDER_STORE } from "@/server/orders/state-machine";
import {
  calculateOrderMargin,
  calculateWaterfallBreakdown,
  aggregateMonthlyMargins,
  resolveItemCogs,
  AD_SPEND_STORE,
  MonthlyAdSpend,
} from "@/server/analytics/margin-engine";
import { getMarginSettings } from "@/lib/admin/app-settings";
import { safeCsvCell } from "@/lib/security/csv";
import { writeAudit } from "@/lib/admin/audit";
import { toPaise } from "@/server/pricing/engine";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get("export");
  const monthFilter = searchParams.get("month"); // e.g. "2026-11"

  const orders = Array.from(ORDER_STORE.values());
  const marginSettings = await getMarginSettings();

  // Aggregate monthly ad spends
  const monthlyAdSpendMap = new Map<string, number>();
  for (const ad of AD_SPEND_STORE.values()) {
    monthlyAdSpendMap.set(ad.month, (monthlyAdSpendMap.get(ad.month) || 0) + ad.amountPaise);
  }

  // 1. Waterfall calculation
  const totalAdSpend = Array.from(monthlyAdSpendMap.values()).reduce((sum, v) => sum + v, 0);
  const filteredOrders = monthFilter
    ? orders.filter((o) => o.createdAt.startsWith(monthFilter))
    : orders;

  const waterfall = calculateWaterfallBreakdown(filteredOrders, totalAdSpend, marginSettings);

  // 2. Monthly margins
  const monthlyMargins = aggregateMonthlyMargins(orders, monthlyAdSpendMap, marginSettings);

  // 3. Order-level margins & alerts
  const orderMargins = filteredOrders.map((o) => {
    // Proportional ad spend based on net revenue share
    const m = calculateOrderMargin(o, 0, marginSettings);
    const addr = (o.address || {}) as Record<string, unknown>;
    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      customerName: (addr.name as string) || (addr.customerName as string) || "Customer",
      itemCount: (o.items || []).reduce((sum, itm) => sum + (itm.qty || 1), 0),
      grossPaise: m.grossInvoicePaise,
      gstPaise: m.gstPaise,
      netRevenuePaise: m.netRevenuePaise,
      cogsPaise: m.cogsPaise,
      gatewayFeePaise: m.gatewayFeePaise,
      shippingCostPaise: m.shippingCostPaise,
      rtoLossPaise: m.rtoLossPaise,
      netMarginPaise: m.netMarginPaise,
      marginPercent: m.marginPercent,
      isLowMargin: m.marginPercent < 15,
      isNegativeMargin: m.netMarginPaise < 0,
    };
  });

  // Sort order margins: lowest margins / alerts first
  orderMargins.sort((a, b) => a.marginPercent - b.marginPercent);

  // 4. Product-level margins
  const productMap = new Map<
    string,
    {
      productId: string;
      title: string;
      unitsSold: number;
      revenuePaise: number;
      cogsPaise: number;
      marginPaise: number;
    }
  >();

  for (const o of filteredOrders) {
    if (o.status === "CANCELLED") continue;
    for (const item of o.items || []) {
      const pid = item.productId;
      const itRec = item as Record<string, unknown>;
      const title = (itRec.title as string) || (itRec.name as string) || pid;
      const qty = item.qty || 1;
      const itemPricePaise = toPaise(item.unitPrice || 0);
      const itemRev = itemPricePaise * qty;
      const cogsObj = resolveItemCogs(title, itemPricePaise);
      const itemCogs = (cogsObj.blankCostPaise + cogsObj.printCostPaise) * qty;
      const existing = productMap.get(pid) || {
        productId: pid,
        title,
        unitsSold: 0,
        revenuePaise: 0,
        cogsPaise: 0,
        marginPaise: 0,
      };

      existing.unitsSold += qty;
      existing.revenuePaise += itemRev;
      existing.cogsPaise += itemCogs;
      existing.marginPaise += itemRev - itemCogs;
      productMap.set(pid, existing);
    }
  }

  const productMargins = Array.from(productMap.values()).map((p) => ({
    ...p,
    marginPercent: p.revenuePaise > 0 ? Math.round((p.marginPaise / p.revenuePaise) * 1000) / 10 : 0,
    isLowMargin: p.revenuePaise > 0 && (p.marginPaise / p.revenuePaise) * 100 < 15,
  }));

  // CSV Export
  if (exportFormat === "csv") {
    const headers = [
      "Order Number",
      "Created At",
      "Status",
      "Gross Invoice (Rs)",
      "GST (Rs)",
      "Net Revenue (Rs)",
      "COGS (Rs)",
      "Gateway Fee (Rs)",
      "Shipping Cost (Rs)",
      "RTO Scrapped Loss (Rs)",
      "Net Margin (Rs)",
      "Margin %",
    ];

    const rows = orderMargins.map((m) => [
      safeCsvCell(m.orderNumber),
      safeCsvCell(m.createdAt),
      safeCsvCell(m.status),
      safeCsvCell((m.grossPaise / 100).toFixed(2)),
      safeCsvCell((m.gstPaise / 100).toFixed(2)),
      safeCsvCell((m.netRevenuePaise / 100).toFixed(2)),
      safeCsvCell((m.cogsPaise / 100).toFixed(2)),
      safeCsvCell((m.gatewayFeePaise / 100).toFixed(2)),
      safeCsvCell((m.shippingCostPaise / 100).toFixed(2)),
      safeCsvCell((m.rtoLossPaise / 100).toFixed(2)),
      safeCsvCell((m.netMarginPaise / 100).toFixed(2)),
      safeCsvCell(`${m.marginPercent}%`),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="purple_friday_true_net_margin_${monthFilter || "all"}.csv"`,
      },
    });
  }

  const lowMarginCount = orderMargins.filter((o) => o.isLowMargin).length;
  const negativeMarginCount = orderMargins.filter((o) => o.isNegativeMargin).length;

  return NextResponse.json({
    waterfall,
    monthlyMargins,
    orderMargins,
    productMargins,
    adSpends: Array.from(AD_SPEND_STORE.values()),
    alerts: {
      lowMarginCount,
      negativeMarginCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admins can record marketing ad spend." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { month, amountPaise, channel, notes } = body;

    if (!month || typeof amountPaise !== "number" || amountPaise < 0) {
      return NextResponse.json({ error: "Invalid month or amount" }, { status: 400 });
    }

    const spendRecord: MonthlyAdSpend = {
      month,
      amountPaise,
      channel: channel || "Digital Performance Marketing",
      notes: notes || "Campaign marketing allocation",
    };

    AD_SPEND_STORE.set(month, spendRecord);

    await writeAudit({
      actor: session.name,
      actorRole: session.role,
      action: "margin.ad_spend_recorded",
      entityType: "AD_SPEND",
      entityId: month,
      after: spendRecord as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, adSpend: spendRecord });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record ad spend";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}