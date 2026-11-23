import { ORDER_STORE } from "@/server/orders/state-machine";
import { REVIEW_STORE } from "@/server/reviews/review-service";
import { getAllQuotes } from "@/server/quotes/quotes-service";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export interface KpiTile {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  subtitle: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  priority: "URGENT" | "HIGH" | "MEDIUM";
  href: string;
}

export interface OverviewDashboardData {
  adminName: string;
  greetingText: string;
  kpiTiles: KpiTile[];
  timeSeries: {
    days7: { dates: string[]; netRevenue: number[] };
    days30: { dates: string[]; netRevenue: number[] };
    days90: { dates: string[]; netRevenue: number[] };
  };
  categoryDonut: Array<{
    category: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  attentionItems: AttentionItem[];
  recentActivity: Array<{
    id: string;
    action: string;
    detail: string;
    timestamp: string;
    tag: string;
  }>;
}

export function getIndiaGreeting(): string {
  const now = new Date();
  const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  if (istHours < 12) return "Good morning";
  if (istHours < 17) return "Good afternoon";
  return "Good evening";
}

export async function getOverviewDashboardData(adminName: string = "Admin"): Promise<OverviewDashboardData> {
  const orders = Array.from(new Set(ORDER_STORE.values()));
  const now = new Date();
  const greeting = getIndiaGreeting();

  // India Date string
  const istDateStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const greetingText = `${greeting}, ${adminName} • ${istDateStr}`;

  // 1. Orders Today (India Time)
  const todayIstStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(now); // "YYYY-MM-DD"

  let ordersTodayCount = 0;
  for (const o of orders) {
    const oDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date(o.createdAt));
    if (oDate === todayIstStr) {
      ordersTodayCount++;
    }
  }

  // 2. Revenue This Month (India Time)
  const currentMonthPrefix = todayIstStr.slice(0, 7); // "YYYY-MM"
  let revenueThisMonthPaise = 0;
  for (const o of orders) {
    if (o.status === "CANCELLED") continue;
    const oDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date(o.createdAt));
    if (oDate.startsWith(currentMonthPrefix)) {
      revenueThisMonthPaise += Math.max(0, o.subtotal - (o.discount || 0));
    }
  }

  // 3. Orders Needing Action
  const actionStatuses = new Set([
    "ORDER_PLACED",
    "ARTWORK_UPLOADED",
    "MOCKUP_SENT",
    "REVISION_REQUESTED",
    "CUSTOMER_APPROVED",
  ]);
  const ordersNeedingAction = orders.filter((o) => actionStatuses.has(o.status)).length;

  // 4. Reviews Waiting
  let reviewsWaitingCount = 0;
  for (const rev of REVIEW_STORE.values()) {
    if (rev.status === "PENDING") {
      reviewsWaitingCount++;
    }
  }

  // 5. Open Quotes
  const allQuotes = await getAllQuotes();
  const openQuotesCount = allQuotes.filter(
    (q) => q.status === "DRAFT" || q.status === "SENT"
  ).length;

  // 5 KPI Tiles
  const kpiTiles: KpiTile[] = [
    {
      id: "orders_today",
      label: "Orders today",
      value: ordersTodayCount.toLocaleString("en-IN"),
      numericValue: ordersTodayCount,
      subtitle: "New orders received today",
    },
    {
      id: "revenue_month",
      label: "Revenue this month",
      value: formatCurrency(revenueThisMonthPaise),
      numericValue: Math.round(revenueThisMonthPaise / 100),
      subtitle: "Excluding GST & discounts",
    },
    {
      id: "orders_action",
      label: "Orders needing action",
      value: ordersNeedingAction.toLocaleString("en-IN"),
      numericValue: ordersNeedingAction,
      subtitle: "Awaiting review or printing",
    },
    {
      id: "reviews_waiting",
      label: "Reviews waiting",
      value: reviewsWaitingCount.toLocaleString("en-IN"),
      numericValue: reviewsWaitingCount,
      subtitle: "Customer reviews to moderate",
    },
    {
      id: "open_quotes",
      label: "Open quotes",
      value: openQuotesCount.toLocaleString("en-IN"),
      numericValue: openQuotesCount,
      subtitle: "Active RFQ quotes pending",
    },
  ];

  // 6. Revenue Chart Time Series (7, 30, 90 days in rupees)
  const buildTimeSeries = (numDays: number) => {
    const dates: string[] = [];
    const netRevenue: number[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(d);
      dates.push(formatShortDate(d));

      let dailyPaise = 0;
      for (const o of orders) {
        if (o.status === "CANCELLED") continue;
        const oDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
        }).format(new Date(o.createdAt));
        if (oDate === dStr) {
          dailyPaise += Math.max(0, o.subtotal - (o.discount || 0));
        }
      }
      netRevenue.push(Math.round(dailyPaise / 100)); // In Rupees
    }

    return { dates, netRevenue };
  };

  const timeSeries = {
    days7: buildTimeSeries(7),
    days30: buildTimeSeries(30),
    days90: buildTimeSeries(90),
  };

  // 7. Category Donut
  const categoryCounts = new Map<string, number>();
  let totalItemsCount = 0;
  for (const o of orders) {
    if (o.status === "CANCELLED") continue;
    for (const itm of o.items || []) {
      const cat = ((itm as Record<string, unknown>).category as string) || "Custom Apparel";
      const q = itm.qty || 1;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + q);
      totalItemsCount += q;
    }
  }

  const categoryColors = ["#6A2CFF", "#8E51FF", "#CDB8FF", "#059669", "#D97706", "#2563EB"];
  const categoryDonut = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count], idx) => ({
      category,
      count,
      percentage: totalItemsCount > 0 ? Math.round((count / totalItemsCount) * 100) : 0,
      color: categoryColors[idx % categoryColors.length],
    }));

  // 8. "Needs your attention" list
  const attentionItems: AttentionItem[] = [];

  const waitingApprovalOrders = orders.filter(
    (o) => o.status === "ARTWORK_UPLOADED" || o.status === "REVISION_REQUESTED"
  );
  if (waitingApprovalOrders.length > 0) {
    attentionItems.push({
      id: "attn_approvals",
      title: `${waitingApprovalOrders.length} Order(s) awaiting artwork approval`,
      description: "Customer proofs are waiting to be sent or revisions were requested.",
      badge: "PROOFING",
      priority: "HIGH",
      href: "/admin/orders?status=AWAITING_APPROVAL",
    });
  }

  const pendingPrintingOrders = orders.filter((o) => o.status === "CUSTOMER_APPROVED");
  if (pendingPrintingOrders.length > 0) {
    attentionItems.push({
      id: "attn_printing",
      title: `${pendingPrintingOrders.length} Order(s) ready to print`,
      description: "Proofs have been approved by customers; ready to move into printing.",
      badge: "PRINT READY",
      priority: "MEDIUM",
      href: "/admin/orders?status=CUSTOMER_APPROVED",
    });
  }

  if (reviewsWaitingCount > 0) {
    attentionItems.push({
      id: "attn_reviews",
      title: `${reviewsWaitingCount} Customer review(s) waiting for moderation`,
      description: "New verified customer feedback submitted; approve to show on store.",
      badge: "REVIEWS",
      priority: "MEDIUM",
      href: "/admin/reviews",
    });
  }

  if (openQuotesCount > 0) {
    attentionItems.push({
      id: "attn_quotes",
      title: `${openQuotesCount} Open quote(s) awaiting follow-up`,
      description: "Negotiated RFQs sent to clients or staged as drafts.",
      badge: "QUOTES",
      priority: "MEDIUM",
      href: "/admin/quotes",
    });
  }

  // 9. Recent Activity
  const recentActivity: Array<{
    id: string;
    action: string;
    detail: string;
    timestamp: string;
    tag: string;
  }> = [];

  for (const o of orders.slice(0, 10)) {
    const lastEvent = (o.events && o.events[0]) || null;
    recentActivity.push({
      id: `${o.orderNumber}_${lastEvent?.id || o.id}`,
      action: lastEvent ? lastEvent.message : `Order ${o.orderNumber} placed`,
      detail: `${o.orderNumber} • ${formatCurrency(o.total)}`,
      timestamp: formatShortDate(o.updatedAt || o.createdAt),
      tag: o.status,
    });
  }

  return {
    adminName,
    greetingText,
    kpiTiles,
    timeSeries,
    categoryDonut,
    attentionItems,
    recentActivity: recentActivity.slice(0, 8),
  };
}
