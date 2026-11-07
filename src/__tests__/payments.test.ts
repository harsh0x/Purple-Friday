import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import {
  verifyRazorpaySignature,
  verifyWebhookSignature,
  isWebhookProcessed,
  markWebhookProcessed,
  resetWebhookProcessedRegistry,
} from "@/lib/security/payments";

describe("Payment Security - Razorpay Signature Verification", () => {
  const secret = "test_razorpay_secret_key_12345";
  const orderId = "order_PF_987654321";
  const paymentId = "pay_test_123456789";

  // Generate valid test signature
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  it("verifies a valid signature successfully using timingSafeEqual", () => {
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: validSignature,
      secret,
    });
    expect(isValid).toBe(true);
  });

  it("rejects a tampered or modified signature", () => {
    // Flip characters in signature
    const tampered = validSignature.slice(0, -4) + "ffff";
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: tampered,
      secret,
    });
    expect(isValid).toBe(false);
  });

  it("rejects a signature generated with the wrong secret", () => {
    const wrongSecret = "unauthorized_wrong_secret_67890";
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: validSignature,
      secret: wrongSecret,
    });
    expect(isValid).toBe(false);
  });

  it("rejects empty or missing parameters safely", () => {
    expect(
      verifyRazorpaySignature({ orderId: "", paymentId, signature: validSignature, secret })
    ).toBe(false);
    expect(
      verifyRazorpaySignature({ orderId, paymentId: "", signature: validSignature, secret })
    ).toBe(false);
    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature: "", secret })
    ).toBe(false);
    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature: validSignature, secret: "" })
    ).toBe(false);
  });
});

describe("Payment Webhooks - Idempotent Processing", () => {
  beforeEach(() => {
    resetWebhookProcessedRegistry();
  });

  const webhookSecret = "whsec_test_secret_998877";
  const sampleEventId = "evt_razorpay_mock_11223344";
  const samplePayload = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_123" } } },
  });

  const validWebhookSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(samplePayload)
    .digest("hex");

  it("authenticates valid raw webhook signature", () => {
    const valid = verifyWebhookSignature(samplePayload, validWebhookSig, webhookSecret);
    expect(valid).toBe(true);
  });

  it("rejects forged webhook payloads", () => {
    const forgedPayload = JSON.stringify({ event: "order.paid", amount: 0 });
    const valid = verifyWebhookSignature(forgedPayload, validWebhookSig, webhookSecret);
    expect(valid).toBe(false);
  });

  it("enforces idempotency by processing event on first call and discarding on second", () => {
    // 1st delivery
    expect(isWebhookProcessed(sampleEventId)).toBe(false);
    markWebhookProcessed(sampleEventId);
    expect(isWebhookProcessed(sampleEventId)).toBe(true);

    // 2nd delivery (duplicate webhook retry)
    const isDuplicate = isWebhookProcessed(sampleEventId);
    expect(isDuplicate).toBe(true);
  });
});
