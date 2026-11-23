/**
 * Purple Friday - Quotes (RFQ), Invoices & Payment Links Service
 * 
 * Rules:
 * - Turns requests into formal quotes with negotiated unit prices
 * - Negotiated prices below slab price strictly require an audited reason
 * - Status: DRAFT, SENT, ACCEPTED, EXPIRED, DECLINED
 * - Corporate payment link generation behind safe adapter: disabled in COD mode
 * - Timing-safe HMAC signature verification for payment webhooks
 * - Idempotent order creation upon quote payment
 */

import crypto from "crypto";
import { writeAudit } from "@/lib/admin/audit";
import {
  toPaise,
  toRupees,
  roundHalfUp,
  calculateGstBreakdown,
} from "@/server/pricing/engine";
import { getProductByIdOrSlug } from "@/server/products/product-service";
import { createOrder, generateOrderNumber } from "@/lib/orders";

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "DECLINED";

export interface QuoteLineItem {
  id: string;
  name: string;
  productSlug?: string;
  qty: number;
  standardSlabPricePaise: number;
  negotiatedUnitPricePaise: number;
  belowSlabReason?: string;
  hsnCode: string;
  lineTotalPaise: number;
  taxableBasePaise: number;
  gstAmountPaise: number;
}

export interface QuoteData {
  id: string;
  quoteNumber: string; // e.g. "PF-Q-2026-0001"
  customerName: string;
  company?: string;
  email: string;
  phone: string;
  items: QuoteLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  gstPaise: number;
  totalPaise: number;
  advancePaise: number;
  validUntil: string;
  sellerGstin: string;
  buyerGstin?: string;
  placeOfSupply: string;
  hsnCode: string;
  status: QuoteStatus;
  notes?: string;
  negotiatedReason?: string;
  paymentLinkId?: string;
  paymentLinkUrl?: string | null;
  [key: string]: unknown;
  orderId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// In-Memory store for quotes
const QUOTE_STORE = new Map<string, QuoteData>();
let quoteCounter = 1000;

function generateQuoteNumber(): string {
  quoteCounter += 1;
  const year = new Date().getFullYear();
  return `PF-Q-${year}-${quoteCounter}`;
}

function initializeDefaultQuotes() {
  if (QUOTE_STORE.size > 0) return;

  const initialItems: QuoteLineItem[] = [
    {
      id: "item_1",
      name: "Executive Cotton Piqué Polo (230 GSM) - Logo Embroidered",
      productSlug: "executive-pique-polo",
      qty: 100,
      standardSlabPricePaise: 26500, // ₹265 standard slab
      negotiatedUnitPricePaise: 25000, // ₹250 negotiated
      belowSlabReason: "Corporate annual contract volume discount approved by director",
      hsnCode: "6105",
      lineTotalPaise: 2500000, // ₹25,000
      taxableBasePaise: 2118644,
      gstAmountPaise: 381356,
    },
    {
      id: "item_2",
      name: "Double-Wall Insulated Steel Flask 750ml - Laser Engraved",
      productSlug: "matte-insulated-steel-flask",
      qty: 100,
      standardSlabPricePaise: 29500, // ₹295 standard slab
      negotiatedUnitPricePaise: 29000, // ₹290 negotiated
      hsnCode: "7323",
      lineTotalPaise: 2900000, // ₹29,000
      taxableBasePaise: 2457627,
      gstAmountPaise: 442373,
    },
  ];

  const subtotalPaise = 5400000; // ₹54,000
  const shippingPaise = 0; // Free corporate freight
  const tax = calculateGstBreakdown(subtotalPaise, 0.18, "Karnataka", "Karnataka");

  const q: QuoteData = {
    id: "quote_corp_1001",
    quoteNumber: "PF-Q-2026-1001",
    customerName: "Vikram Malhotra",
    company: "Acme Cloud India Pvt Ltd",
    email: "vikram.malhotra@acmecloud.in",
    phone: "+91 98450 12345",
    items: initialItems,
    subtotalPaise,
    discountPaise: 0,
    shippingPaise,
    gstPaise: tax.totalGstPaise,
    totalPaise: subtotalPaise,
    advancePaise: 2700000, // 50% advance
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
    sellerGstin: "29AABCU9603R1ZM",
    buyerGstin: "29AAFCA1234F1Z5",
    placeOfSupply: "Karnataka",
    hsnCode: "6105",
    status: "SENT",
    notes: "Delivery schedule: 7 days post digital proof approval.",
    negotiatedReason: "High-volume corporate annual gifting deal",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  QUOTE_STORE.set(q.id, q);
  QUOTE_STORE.set(q.quoteNumber, q);
}

initializeDefaultQuotes();

/**
 * Retrieve all quotes with optional status filter
 */
export async function getAllQuotes(statusFilter?: QuoteStatus): Promise<QuoteData[]> {
  initializeDefaultQuotes();
  const unique = Array.from(
    new Map(Array.from(QUOTE_STORE.values()).map((q) => [q.id, q])).values()
  );

  return unique
    .filter((q) => !statusFilter || q.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieve single quote by id or quoteNumber
 */
export async function getQuoteByIdOrNumber(identifier: string): Promise<QuoteData | null> {
  initializeDefaultQuotes();
  return QUOTE_STORE.get(identifier) || null;
}

/**
 * Create or Update Quote with live price calculations and mandatory below-slab rationale audit.
 */
export async function buildQuote(
  data: {
    id?: string;
    customerName: string;
    company?: string;
    email: string;
    phone: string;
    items: Array<{
      productSlug?: string;
      name: string;
      qty: number;
      negotiatedUnitPrice: number; // in rupees
      belowSlabReason?: string;
      hsnCode?: string;
    }>;
    shippingFee?: number; // in rupees
    advancePercent?: number; // e.g. 50%
    validDays?: number; // e.g. 15 or 30 days
    placeOfSupply?: string;
    buyerGstin?: string;
    notes?: string;
    status?: QuoteStatus;
    expectedVersion?: number;
  },
  actor: { name: string; role: string; ip?: string }
): Promise<{ success: boolean; quote?: QuoteData; error?: string }> {
  initializeDefaultQuotes();

  if (!data.customerName || !data.email || !data.phone || data.items.length === 0) {
    return { success: false, error: "Customer name, email, phone, and items are required." };
  }

  const existing = data.id ? QUOTE_STORE.get(data.id) : null;
  if (existing && data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
    return {
      success: false,
      error: `Conflict: Quote was modified by another operator (version ${existing.version}). Please refresh.`,
    };
  }

  const processedItems: QuoteLineItem[] = [];
  let subtotalPaise = 0;

  for (const it of data.items) {
    let standardSlabPricePaise = toPaise(it.negotiatedUnitPrice);

    if (it.productSlug) {
      const p = await getProductByIdOrSlug(it.productSlug);
      if (p.product && p.product.priceTiers.length > 0) {
        const tier = p.product.priceTiers.find(
          (t) => it.qty >= t.minQty && (t.maxQty === null || it.qty <= t.maxQty)
        );
        if (tier) {
          standardSlabPricePaise = tier.unitPricePaise;
        }
      }
    }

    const negotiatedPaise = toPaise(it.negotiatedUnitPrice);

    // Rule: Negotiated price below slab price strictly requires an audited reason
    if (negotiatedPaise < standardSlabPricePaise && !it.belowSlabReason) {
      return {
        success: false,
        error: `Item "${it.name}" is priced at ₹${it.negotiatedUnitPrice}, which is below standard slab rate of ₹${toRupees(
          standardSlabPricePaise
        )}. A written reason for the below-slab discount is mandatory.`,
      };
    }

    const lineTotalPaise = roundHalfUp(negotiatedPaise * it.qty);
    subtotalPaise += lineTotalPaise;

    const taxableBasePaise = roundHalfUp(lineTotalPaise / 1.18);
    const gstAmountPaise = lineTotalPaise - taxableBasePaise;

    processedItems.push({
      id: `qitem_${crypto.randomUUID()}`,
      name: it.name,
      productSlug: it.productSlug,
      qty: it.qty,
      standardSlabPricePaise,
      negotiatedUnitPricePaise: negotiatedPaise,
      belowSlabReason: it.belowSlabReason,
      hsnCode: it.hsnCode || "6109",
      lineTotalPaise,
      taxableBasePaise,
      gstAmountPaise,
    });
  }

  const shippingPaise = toPaise(data.shippingFee || 0);
  const totalPaise = subtotalPaise + shippingPaise;
  const advancePercent = data.advancePercent || 100;
  const advancePaise = roundHalfUp((totalPaise * advancePercent) / 100);

  const placeOfSupply = data.placeOfSupply || "Karnataka";
  const tax = calculateGstBreakdown(subtotalPaise, 0.18, placeOfSupply, "Karnataka");

  const validDays = data.validDays || 15;
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString();

  const id = existing?.id || data.id || `quote_${crypto.randomUUID()}`;
  const quoteNumber = existing?.quoteNumber || generateQuoteNumber();

  const updatedQuote: QuoteData = {
    id,
    quoteNumber,
    customerName: data.customerName,
    company: data.company || existing?.company,
    email: data.email,
    phone: data.phone,
    items: processedItems,
    subtotalPaise,
    discountPaise: 0,
    shippingPaise,
    gstPaise: tax.totalGstPaise,
    totalPaise,
    advancePaise,
    validUntil,
    sellerGstin: "29AABCU9603R1ZM",
    buyerGstin: data.buyerGstin || existing?.buyerGstin,
    placeOfSupply,
    hsnCode: processedItems[0]?.hsnCode || "6109",
    status: data.status || existing?.status || "DRAFT",
    notes: data.notes || existing?.notes,
    version: (existing?.version || 0) + 1,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  QUOTE_STORE.set(id, updatedQuote);
  QUOTE_STORE.set(quoteNumber, updatedQuote);

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: existing ? "admin:update_quote" : "admin:create_quote",
    entityType: "Quote",
    entityId: id,
    before: existing ? (existing as unknown as Record<string, unknown>) : null,
    after: updatedQuote as unknown as Record<string, unknown>,
  });

  return { success: true, quote: updatedQuote };
}

/**
 * Corporate Payment Link Adapter with Safe Degradation
 */
export async function createCorporatePaymentLink(quoteIdOrNumber: string): Promise<{
  configured: boolean;
  paymentUrl: string | null;
  paymentLinkId: string | null;
  message: string;
}> {
  initializeDefaultQuotes();
  const quote = QUOTE_STORE.get(quoteIdOrNumber);
  if (!quote) throw new Error(`Quote "${quoteIdOrNumber}" not found.`);

  return {
    configured: false,
    paymentUrl: null,
    paymentLinkId: null,
    message: "Corporate online payment links disabled in offline order mode.",
  };
}

/**
 * Webhook: Timing-Safe HMAC-SHA256 Signature Verification
 */
  export function verifyPaymentWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    secret: string
  ): boolean {
  if (!rawBody || !signatureHeader || !secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signatureHeader, "utf8");
  const expBuf = Buffer.from(expectedSignature, "utf8");

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// In-Memory processed webhook event dedup set
const PROCESSED_WEBHOOK_EVENTS = new Set<string>();

/**
 * Idempotent Webhook Processing: marks quote ACCEPTED and creates paid order.
 */
  export async function processPaymentWebhook(
    eventId: string,
    payload: {
      paymentId: string;
      orderId?: string;
      quoteNumber?: string;
      amount: number;
    }
  ): Promise<{ success: boolean; duplicate: boolean; orderNumber?: string }> {
  initializeDefaultQuotes();

  // Idempotency check: Reject duplicate webhooks
  if (PROCESSED_WEBHOOK_EVENTS.has(eventId)) {
    return { success: true, duplicate: true };
  }
  PROCESSED_WEBHOOK_EVENTS.add(eventId);

  if (!payload.quoteNumber) {
    return { success: true, duplicate: false };
  }

  const quote = QUOTE_STORE.get(payload.quoteNumber);
  if (!quote) return { success: false, duplicate: false };

  // Mark Quote Accepted
  quote.status = "ACCEPTED";
  quote.version += 1;
  quote.updatedAt = new Date().toISOString();

  // Create authoritative paid order from quote
  const orderNumber = generateOrderNumber();
  const createdOrder = await createOrder({
    customerName: quote.customerName,
    customerEmail: quote.email,
    customerPhone: quote.phone,
    companyName: quote.company,
    gstin: quote.buyerGstin,
    shippingAddress: {
      line1: "Corporate Headquarters",
      city: "Bengaluru",
      state: quote.placeOfSupply,
      pin: "560001",
    },
    items: quote.items.map((i) => ({
      productId: i.productSlug || "custom-corporate-item",
      optionKey: `quote-${i.id}`,
      qty: i.qty,
      customPricePaise: i.negotiatedUnitPricePaise,
    })),
  });

  quote.orderId = createdOrder.id;
  QUOTE_STORE.set(quote.id, quote);
  QUOTE_STORE.set(quote.quoteNumber, quote);

  await writeAudit({
    actor: "Payment Webhook Handler",
    actorRole: "SYSTEM",
    action: "webhook:quote_payment_accepted",
    entityType: "Quote",
    entityId: quote.id,
    after: { status: "ACCEPTED", orderNumber, paymentId: payload.paymentId },
  });

  return { success: true, duplicate: false, orderNumber };
}
