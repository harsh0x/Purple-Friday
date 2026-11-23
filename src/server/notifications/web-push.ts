// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require("web-push");
import crypto from "crypto";
import { MESSAGE_LOGS, maskRecipient } from "./notify";

export interface PushSubscriptionRecord {
  id: string;
  userOrRole: string; // e.g. "role:ADMIN" or "usr_123"
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

// Global in-memory push subscriptions store
export const PUSH_SUBSCRIPTIONS = new Map<string, PushSubscriptionRecord>();

// Initialize VAPID configuration if environment variables are present
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@purplefriday.in";

let isVapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isVapidConfigured = true;
  } catch (err) {
    console.warn("[web-push] Failed to configure VAPID details:", err);
  }
}

export function isPushConfigured(): boolean {
  return isVapidConfigured;
}

export function getVapidPublicKey(): string | null {
  return vapidPublicKey || null;
}

/**
 * Saves or updates a push subscription for a user or role.
 */
export async function savePushSubscription(
  userOrRole: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<PushSubscriptionRecord> {
  const existing = Array.from(PUSH_SUBSCRIPTIONS.values()).find(
    (s) => s.endpoint === sub.endpoint
  );

  const id = existing?.id || `push_sub_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const record: PushSubscriptionRecord = {
    id,
    userOrRole,
    endpoint: sub.endpoint,
    keys: sub.keys,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  PUSH_SUBSCRIPTIONS.set(id, record);
  return record;
}

/**
 * Removes a subscription by endpoint (e.g. when expired / 404 / 410).
 */
export function removePushSubscriptionByEndpoint(endpoint: string): void {
  for (const [id, record] of PUSH_SUBSCRIPTIONS.entries()) {
    if (record.endpoint === endpoint) {
      PUSH_SUBSCRIPTIONS.delete(id);
    }
  }
}

/**
 * Dispatches web push notification to all subscriptions matching userOrRole.
 * Automatically deletes expired subscriptions on 404 or 410.
 */
export async function sendPushNotification(
  userOrRole: string,
  payload: { title: string; body: string; link?: string }
): Promise<{ sent: number; failed: number }> {
  if (!isVapidConfigured) {
    return { sent: 0, failed: 0 };
  }

  const targets = Array.from(PUSH_SUBSCRIPTIONS.values()).filter(
    (s) => s.userOrRole === userOrRole || (userOrRole === "role:ADMIN" && s.userOrRole === "role:SUPER_ADMIN")
  );

  let sent = 0;
  let failed = 0;

  for (const sub of targets) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify(payload)
      );
      sent++;

      MESSAGE_LOGS.unshift({
        id: `msg_push_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        channel: "push",
        maskedRecipient: maskRecipient(sub.endpoint),
        template: "push_alert",
        status: "SENT",
        attempts: 1,
        time: new Date().toISOString(),
        event: "admin_customer_event",
        recipient: sub.endpoint,
        data: payload,
      });
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number })?.statusCode;

      // Delete expired subscriptions (404 Not Found or 410 Gone)
      if (statusCode === 404 || statusCode === 410) {
        removePushSubscriptionByEndpoint(sub.endpoint);
      }

      MESSAGE_LOGS.unshift({
        id: `msg_push_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        channel: "push",
        maskedRecipient: maskRecipient(sub.endpoint),
        template: "push_alert",
        status: "FAILED",
        error: err instanceof Error ? err.message : "Push delivery failed",
        attempts: 1,
        time: new Date().toISOString(),
        event: "admin_customer_event",
        recipient: sub.endpoint,
        data: payload,
      });
    }
  }

  return { sent, failed };
}
