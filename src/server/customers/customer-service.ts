import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";
import { REVIEW_STORE, StoredReview } from "@/server/reviews/review-service";
import { safeCsvCell } from "@/lib/security/csv";
import { writeAudit } from "@/lib/admin/audit";

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalPaise: number;
}

export interface CustomerProfile {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  city: string;
  orderCount: number;
  totalSpendPaise: number;
  lastOrderDate: string;
  orders: CustomerOrderSummary[];
}

export function computeCustomerProfiles(orders: StoredOrderRecord[]): CustomerProfile[] {
  const map = new Map<string, CustomerProfile>();

  for (const order of orders) {
    const address = (order.address || {}) as Record<string, unknown>;
    const emailCandidate =
      order.customerEmail ||
      (typeof address.email === "string" ? address.email : null) ||
      (typeof order.userId === "string" && order.userId.includes("@") ? order.userId : null) ||
      "";
    const emailKey = emailCandidate.trim().toLowerCase();
    if (!emailKey) continue;

    let profile = map.get(emailKey);
    const orderPaise =
      typeof order.subtotal === "number"
        ? Math.round(Math.max(0, (order.subtotal - (order.discount || 0)) * 100))
        : 0;

    const orderSummary: CustomerOrderSummary = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      totalPaise: orderPaise,
    };

    const resolvedName =
      order.customerName ||
      (typeof address.name === "string" ? address.name : null) ||
      (typeof address.recipientName === "string" ? address.recipientName : null) ||
      "Customer";
    const resolvedPhone =
      order.customerPhone ||
      (typeof address.phone === "string" ? address.phone : null) ||
      (typeof address.recipientPhone === "string" ? address.recipientPhone : null) ||
      "";
    const resolvedCompany =
      order.companyName ||
      (typeof address.company === "string" ? address.company : null) ||
      (typeof address.companyName === "string" ? address.companyName : null) ||
      "";
    const resolvedCity =
      order.shippingAddress?.city ||
      (typeof address.city === "string" ? address.city : null) ||
      "";

    if (!profile) {
      profile = {
        customerId: emailKey,
        customerName: resolvedName,
        customerEmail: emailCandidate,
        customerPhone: resolvedPhone,
        companyName: resolvedCompany,
        city: resolvedCity,
        orderCount: 1,
        totalSpendPaise: orderPaise,
        lastOrderDate: order.createdAt,
        orders: [orderSummary],
      };
      map.set(emailKey, profile);
    } else {
      profile.orderCount += 1;
      profile.totalSpendPaise += orderPaise;
      profile.orders.push(orderSummary);
      if (new Date(order.createdAt).getTime() > new Date(profile.lastOrderDate).getTime()) {
        profile.lastOrderDate = order.createdAt;
        if (resolvedName !== "Customer") profile.customerName = resolvedName;
        if (resolvedPhone) profile.customerPhone = resolvedPhone;
        if (resolvedCompany) profile.companyName = resolvedCompany;
        if (resolvedCity) profile.city = resolvedCity;
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
  );
}

// Registry for private admin notes on customers (Customer details themselves are strictly read-only)
export const CUSTOMER_NOTES = new Map<string, string>();

/**
 * Saves a private administrative note for a customer.
 */
export async function setCustomerNote(
  customerId: string,
  note: string,
  actor: string,
  actorRole?: string
): Promise<{ success: boolean; note: string }> {
  const cleanId = customerId.trim().toLowerCase();
  CUSTOMER_NOTES.set(cleanId, note.trim());

  await writeAudit({
    actor,
    actorRole: actorRole || "SUPER_ADMIN",
    action: "customer.note_updated",
    entityType: "CUSTOMER",
    entityId: cleanId,
    after: { note: note.trim() },
  });

  return { success: true, note: note.trim() };
}

/**
 * Returns complete aggregated customer detail: profile, all orders, reviews, and private admin note.
 */
export async function getCustomerDetail(customerId: string): Promise<{
  profile: CustomerProfile;
  orders: StoredOrderRecord[];
  reviews: StoredReview[];
  privateNote: string;
  totalSpentPaise: number;
} | null> {
  const cleanId = decodeURIComponent(customerId).trim().toLowerCase();
  const allOrders = Array.from(new Set(ORDER_STORE.values()));
  const profiles = computeCustomerProfiles(allOrders);

  const profile = profiles.find(
    (p) =>
      p.customerId.toLowerCase() === cleanId ||
      p.customerEmail.toLowerCase() === cleanId
  );

  if (!profile) return null;

  // Filter orders for this customer
  const customerOrders = allOrders.filter((o) => {
    const addr = (o.address || {}) as Record<string, string>;
    const email = (o.customerEmail || addr.email || (typeof o.userId === "string" && o.userId.includes("@") ? o.userId : "")).toLowerCase();
    const phone = (o.customerPhone || addr.phone || "").replace(/\D/g, "");
    const profPhone = profile.customerPhone.replace(/\D/g, "");
    return (
      email === profile.customerEmail.toLowerCase() ||
      (phone && profPhone && phone === profPhone)
    );
  });

  // Filter reviews for this customer
  const allReviews = Array.from(REVIEW_STORE.values());
  const orderNums = new Set(customerOrders.map((o) => o.orderNumber));
  const customerReviews = allReviews.filter(
    (r) =>
      (r.orderNumber && orderNums.has(r.orderNumber)) ||
      r.authorName.toLowerCase() === profile.customerName.toLowerCase()
  );

  const privateNote =
    CUSTOMER_NOTES.get(profile.customerId.toLowerCase()) ||
    CUSTOMER_NOTES.get(profile.customerEmail.toLowerCase()) ||
    "";

  return {
    profile,
    orders: customerOrders,
    reviews: customerReviews,
    privateNote,
    totalSpentPaise: profile.totalSpendPaise,
  };
}

/**
 * Exports customers list to CSV with safe formula injection escaping.
 */
export function exportCustomersCsv(profiles: CustomerProfile[]): string {
  const headers = [
    "Customer Name",
    "Email",
    "Phone",
    "Company",
    "City",
    "Total Orders",
    "Lifetime Spend (INR)",
    "Last Order Date",
  ];

  const rows = profiles.map((p) => [
    safeCsvCell(p.customerName),
    safeCsvCell(p.customerEmail),
    safeCsvCell(p.customerPhone),
    safeCsvCell(p.companyName),
    safeCsvCell(p.city),
    safeCsvCell(String(p.orderCount)),
    safeCsvCell((p.totalSpendPaise / 100).toFixed(2)),
    safeCsvCell(p.lastOrderDate),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
