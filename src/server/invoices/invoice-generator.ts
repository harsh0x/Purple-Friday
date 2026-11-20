/**
 * Purple Friday - GST-Compliant Quote & Tax Invoice PDF Generator
 * 
 * Rules:
 * - Built using pdf-lib
 * - Gapless sequential tax invoice numbering that never repeats or skips
 * - Seller GSTIN: 29AABCU9603R1ZM (Karnataka)
 * - Buyer GSTIN, HSN/SAC codes (6109 / 9988), place of supply
 * - Tax split: CGST (9%) + SGST (9%) for Karnataka; IGST (18%) for interstate
 * - Downloadable by order owner and authorized staff
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toRupees, calculateGstBreakdown } from "@/server/pricing/engine";
import { QuoteData } from "@/server/quotes/quotes-service";

// Sequential Invoice Atomic Counter
let invoiceSequenceCounter = 1000;
const ISSUED_INVOICE_NUMBERS = new Map<string, string>(); // orderId -> invoiceNumber

export function getNextInvoiceNumber(orderId?: string): string {
  if (orderId && ISSUED_INVOICE_NUMBERS.has(orderId)) {
    return ISSUED_INVOICE_NUMBERS.get(orderId)!;
  }

  invoiceSequenceCounter += 1;
  const year = new Date().getFullYear();
  const numStr = invoiceSequenceCounter.toString().padStart(4, "0");
  const invoiceNumber = `INV-${year}-${numStr}`;

  if (orderId) {
    ISSUED_INVOICE_NUMBERS.set(orderId, invoiceNumber);
  }

  return invoiceNumber;
}

export interface InvoiceData {
  orderId: string;
  orderNumber: string;
  invoiceNumber?: string;
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
  };
  buyerGstin?: string;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    hsnCode?: string;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  total: number;
  paymentMethod: string;
  paymentId?: string;
  createdAt: string;
}

/**
 * Generates a GST-compliant Tax Invoice PDF as a Buffer.
 */
export async function generateTaxInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 Size in points
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const invoiceNumber = data.invoiceNumber || getNextInvoiceNumber(data.orderId);
  const customerState = data.address.state || "Karnataka";
  const tax = calculateGstBreakdown(
    Math.round((data.subtotal - data.discount) * 100),
    0.18,
    customerState,
    "Karnataka"
  );

  // Background / Header Accent Bar
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0.082, 0.063, 0.122), // #15101F Ink
  });

  page.drawText("PURPLE FRIDAY", {
    x: 40,
    y: height - 38,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("TAX INVOICE", {
    x: width - 150,
    y: height - 38,
    size: 14,
    font: fontBold,
    color: rgb(0.847, 1.0, 0.247), // #D8FF3F Spot Lime
  });

  // Invoice Details & Dates
  let y = height - 90;
  page.drawText(`Invoice No: ${invoiceNumber}`, {
    x: 40,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.082, 0.063, 0.122),
  });

  page.drawText(`Order Ref: #${data.orderNumber}`, {
    x: 40,
    y: y - 14,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(`Date: ${new Date(data.createdAt).toLocaleDateString("en-IN")}`, {
    x: width - 180,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`Place of Supply: ${customerState} (${tax.isInterstate ? "Interstate" : "Intrastate"})`, {
    x: width - 180,
    y: y - 14,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Divider line
  y -= 30;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Seller & Buyer Blocks
  y -= 15;
  page.drawText("ISSUED BY:", { x: 40, y, size: 8, font: fontBold, color: rgb(0.415, 0.173, 1.0) });
  page.drawText("Purple Friday Merch Technologies Pvt Ltd", { x: 40, y: y - 12, size: 9, font: fontBold });
  page.drawText("GSTIN: 29AABCU9603R1ZM", { x: 40, y: y - 24, size: 9, font: fontRegular });
  page.drawText("No. 42, Innovation Arcade, Koramangala", { x: 40, y: y - 36, size: 8, font: fontRegular });
  page.drawText("Bengaluru, Karnataka - 560034", { x: 40, y: y - 48, size: 8, font: fontRegular });

  page.drawText("BILLED TO:", { x: width / 2 + 20, y, size: 8, font: fontBold, color: rgb(0.415, 0.173, 1.0) });
  page.drawText(data.companyName ? `${data.companyName} (Attn: ${data.customerName})` : data.customerName, {
    x: width / 2 + 20,
    y: y - 12,
    size: 9,
    font: fontBold,
  });
  if (data.buyerGstin) {
    page.drawText(`Buyer GSTIN: ${data.buyerGstin}`, { x: width / 2 + 20, y: y - 24, size: 9, font: fontBold });
  }
  page.drawText(`${data.address.line1}, ${data.address.city}, ${data.address.state} - ${data.address.pin}`, {
    x: width / 2 + 20,
    y: y - 36,
    size: 8,
    font: fontRegular,
  });
  page.drawText(`Email: ${data.email} • Phone: ${data.phone}`, {
    x: width / 2 + 20,
    y: y - 48,
    size: 8,
    font: fontRegular,
  });

  // Items Table Header
  y -= 70;
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: width - 80,
    height: 20,
    color: rgb(0.96, 0.94, 0.91), // #F5F0E8 Paper
  });

  page.drawText("Item Description", { x: 45, y, size: 8, font: fontBold });
  page.drawText("HSN/SAC", { x: 260, y, size: 8, font: fontBold });
  page.drawText("Qty", { x: 330, y, size: 8, font: fontBold });
  page.drawText("Rate (INR)", { x: 380, y, size: 8, font: fontBold });
  page.drawText("Total (INR)", { x: 480, y, size: 8, font: fontBold });

  y -= 20;

  // Items
  for (const item of data.items) {
    page.drawText(item.name.slice(0, 36), { x: 45, y, size: 8, font: fontRegular });
    page.drawText(item.hsnCode || "6109", { x: 260, y, size: 8, font: fontRegular });
    page.drawText(item.qty.toString(), { x: 335, y, size: 8, font: fontRegular });
    page.drawText(`INR ${item.unitPrice.toFixed(2)}`, { x: 380, y, size: 8, font: fontRegular });
    page.drawText(`INR ${item.lineTotal.toFixed(2)}`, { x: 480, y, size: 8, font: fontBold });
    y -= 16;
  }

  // Summary & GST Split Block
  y -= 20;
  page.drawLine({
    start: { x: 300, y: y + 10 },
    end: { x: width - 40, y: y + 10 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  const drawRow = (label: string, val: string, isBold: boolean = false) => {
    page.drawText(label, { x: 320, y, size: 8, font: isBold ? fontBold : fontRegular });
    page.drawText(val, { x: 480, y, size: 8, font: isBold ? fontBold : fontRegular });
    y -= 14;
  };

  drawRow("Subtotal:", `INR ${data.subtotal.toFixed(2)}`);
  if (data.discount > 0) drawRow("Discount:", `-INR ${data.discount.toFixed(2)}`);
  drawRow("Taxable Base:", `INR ${toRupees(tax.taxableAmountPaise).toFixed(2)}`);

  if (tax.isInterstate) {
    drawRow("IGST (18%):", `INR ${toRupees(tax.igstPaise).toFixed(2)}`);
  } else {
    drawRow("CGST (9%):", `INR ${toRupees(tax.cgstPaise).toFixed(2)}`);
    drawRow("SGST (9%):", `INR ${toRupees(tax.sgstPaise).toFixed(2)}`);
  }

  drawRow("Freight / Shipping:", data.shipping > 0 ? `INR ${data.shipping.toFixed(2)}` : "FREE");

  y -= 4;
  page.drawRectangle({
    x: 310,
    y: y - 5,
    width: width - 350,
    height: 22,
    color: rgb(0.082, 0.063, 0.122),
  });

  page.drawText("GRAND TOTAL:", { x: 320, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`INR ${data.total.toFixed(2)}`, {
    x: 470,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.847, 1.0, 0.247),
  });

  // Footer / Signatory
  page.drawText("Terms: Computer generated tax invoice. Goods once dispatched are covered under standard merchant warranty.", {
    x: 40,
    y: 50,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText("Authorized Signatory for Purple Friday Merch Technologies Pvt Ltd", {
    x: width - 280,
    y: 50,
    size: 8,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  return doc.save();
}

/**
 * Generates a GST-compliant Price Quotation PDF as a Buffer.
 */
export async function generateQuotePdf(quote: QuoteData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const tax = calculateGstBreakdown(quote.subtotalPaise, 0.18, quote.placeOfSupply, "Karnataka");

  // Accent Header
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0.415, 0.173, 1.0), // #6A2CFF Violet
  });

  page.drawText("PURPLE FRIDAY", {
    x: 40,
    y: height - 38,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("OFFICIAL PRICE QUOTATION", {
    x: width - 230,
    y: height - 38,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  let y = height - 90;
  page.drawText(`Quote Reference: ${quote.quoteNumber}`, { x: 40, y, size: 10, font: fontBold });
  page.drawText(`Status: ${quote.status}`, { x: 40, y: y - 14, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString("en-IN")}`, {
    x: width - 180,
    y,
    size: 9,
    font: fontBold,
  });

  // Client Details
  y -= 40;
  page.drawText("PREPARED FOR:", { x: 40, y, size: 8, font: fontBold, color: rgb(0.415, 0.173, 1.0) });
  page.drawText(quote.company ? `${quote.company} (Attn: ${quote.customerName})` : quote.customerName, {
    x: 40,
    y: y - 12,
    size: 9,
    font: fontBold,
  });
  if (quote.buyerGstin) {
    page.drawText(`Client GSTIN: ${quote.buyerGstin}`, { x: 40, y: y - 24, size: 9, font: fontRegular });
  }
  page.drawText(`Email: ${quote.email} • Phone: ${quote.phone}`, { x: 40, y: y - 36, size: 8, font: fontRegular });
  page.drawText(`Place of Supply: ${quote.placeOfSupply}`, { x: 40, y: y - 48, size: 8, font: fontRegular });

  // Items Table
  y -= 70;
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: width - 80,
    height: 20,
    color: rgb(0.96, 0.94, 0.91),
  });

  page.drawText("Item / Description", { x: 45, y, size: 8, font: fontBold });
  page.drawText("HSN", { x: 260, y, size: 8, font: fontBold });
  page.drawText("Qty", { x: 330, y, size: 8, font: fontBold });
  page.drawText("Rate (INR)", { x: 380, y, size: 8, font: fontBold });
  page.drawText("Total (INR)", { x: 480, y, size: 8, font: fontBold });

  y -= 20;
  for (const item of quote.items) {
    page.drawText(item.name.slice(0, 36), { x: 45, y, size: 8, font: fontRegular });
    page.drawText(item.hsnCode || "6109", { x: 260, y, size: 8, font: fontRegular });
    page.drawText(item.qty.toString(), { x: 335, y, size: 8, font: fontRegular });
    page.drawText(`INR ${toRupees(item.negotiatedUnitPricePaise).toFixed(2)}`, { x: 380, y, size: 8, font: fontRegular });
    page.drawText(`INR ${toRupees(item.lineTotalPaise).toFixed(2)}`, { x: 480, y, size: 8, font: fontBold });
    y -= 16;
  }

  // Totals
  y -= 20;
  const drawRow = (label: string, val: string) => {
    page.drawText(label, { x: 320, y, size: 8, font: fontRegular });
    page.drawText(val, { x: 480, y, size: 8, font: fontRegular });
    y -= 14;
  };

  drawRow("Subtotal:", `INR ${toRupees(quote.subtotalPaise).toFixed(2)}`);
  drawRow("Taxable Base:", `INR ${toRupees(tax.taxableAmountPaise).toFixed(2)}`);
  if (tax.isInterstate) {
    drawRow("IGST (18%):", `INR ${toRupees(tax.igstPaise).toFixed(2)}`);
  } else {
    drawRow("CGST (9%):", `INR ${toRupees(tax.cgstPaise).toFixed(2)}`);
    drawRow("SGST (9%):", `INR ${toRupees(tax.sgstPaise).toFixed(2)}`);
  }
  drawRow("Freight / Freight:", quote.shippingPaise > 0 ? `INR ${toRupees(quote.shippingPaise).toFixed(2)}` : "FREE");

  y -= 4;
  page.drawRectangle({
    x: 310,
    y: y - 5,
    width: width - 350,
    height: 22,
    color: rgb(0.082, 0.063, 0.122),
  });

  page.drawText("TOTAL PAYABLE:", { x: 320, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`INR ${toRupees(quote.totalPaise).toFixed(2)}`, {
    x: 470,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.847, 1.0, 0.247),
  });

  return doc.save();
}
