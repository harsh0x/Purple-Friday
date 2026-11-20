import { NextRequest, NextResponse } from "next/server";
import {
  verifyRazorpayWebhookSignature,
  processRazorpayPaymentWebhook,
} from "@/server/quotes/quotes-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "default_webhook_secret";

    // 1. Timing-Safe HMAC Signature Verification
    if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const payment = payload.payload?.payment?.entity;
    const paymentLink = payload.payload?.payment_link?.entity;

    const quoteNumber =
      payment?.notes?.quoteNumber || paymentLink?.notes?.quoteNumber;
    const paymentId = payment?.id || paymentLink?.id || "pay_mock";
    const amount = payment?.amount || paymentLink?.amount || 0;

    // 2. Idempotent Processing
    const result = await processRazorpayPaymentWebhook(eventId, {
      paymentId,
      quoteNumber,
      amount,
    });

    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      orderNumber: result.orderNumber,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
