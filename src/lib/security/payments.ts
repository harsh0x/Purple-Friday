import crypto from "crypto";

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}

/**
 * Validates Razorpay payment signature using timingSafeEqual to strictly prevent timing attacks.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  secret,
}: VerifySignatureParams): boolean {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "utf-8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Validates Razorpay Webhook Raw Body Signature
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string,
  webhookSecret: string
): boolean {
  if (!rawBody || !signatureHeader || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const signatureBuffer = Buffer.from(signatureHeader, "utf-8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * In-memory idempotency tracker for Webhook Events (synced with DB)
 */
const PROCESSED_WEBHOOK_EVENTS = new Set<string>();

export function isWebhookProcessed(eventId: string): boolean {
  return PROCESSED_WEBHOOK_EVENTS.has(eventId);
}

export function markWebhookProcessed(eventId: string): void {
  PROCESSED_WEBHOOK_EVENTS.add(eventId);
}

export function resetWebhookProcessedRegistry(): void {
  PROCESSED_WEBHOOK_EVENTS.clear();
}
