import crypto from "crypto";
import { after } from "next/server";
import {
  NotificationEvent,
  renderNotificationTemplate,
} from "./templates";
import { createNotification } from "@/lib/admin/notifications";

// Production Safety Invariant: DEV_OTP_LOG is ignored and startup fails if true in production
if (
  process.env.NODE_ENV === "production" &&
  (process.env.DEV_OTP_LOG === "true" || process.env.DEV_OTP_LOG === "1")
) {
  throw new Error("FATAL CONFIG ERROR: DEV_OTP_LOG must not be enabled in production environments.");
}

export interface MessageLogEntry {
  id: string;
  channel: "email" | "in_app" | "push";
  maskedRecipient: string;
  template: string;
  status: "SENT" | "FAILED" | "PENDING" | "SKIPPED";
  error?: string | null;
  attempts: number;
  time: string;
  event: NotificationEvent;
  recipient: string;
  data: Record<string, unknown>;
}

export interface RetryJob {
  id: string;
  event: NotificationEvent;
  recipient: string;
  data: Record<string, unknown>;
  attempts: number;
  lastAttemptAt: string;
  lastError: string;
}

// Global in-memory message logs & retry queue
export const MESSAGE_LOGS: MessageLogEntry[] = [];
export const RETRY_QUEUE: RetryJob[] = [];

/**
 * Mask email or phone for privacy compliance in logs.
 * e.g. "alexander.graham@example.com" -> "a***m@example.com"
 * e.g. "+919876543210" -> "+91******3210"
 */
export function maskRecipient(recipient: string): string {
  if (!recipient) return "—";
  if (recipient.includes("@")) {
    const [local, domain] = recipient.split("@");
    if (local.length <= 2) {
      return `${local[0] || "*"}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }
  const digits = recipient.replace(/\s+/g, "");
  if (digits.length <= 4) return "****";
  return `${digits.slice(0, 3)}******${digits.slice(-4)}`;
}

/**
 * Sends transactional email via Resend API.
 * Never fakes success.
 */
async function sendEmailViaResend(
  recipient: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const isConfigured = Boolean(apiKey && !apiKey.includes("sample") && apiKey.startsWith("re_"));
  const fromEmail = process.env.EMAIL_FROM || "Purple Friday <orders@purplefriday.in>";

  if (!isConfigured) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[WARN] Resend is not configured in production. Skipping email send to ${maskRecipient(recipient)}`);
      return { success: false, skipped: true, error: "Resend not configured in production" };
    } else {
      // In development / test: print message in terminal
      console.log(`\n================== [DEV TRANSACTIONAL EMAIL] ==================`);
      console.log(`To:      ${recipient}`);
      console.log(`Subject: ${subject}`);
      console.log(`---------------------------------------------------------------`);
      console.log(text);
      console.log(`===============================================================\n`);
      return { success: true };
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Resend HTTP ${res.status}: ${errBody}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown network error";
    return { success: false, error: msg };
  }
}

/**
 * Execute delivery for an event across channels.
 */
async function executeDelivery(
  event: NotificationEvent,
  recipient: string,
  data: Record<string, unknown>,
  attempts = 1
): Promise<{ success: boolean; error?: string }> {
  const template = renderNotificationTemplate(event, data);
  const now = new Date().toISOString();
  const masked = maskRecipient(recipient);

  // 1. In-App Notification (Always stored)
  if (recipient.includes("@") || recipient.startsWith("usr_") || recipient.startsWith("role:")) {
    try {
      await createNotification({
        userOrRole: recipient,
        title: template.subject,
        body: template.text.slice(0, 200),
        link: typeof data.link === "string" ? data.link : undefined,
      });

      MESSAGE_LOGS.unshift({
        id: `msg_inapp_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        channel: "in_app",
        maskedRecipient: masked,
        template: event,
        status: "SENT",
        attempts,
        time: now,
        event,
        recipient,
        data,
      });
    } catch {
      // Memory fallback
    }
  }

  // 2. Email Delivery (for email recipients)
  if (recipient.includes("@")) {
    const emailResult = await sendEmailViaResend(
      recipient,
      template.subject,
      template.html,
      template.text
    );

    const logStatus = emailResult.success
      ? "SENT"
      : emailResult.skipped
      ? "SKIPPED"
      : "FAILED";

    MESSAGE_LOGS.unshift({
      id: `msg_email_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      channel: "email",
      maskedRecipient: masked,
      template: event,
      status: logStatus,
      error: emailResult.error || null,
      attempts,
      time: now,
      event,
      recipient,
      data,
    });

    if (MESSAGE_LOGS.length > 500) {
      MESSAGE_LOGS.pop();
    }

    if (!emailResult.success && !emailResult.skipped) {
      // Failed - enqueue retry job if attempts < 3
      if (attempts < 3) {
        RETRY_QUEUE.push({
          id: `retry_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
          event,
          recipient,
          data,
          attempts,
          lastAttemptAt: now,
          lastError: emailResult.error || "Delivery failed",
        });
      }
      return { success: false, error: emailResult.error };
    }
  }

  return { success: true };
}

/**
 * Universal Unified Notification Dispatcher.
 * "One function notify(event, recipient, data) is the only way anything is sent."
 * Runs in the background via after() when available.
 */
export async function notify(
  event: NotificationEvent,
  recipient: string,
  data: Record<string, unknown> = {}
): Promise<{ enqueued: boolean; success?: boolean; error?: string }> {
  const runner = async () => {
    try {
      await executeDelivery(event, recipient, data, 1);
    } catch (err: unknown) {
      console.error("[notify error]", err);
    }
  };

  try {
    // Attempt background execution via Next.js 15 after()
    after(runner);
    return { enqueued: true };
  } catch {
    // When called outside request context (e.g. CLI, scripts, test runner)
    if (process.env.NODE_ENV === "test") {
      const res = await executeDelivery(event, recipient, data, 1);
      return { enqueued: true, ...res };
    } else {
      setImmediate(runner);
      return { enqueued: true };
    }
  }
}

/**
 * Processes retry queue (called by scheduled cron tick).
 * Retries up to 3 times before dropping.
 */
export async function processMessageRetries(): Promise<{ retried: number; succeeded: number }> {
  let succeeded = 0;
  const toProcess = [...RETRY_QUEUE];
  RETRY_QUEUE.length = 0;

  for (const job of toProcess) {
    const nextAttempt = job.attempts + 1;
    const res = await executeDelivery(job.event, job.recipient, job.data, nextAttempt);
    if (res.success) {
      succeeded++;
    }
  }

  return { retried: toProcess.length, succeeded };
}
