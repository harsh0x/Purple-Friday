import { describe, it, expect, beforeEach } from "vitest";
import { notifyAdmin, formatAdminEvent } from "@/server/notifications/admin-dispatcher";
import {
  savePushSubscription,
  removePushSubscriptionByEndpoint,
  PUSH_SUBSCRIPTIONS,
} from "@/server/notifications/web-push";
import {
  NOTIFICATIONS_STORE,
  createNotification,
  getNotificationsForUserOrRole,
} from "@/lib/admin/notifications";
import {
  ORDER_STORE,
  changeOrderStatus,
  StoredOrderRecord,
} from "@/server/orders/state-machine";
import { MESSAGE_LOGS } from "@/server/notifications/notify";
import { reportOrderProblem } from "@/server/customers/account-service";
import {
  getAdminAlertPreferences,
  updateAdminAlertPreferences,
} from "@/lib/admin/app-settings";

describe("Admin Real-Time Notifications & Push Dispatcher", () => {
  beforeEach(() => {
    NOTIFICATIONS_STORE.length = 0;
    PUSH_SUBSCRIPTIONS.clear();
  });

  it("formats all 10 admin operational events correctly", () => {
    const metaOrder = formatAdminEvent("ORDER_PLACED", {
      orderNumber: "PF-2026-9999",
      customerName: "Aryan Patel",
      total: 250000,
    });
    expect(metaOrder.title).toContain("PF-2026-9999");
    expect(metaOrder.body).toContain("Aryan Patel");
    expect(metaOrder.link).toBe("/admin/orders/PF-2026-9999");

    const metaReview = formatAdminEvent("NEW_REVIEW", {
      orderNumber: "PF-2026-9999",
      customerName: "Sara Khan",
      rating: 5,
      comment: "Superb embroidery and fast turnaround!",
    });
    expect(metaReview.title).toContain("5★");
    expect(metaReview.link).toBe("/admin/reviews");

    const metaQuote = formatAdminEvent("NEW_QUOTE", {
      quoteId: "q_123",
      companyName: "Google India",
      quantity: 500,
    });
    expect(metaQuote.title).toContain("q_123");
    expect(metaQuote.body).toContain("Google India");

    const metaStock = formatAdminEvent("LOW_STOCK_ALERT", {
      productName: "Oversized Hoodie (Black)",
      currentStock: 3,
      threshold: 10,
    });
    expect(metaStock.title).toContain("Oversized Hoodie");
    expect(metaStock.body).toContain("below threshold");
  });

  it("delivers in-app bell notification always regardless of email/phone toggles", async () => {
    await notifyAdmin("ORDER_PLACED", {
      orderNumber: "PF-2026-0001",
      customerName: "Rohan Verma",
      customerEmail: "rohan@example.in",
      total: 450000,
    });

    const notifs = await getNotificationsForUserOrRole(["role:ADMIN"]);
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].title).toContain("PF-2026-0001");
  });

  it("supports delta polling with ?after=lastId returning only newer rows", async () => {
    const n1 = await createNotification({
      userOrRole: "role:ADMIN",
      title: "First Notification",
      body: "Body 1",
    });

    await new Promise((r) => setTimeout(r, 10));

    const n2 = await createNotification({
      userOrRole: "role:ADMIN",
      title: "Second Notification",
      body: "Body 2",
    });

    const allNotifs = await getNotificationsForUserOrRole(["role:ADMIN"]);
    expect(allNotifs.length).toBe(2);

    const deltaNotifs = await getNotificationsForUserOrRole(["role:ADMIN"], n1.id);
    expect(deltaNotifs.length).toBe(1);
    expect(deltaNotifs[0].id).toBe(n2.id);
  });

  it("handles Web Push subscriptions registration and auto-cleanup", async () => {
    const subRecord = await savePushSubscription("role:ADMIN", {
      endpoint: "https://fcm.googleapis.com/fcm/send/test_endpoint_token_123",
      keys: {
        p256dh: "BM_test_p256dh_key",
        auth: "test_auth_secret",
      },
    });

    expect(subRecord.endpoint).toContain("test_endpoint_token_123");
    expect(PUSH_SUBSCRIPTIONS.size).toBe(1);

    removePushSubscriptionByEndpoint("https://fcm.googleapis.com/fcm/send/test_endpoint_token_123");
    expect(PUSH_SUBSCRIPTIONS.size).toBe(0);
  });

  it("saves and audits notification alert channel preferences", async () => {
    const updated = await updateAdminAlertPreferences(
      {
        ORDER_PLACED: { email: true, phone: true },
        LOW_STOCK_ALERT: { email: false, phone: true },
      },
      "admin@purplefriday.in",
      "ADMIN"
    );

    expect(updated.ORDER_PLACED.phone).toBe(true);
    expect(updated.LOW_STOCK_ALERT.email).toBe(false);

    const fetched = await getAdminAlertPreferences();
    expect(fetched.ORDER_PLACED.phone).toBe(true);
  });
});

describe("Order Actions Customer Notifications & Timeline", () => {
  const testOrderNumber = `PF-NOTIF-${Date.now()}`;
  const testOrderId = `ord_test_${Date.now()}`;

  beforeEach(() => {
    const record: StoredOrderRecord = {
      id: testOrderId,
      orderNumber: testOrderNumber,
      userId: "usr_buyer_123",
      status: "IN_PRINTING",
      subtotal: 150000,
      discount: 0,
      gst: 7500,
      shipping: 0,
      total: 157500,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        line1: "123 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
        customerName: "Pooja Hegde",
        email: "pooja@buyer.in",
        phone: "9876543210",
      },
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      events: [],
    };

    ORDER_STORE.set(testOrderId, record);
    ORDER_STORE.set(testOrderNumber, record);
  });

  it("sends customer 'shipped' email with courier tracking when dispatched", async () => {
    await changeOrderStatus(
      testOrderId,
      "DISPATCHED",
      { email: "admin@purplefriday.in", role: "ADMIN" },
      "Packed and handed to BlueDart",
      undefined,
      { courier: "BlueDart Express", trackingNumber: "BD99887766IN" }
    );

    const dispatchedOrder = ORDER_STORE.get(testOrderId)!;
    expect(dispatchedOrder.status).toBe("DISPATCHED");
    expect(dispatchedOrder.trackingNumber).toBe("BD99887766IN");

    const shippedLog = MESSAGE_LOGS.find(
      (m) => m.template === "shipped" && m.recipient.includes("pooja")
    );
    expect(shippedLog).toBeDefined();
    expect(shippedLog?.channel).toBe("email");
  });

  it("sends customer 'delivered' email when marked delivered", async () => {
    // First transition to DISPATCHED
    await changeOrderStatus(
      testOrderId,
      "DISPATCHED",
      { email: "admin@purplefriday.in", role: "ADMIN" },
      "Dispatched"
    );

    // Then transition to DELIVERED
    await changeOrderStatus(
      testOrderId,
      "DELIVERED",
      { email: "admin@purplefriday.in", role: "ADMIN" },
      "Delivered successfully"
    );

    const deliveredLog = MESSAGE_LOGS.find(
      (m) => m.template === "delivered" && m.recipient.includes("pooja")
    );
    expect(deliveredLog).toBeDefined();
  });

  it("handles problem reports and records issues on delivered orders", async () => {
    // Transition to DELIVERED
    const deliveredOrder = ORDER_STORE.get(testOrderId)!;
    deliveredOrder.status = "DELIVERED";
    deliveredOrder.events = [
      {
        id: "evt_deliv_test",
        type: "STATUS_CHANGE",
        status: "DELIVERED",
        actor: "Courier",
        actorRole: "SYSTEM",
        message: "Order delivered",
        createdAt: new Date().toISOString(),
      },
    ];

    const issue = await reportOrderProblem({
      orderNumber: testOrderNumber,
      userId: "usr_buyer_123",
      customerEmail: "pooja@buyer.in",
      reason: "Logo slightly tilted",
      comment: "The chest embroidery is angled by about 5 degrees from horizontal.",
      photoUrls: ["https://images.purplefriday.in/evidence1.jpg"],
    });

    expect(issue.status).toBe("OPEN");
    expect(issue.orderNumber).toBe(testOrderNumber);

    const orderAfterIssue = ORDER_STORE.get(testOrderId)!;
    const issueEvent = orderAfterIssue.events?.find((e) => e.type === "PROBLEM_REPORTED");
    expect(issueEvent).toBeDefined();
    expect(issueEvent?.message).toContain("Logo slightly tilted");
  });

  it("notifies customer and admin when order is cancelled with justification", async () => {
    const cancelOrderId = `ord_cancel_${Date.now()}`;
    const cancelOrderNum = `PF-CANCEL-${Date.now()}`;

    const record: StoredOrderRecord = {
      id: cancelOrderId,
      orderNumber: cancelOrderNum,
      userId: "usr_buyer_999",
      status: "ORDER_PLACED",
      subtotal: 100000,
      discount: 0,
      gst: 5000,
      shipping: 0,
      total: 105000,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      address: {
        customerName: "Karan Johar",
        email: "karan@cinema.in",
      },
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      events: [],
    };

    ORDER_STORE.set(cancelOrderId, record);
    ORDER_STORE.set(cancelOrderNum, record);

    await changeOrderStatus(
      cancelOrderId,
      "CANCELLED",
      { email: "karan@cinema.in", role: "CUSTOMER", name: "Karan Johar" },
      "Changed mind on event dates"
    );

    const cancelLog = MESSAGE_LOGS.find(
      (m) => m.template === "cancelled_or_refunded" && m.recipient.includes("karan")
    );
    expect(cancelLog).toBeDefined();

    const notifs = await getNotificationsForUserOrRole(["role:ADMIN"]);
    const cancelNotif = notifs.find((n) => n.title.includes(cancelOrderNum));
    expect(cancelNotif).toBeDefined();
  });
});
