import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/security/payments";
import { markOrderPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const isLiveWebhook = Boolean(
      webhookSecret &&
        !webhookSecret.includes("dummy") &&
        !webhookSecret.includes("sample")
    );

    // Verify raw body signature in production mode
    if (isLiveWebhook && webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
      }

      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventId = event?.event_id || event?.id || `evt_${Date.now()}`;

    // Enforce Idempotency
    if (isWebhookProcessed(eventId)) {
      return NextResponse.json({
        success: true,
        message: "Webhook event already processed (idempotent duplicate).",
      });
    }

    markWebhookProcessed(eventId);

    // Event Dispatch
    const eventType = event.event;
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        await markOrderPaid(orderId, paymentId);
      }
    }

    return NextResponse.json({ success: true, processedEvent: eventType });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

