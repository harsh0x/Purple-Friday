import { createNotification } from "@/lib/admin/notifications";
import { getAdminAlertPreferences, AdminAlertPreferences } from "@/lib/admin/app-settings";
import { notify } from "./notify";
import { sendPushNotification } from "./web-push";

export type AdminNotificationEvent = keyof AdminAlertPreferences;

export interface AdminEventData {
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  userId?: string;
  total?: number;
  amount?: number;
  paymentMethod?: string;
  isAdvance?: boolean;
  name?: string;
  email?: string;
  rating?: number;
  comment?: string;
  quoteId?: string;
  companyName?: string;
  quantity?: number;
  reason?: string;
  decision?: "APPROVED" | "REVISION_REQUESTED";
  field?: string;
  detail?: string;
  productId?: string;
  productName?: string;
  currentStock?: number;
  threshold?: number;
  [key: string]: unknown;
}

interface EventMetadata {
  title: string;
  body: string;
  link: string;
}

export function formatAdminEvent(
  event: AdminNotificationEvent,
  data: AdminEventData
): EventMetadata {
  switch (event) {
    case "ORDER_PLACED": {
      const formattedTotal = data.total
        ? `₹${(Math.round(Number(data.total)) / 100).toLocaleString("en-IN")}`
        : "";
      return {
        title: `New Order Received #${data.orderNumber || ""}`,
        body: `Customer ${data.customerName || data.customerEmail || "Buyer"} placed order${
          formattedTotal ? ` for ${formattedTotal}` : ""
        }.`,
        link: `/admin/orders/${data.orderNumber || ""}`,
      };
    }
    case "ORDER_PAID":
      return {
        title: `Payment Received #${data.orderNumber || ""}`,
        body: `Payment verified via ${data.paymentMethod || "Online Gateway"}${
          data.isAdvance ? " (COD Advance)" : ""
        }.`,
        link: `/admin/orders/${data.orderNumber || ""}`,
      };
    case "CUSTOMER_REGISTERED":
      return {
        title: "New Customer Registration",
        body: `${data.name || "Customer"} (${data.email || ""}) verified email and registered.`,
        link: data.userId ? `/admin/customers/${encodeURIComponent(data.userId)}` : `/admin/customers`,
      };
    case "NEW_REVIEW":
      return {
        title: `New Customer Review (${data.rating || 5}★)`,
        body: `${data.customerName || "Customer"} reviewed Order #${data.orderNumber || ""}: "${(
          data.comment || ""
        ).slice(0, 80)}"`,
        link: `/admin/reviews`,
      };
    case "NEW_QUOTE":
      return {
        title: `New Bulk Quote Request #${data.quoteId || ""}`,
        body: `Requested by ${data.companyName || data.customerEmail || "Client"} for ${
          data.quantity || 1
        } units.`,
        link: `/admin/quotes`,
      };
    case "ORDER_CANCELLED":
      return {
        title: `Customer Cancelled Order #${data.orderNumber || ""}`,
        body: `Order was cancelled by ${data.customerName || "Customer"}. Reason: ${
          data.reason || "Self-serve customer request."
        }`,
        link: `/admin/orders/${data.orderNumber || ""}`,
      };
    case "PROBLEM_REPORTED":
      return {
        title: `Problem Reported #${data.orderNumber || ""}`,
        body: `Issue on delivered order: ${data.reason || "Defect"} - "${(
          data.comment || ""
        ).slice(0, 80)}"`,
        link: `/admin/orders/${data.orderNumber || ""}`,
      };
    case "PROOF_DECISION":
      return {
        title: `Proof ${data.decision === "APPROVED" ? "Approved" : "Change Requested"} #${
          data.orderNumber || ""
        }`,
        body:
          data.decision === "APPROVED"
            ? `Customer signed off on the pre-press mockup. Ready for print run.`
            : `Customer requested adjustments: "${(data.comment || "").slice(0, 80)}"`,
        link: `/admin/orders/${data.orderNumber || ""}`,
      };
    case "CUSTOMER_PROFILE_CHANGED":
      return {
        title: `Customer Profile Updated (${data.field || "details"})`,
        body: `${data.customerEmail || "Customer"} updated their ${data.field || "profile"}: ${
          data.detail || ""
        }`,
        link: data.userId ? `/admin/customers/${encodeURIComponent(data.userId)}` : `/admin/customers`,
      };
    case "LOW_STOCK_ALERT":
      return {
        title: `Low Stock Alert: ${data.productName || "Product"}`,
        body: `Current stock (${data.currentStock || 0}) is below threshold of ${
          data.threshold || 10
        } units.`,
        link: `/admin/products`,
      };
    default:
      return {
        title: "Operational Notification",
        body: "New event recorded in system.",
        link: `/admin`,
      };
  }
}

/**
 * Dispatches notification across configured channels for the admin.
 * Bell (In-App) is ALWAYS on.
 * Email & Web Push are governed by AdminAlertPreferences in AppSetting.
 */
export async function notifyAdmin(
  event: AdminNotificationEvent,
  data: AdminEventData
): Promise<void> {
  const meta = formatAdminEvent(event, data);

  // 1. In-App Notification (Bell is ALWAYS on)
  await createNotification({
    userOrRole: "role:ADMIN",
    title: meta.title,
    body: meta.body,
    link: meta.link,
  });

  // Also create for role:SUPER_ADMIN for backward compatibility
  await createNotification({
    userOrRole: "role:SUPER_ADMIN",
    title: meta.title,
    body: meta.body,
    link: meta.link,
  });

  // 2. Read preferences
  const prefs = await getAdminAlertPreferences();
  const alertConfig = prefs[event] || { email: true, phone: false };
  const adminEmail = process.env.ADMIN_EMAIL || "admin@purplefriday.in";

  // 3. Email Alert
  if (alertConfig.email) {
    await notify("admin_alert", adminEmail, {
      subject: meta.title,
      body: meta.body,
      link: meta.link,
      event,
      ...data,
    });
  }

  // 4. Phone Alert (Web Push)
  if (alertConfig.phone) {
    await sendPushNotification("role:ADMIN", {
      title: meta.title,
      body: meta.body,
      link: meta.link,
    });
  }
}
