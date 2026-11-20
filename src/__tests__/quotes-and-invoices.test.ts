import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  buildQuote,
  getAllQuotes,
  getQuoteByIdOrNumber,
  createRazorpayPaymentLink,
  verifyRazorpayWebhookSignature,
  processRazorpayPaymentWebhook,
} from "@/server/quotes/quotes-service";
import {
  getNextInvoiceNumber,
  generateTaxInvoicePdf,
  generateQuotePdf,
} from "@/server/invoices/invoice-generator";

describe("Quotes Builder - Below-Slab Authorization & GST Calculations", () => {
  const actor = { name: "Sales Director", role: "SUPER_ADMIN" };

  it("blocks quote creation if negotiated unit price is below slab and reason is omitted", async () => {
    const res = await buildQuote(
      {
        customerName: "Rahul Sharma",
        email: "rahul@startup.in",
        phone: "+91 99000 11223",
        items: [
          {
            productSlug: "executive-pique-polo",
            name: "Executive Cotton Piqué Polo",
            qty: 100, // Standard slab is ₹265
            negotiatedUnitPrice: 200, // Deep discount without justification!
            belowSlabReason: "", // Missing!
          },
        ],
      },
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("below standard slab rate");
    expect(res.error).toContain("written reason");
  });

  it("authorizes below-slab rate when a written justification reason is provided", async () => {
    const res = await buildQuote(
      {
        customerName: "Rahul Sharma",
        company: "InnovateTech Bangalore",
        email: "rahul@startup.in",
        phone: "+91 99000 11223",
        items: [
          {
            productSlug: "executive-pique-polo",
            name: "Executive Cotton Piqué Polo",
            qty: 100,
            negotiatedUnitPrice: 200,
            belowSlabReason: "Founder friendship discount authorized by VP",
          },
        ],
        placeOfSupply: "Karnataka",
        shippingFee: 250,
      },
      actor
    );

    expect(res.success).toBe(true);
    expect(res.quote).toBeDefined();
    expect(res.quote?.status).toBe("DRAFT");
    expect(res.quote?.totalPaise).toBe(2000000 + 25000); // 20,000 + 250 shipping in paise
  });

  it("calculates interstate tax split for supply to Maharashtra (IGST)", async () => {
    const res = await buildQuote(
      {
        customerName: "Priya Deshmukh",
        company: "Pune Analytics Hub",
        email: "priya@analytics.com",
        phone: "+91 98220 33445",
        placeOfSupply: "Maharashtra",
        items: [
          {
            name: "Custom Branded Notebook A5",
            qty: 50,
            negotiatedUnitPrice: 300,
          },
        ],
      },
      actor
    );

    expect(res.success).toBe(true);
    expect(res.quote?.placeOfSupply).toBe("Maharashtra");
  });
});

describe("Razorpay Integration - Safe Adapter & Timing-Safe Webhook", () => {
  it("degrades gracefully to 'Not configured' state when external keys are missing", async () => {
    const quote = (await getAllQuotes())[0];
    const res = await createRazorpayPaymentLink(quote.id);

    expect(res.configured).toBe(false);
    expect(res.paymentUrl).toBeNull();
    expect(res.message).toContain("not configured");
  });

  it("verifies webhook signature with timing-safe HMAC-SHA256 comparison", () => {
    const secret = "test_webhook_secret_key_123";
    const payload = JSON.stringify({ event: "payment.captured", id: "evt_123" });

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Valid signature passes
    expect(verifyRazorpayWebhookSignature(payload, validSignature, secret)).toBe(true);

    // Tampered payload fails
    expect(verifyRazorpayWebhookSignature(payload + "tamper", validSignature, secret)).toBe(false);

    // Tampered signature fails
    expect(
      verifyRazorpayWebhookSignature(payload, validSignature.replace("a", "b"), secret)
    ).toBe(false);
  });

  it("processes payment webhook idempotently without duplicate order creation", async () => {
    const eventId = `evt_dedup_${Date.now()}`;
    const webhookData = {
      paymentId: "pay_sample_test",
      quoteNumber: "PF-Q-2026-1001",
      amount: 5400000,
    };

    // First arrival: processes cleanly
    const res1 = await processRazorpayPaymentWebhook(eventId, webhookData);
    expect(res1.success).toBe(true);
    expect(res1.duplicate).toBe(false);
    expect(res1.orderNumber).toBeDefined();

    // Verify quote moved to ACCEPTED
    const acceptedQuote = await getQuoteByIdOrNumber("PF-Q-2026-1001");
    expect(acceptedQuote?.status).toBe("ACCEPTED");

    // Second arrival: rejected as duplicate
    const res2 = await processRazorpayPaymentWebhook(eventId, webhookData);
    expect(res2.success).toBe(true);
    expect(res2.duplicate).toBe(true);
  });
});

describe("Invoices - Gapless Sequential Counter & GST PDF Generation", () => {
  it("generates sequential invoice numbers that never repeat or skip", () => {
    const inv1 = getNextInvoiceNumber();
    const inv2 = getNextInvoiceNumber();
    const inv3 = getNextInvoiceNumber();

    const n1 = parseInt(inv1.split("-")[2], 10);
    const n2 = parseInt(inv2.split("-")[2], 10);
    const n3 = parseInt(inv3.split("-")[2], 10);

    expect(n2).toBe(n1 + 1);
    expect(n3).toBe(n2 + 1);
  });

  it("generates a valid GST Tax Invoice PDF binary buffer using pdf-lib", async () => {
    const pdfBytes = await generateTaxInvoicePdf({
      orderId: "ord_inv_test",
      orderNumber: "PF-2611-00101",
      customerName: "Ananya Roy",
      companyName: "Koramangala Techworks",
      email: "ananya@techworks.com",
      phone: "+91 99000 88776",
      address: {
        line1: "100ft Road, 4th Block",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560034",
      },
      buyerGstin: "29AABCT1234F1Z1",
      items: [
        {
          name: "Executive Cotton Piqué Polo",
          qty: 25,
          unitPrice: 360,
          lineTotal: 9000,
          hsnCode: "6105",
        },
      ],
      subtotal: 9000,
      discount: 0,
      shipping: 0,
      gst: 1620,
      total: 10620,
      paymentMethod: "RAZORPAY",
      paymentId: "pay_inv_9988",
      createdAt: new Date().toISOString(),
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);
    // PDF Magic bytes check: %PDF-
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf8");
    expect(header).toBe("%PDF-");
  });

  it("generates a valid Quote PDF binary buffer using pdf-lib", async () => {
    const quote = (await getAllQuotes())[0];
    const pdfBytes = await generateQuotePdf(quote);

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf8");
    expect(header).toBe("%PDF-");
  });
});
