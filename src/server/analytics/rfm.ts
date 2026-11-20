import { StoredOrderRecord } from "@/server/orders/state-machine";
import { toPaise } from "@/server/pricing/engine";
import { ReorderNudgeSettings, DEFAULT_REORDER_NUDGE_SETTINGS } from "@/lib/admin/app-settings";

export type RfmSegment =
  | "VIP Corporate Buyers"
  | "One-Time Sample Buyers"
  | "At-Risk Repeat Clients"
  | "New Customers"
  | "Lapsed";

export interface CustomerRfmProfile {
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  companyName: string;
  city: string;
  state: string;
  totalOrders: number;
  totalSpendPaise: number;
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  averageOrderGapDays: number;
  isOverdueForReorder: boolean;
  daysOverdueForReorder: number;
  draftNudgeMessage: {
    emailSubject: string;
    emailBody: string;
    whatsappText: string;
  };
  recencyScore: number; // 1 to 5
  frequencyScore: number; // 1 to 5
  monetaryScore: number; // 1 to 5
  rfmScore: string; // e.g. "554"
  segment: RfmSegment;
  orders: StoredOrderRecord[];
}

/**
 * Assigns quintile scores (1 to 5) to values based on ranked distribution.
 * Higher values receive higher scores (except recency where lower days = higher recency score).
 */
export function assignQuintileScores(
  values: number[],
  invert: boolean = false
): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [5];

  // Map value with its original index
  const indexed = values.map((val, idx) => ({ val, idx }));
  // Sort ascending
  indexed.sort((a, b) => a.val - b.val);

  const scores = new Array<number>(values.length);
  const n = values.length;

  for (let rank = 0; rank < n; rank++) {
    // Percentile 0.0 to 1.0
    const percentile = (rank + 1) / n;
    let score = 1;
    if (percentile <= 0.2) score = 1;
    else if (percentile <= 0.4) score = 2;
    else if (percentile <= 0.6) score = 3;
    else if (percentile <= 0.8) score = 4;
    else score = 5;

    if (invert) {
      score = 6 - score; // e.g. lowest days since last order gets score 5
    }

    scores[indexed[rank].idx] = score;
  }

  return scores;
}

/**
 * Classifies customer into one of 5 canonical RFM segments based on R, F, and M scores and order profile.
 */
export function classifyRfmSegment(
  r: number,
  f: number,
  m: number,
  totalQty: number,
  totalOrders: number
): RfmSegment {
  // 1. One-Time Sample Buyers: Exactly 1 order of 1-2 pieces
  if (totalOrders === 1 && totalQty <= 2) {
    return "One-Time Sample Buyers";
  }

  // 2. VIP Corporate Buyers: High Frequency (>=4) & High Monetary (>=4) and Recent (>=3)
  if (f >= 4 && m >= 4 && r >= 3) {
    return "VIP Corporate Buyers";
  }

  // 3. At-Risk Repeat Clients: High historical value (F>=3 or M>=3), but inactive recently (R<=2)
  if ((f >= 3 || m >= 3) && r <= 2) {
    return "At-Risk Repeat Clients";
  }

  // 4. New Customers: Recent purchase (R>=4) with 1 or 2 orders
  if (r >= 4 && f <= 2) {
    return "New Customers";
  }

  // 5. Lapsed: Low recency (R<=2) and low frequency
  if (r <= 2) {
    return "Lapsed";
  }

  // Default fallback for intermediate profiles
  return f >= 3 ? "VIP Corporate Buyers" : "New Customers";
}

/**
 * Generates personalized reorder nudge drafts for staff (Email and WhatsApp).
 */
export function generateReorderNudgeDraft(params: {
  customerName: string;
  companyName: string;
  daysSinceLastOrder: number;
  averageGapDays: number;
  lastOrderNumber: string;
}) {
  const subject = `Restocking Corporate Merchandise for ${params.companyName}`;
  const emailBody = `Dear ${params.customerName},\n\nWe hope your team is enjoying your custom merchandise from Purple Friday (Order #${params.lastOrderNumber}).\n\nIt has been ${params.daysSinceLastOrder} days since your last order. Based on your usual reorder cycle (~${params.averageGapDays} days), it's time to check inventory for upcoming new hires, team events, or client gifts.\n\nReply directly to this email or click below to reorder with your approved print proofs with 1-click:\nhttps://purplefriday.in/account/orders/${params.lastOrderNumber}\n\nWarm regards,\nCorporate Merchandising Team\nPurple Friday`;

  const whatsappText = `Hi ${params.customerName}! 👋 Checking in from Purple Friday on WhatsApp. Based on ${params.companyName}'s quarterly schedule (${params.daysSinceLastOrder} days since your last order), you might be due for a merchandise restock. Would you like us to prepare a quick reorder draft for Order #${params.lastOrderNumber}? Reply YES and your dedicated manager will assist!`;

  return { emailSubject: subject, emailBody, whatsappText };
}

/**
 * Pure function: Scores and categorizes all customers using RFM analysis.
 */
export function computeRfmCustomerProfiles(
  orders: StoredOrderRecord[],
  nudgeSettings: ReorderNudgeSettings = DEFAULT_REORDER_NUDGE_SETTINGS,
  nowMs: number = Date.now()
): CustomerRfmProfile[] {
  const ONE_DAY_MS = 24 * 3600 * 1000;

  // 1. Group orders by customer email
  const customerMap = new Map<string, {
    orders: StoredOrderRecord[];
    name: string;
    phone?: string;
    company: string;
    city: string;
    state: string;
  }>();

  for (const o of orders) {
    if (o.status === "CANCELLED" || o.status === "RTO") continue;
    const addr = (o.address || {}) as Record<string, string>;
    const email = addr.customerEmail || addr.email || o.userId || "guest";
    const name = addr.customerName || addr.name || "Client";
    const company = addr.companyName || addr.company || name;
    const phone = addr.customerPhone || addr.phone;
    const city = addr.city || "Bengaluru";
    const state = addr.state || "Karnataka";

    const entry = customerMap.get(email) || {
      orders: [],
      name,
      phone,
      company,
      city,
      state,
    };
    entry.orders.push(o);
    customerMap.set(email, entry);
  }

  if (customerMap.size === 0) return [];

  // Extract raw Recency (days since last order), Frequency (total orders), Monetary (total paise)
  const customerList = Array.from(customerMap.entries()).map(([email, d]) => {
    // Sort chronological
    d.orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const totalOrders = d.orders.length;
    const totalSpendPaise = d.orders.reduce((sum, o) => sum + toPaise(o.total), 0);
    const totalUnits = d.orders.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + it.qty, 0), 0);

    const firstOrderDate = d.orders[0].createdAt;
    const lastOrderDate = d.orders[d.orders.length - 1].createdAt;
    const lastOrderMs = new Date(lastOrderDate).getTime();
    const daysSinceLastOrder = Math.max(0, Math.round((nowMs - lastOrderMs) / ONE_DAY_MS));

    // Calculate customer's average reorder gap
    let averageOrderGapDays = nudgeSettings.defaultReorderGapDays;
    if (totalOrders >= 2) {
      const firstMs = new Date(firstOrderDate).getTime();
      const totalSpanDays = (lastOrderMs - firstMs) / ONE_DAY_MS;
      averageOrderGapDays = Math.max(14, Math.round(totalSpanDays / (totalOrders - 1)));
    }

    const isOverdueForReorder = totalOrders >= 2 && daysSinceLastOrder > averageOrderGapDays;
    const daysOverdueForReorder = isOverdueForReorder ? daysSinceLastOrder - averageOrderGapDays : 0;

    return {
      email,
      ...d,
      totalOrders,
      totalSpendPaise,
      totalUnits,
      firstOrderDate,
      lastOrderDate,
      daysSinceLastOrder,
      averageOrderGapDays,
      isOverdueForReorder,
      daysOverdueForReorder,
    };
  });

  // 2. Assign quintile scores (1 to 5)
  // Recency: fewer days since last order = higher score (invert = true)
  const recencyScores = assignQuintileScores(customerList.map((c) => c.daysSinceLastOrder), true);
  // Frequency: more orders = higher score
  const frequencyScores = assignQuintileScores(customerList.map((c) => c.totalOrders), false);
  // Monetary: higher spend = higher score
  const monetaryScores = assignQuintileScores(customerList.map((c) => c.totalSpendPaise), false);

  // 3. Assemble customer profiles
  const profiles: CustomerRfmProfile[] = customerList.map((c, idx) => {
    const r = recencyScores[idx];
    const f = frequencyScores[idx];
    const m = monetaryScores[idx];
    const rfmScore = `${r}${f}${m}`;
    const segment = classifyRfmSegment(r, f, m, c.totalUnits, c.totalOrders);

    const lastOrder = c.orders[c.orders.length - 1];
    const draftNudgeMessage = generateReorderNudgeDraft({
      customerName: c.name,
      companyName: c.company,
      daysSinceLastOrder: c.daysSinceLastOrder,
      averageGapDays: c.averageOrderGapDays,
      lastOrderNumber: lastOrder.orderNumber,
    });

    return {
      customerId: `cust_${c.email.replace(/[^a-zA-Z0-9]/g, "_")}`,
      customerEmail: c.email,
      customerName: c.name,
      customerPhone: c.phone,
      companyName: c.company,
      city: c.city,
      state: c.state,
      totalOrders: c.totalOrders,
      totalSpendPaise: c.totalSpendPaise,
      firstOrderDate: c.firstOrderDate,
      lastOrderDate: c.lastOrderDate,
      daysSinceLastOrder: c.daysSinceLastOrder,
      averageOrderGapDays: c.averageOrderGapDays,
      isOverdueForReorder: c.isOverdueForReorder,
      daysOverdueForReorder: c.daysOverdueForReorder,
      draftNudgeMessage,
      recencyScore: r,
      frequencyScore: f,
      monetaryScore: m,
      rfmScore,
      segment,
      orders: c.orders,
    };
  });

  return profiles.sort((a, b) => b.totalSpendPaise - a.totalSpendPaise);
}
