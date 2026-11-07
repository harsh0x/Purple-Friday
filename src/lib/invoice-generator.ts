import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface InvoiceItem {
  name: string;
  template?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  options?: Record<string, string>;
}

export interface InvoiceCustomer {
  name: string;
  email: string;
  phone: string;
  company?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pin: string;
}

export interface InvoiceOrderData {
  orderNumber: string;
  invoiceNumber: string;
  orderDate: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  total: number;
}

const HSN_CODE_MAP: Record<string, string> = {
  badge: "7117",
  tee: "6109",
  polo: "6109",
  hoodie: "6109",
  cap: "6505",
  pen: "9608",
  bottle: "3924",
  keychain: "7326",
  notebook: "4820",
};

export function getHsnCode(templateName?: string): string {
  if (!templateName) return "6109";
  const norm = templateName.toLowerCase();
  for (const [key, code] of Object.entries(HSN_CODE_MAP)) {
    if (norm.includes(key)) return code;
  }
  return "6109";
}

export async function generateGstInvoicePdf(data: InvoiceOrderData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 dimensions
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;

  // Colors
  const ink = rgb(0.08, 0.06, 0.12); // #15101F
  const violet = rgb(0.42, 0.17, 1.0); // #6A2CFF
  const muted = rgb(0.4, 0.4, 0.45);
  const lightGrey = rgb(0.95, 0.94, 0.92);

  // 1. Header Banner
  page.drawText("TAX INVOICE", {
    x: margin,
    y: height - 50,
    size: 20,
    font: fontBold,
    color: ink,
  });

  page.drawText("ORIGINAL FOR RECIPIENT", {
    x: margin,
    y: height - 64,
    size: 8,
    font: fontBold,
    color: violet,
  });

  page.drawText("PURPLE FRIDAY STUDIO", {
    x: width - margin - 150,
    y: height - 50,
    size: 13,
    font: fontBold,
    color: ink,
  });

  page.drawText("Industrial Offset & Bulk Printworks", {
    x: width - margin - 150,
    y: height - 64,
    size: 8,
    font: fontRegular,
    color: muted,
  });

  // Top Rule
  page.drawLine({
    start: { x: margin, y: height - 75 },
    end: { x: width - margin, y: height - 75 },
    thickness: 1,
    color: ink,
  });

  // 2. Invoice & Seller Details Block
  let cursorY = height - 95;

  // Left: Invoice Meta
  page.drawText(`Invoice No: ${data.invoiceNumber}`, {
    x: margin,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: ink,
  });
  page.drawText(`Order No: ${data.orderNumber}`, {
    x: margin,
    y: cursorY - 14,
    size: 9,
    font: fontRegular,
    color: ink,
  });
  page.drawText(`Date: ${data.orderDate}`, {
    x: margin,
    y: cursorY - 28,
    size: 9,
    font: fontRegular,
    color: ink,
  });
  page.drawText(`Place of Supply: ${data.customer.state}`, {
    x: margin,
    y: cursorY - 42,
    size: 9,
    font: fontRegular,
    color: ink,
  });

  // Right: Seller GSTIN Details
  const rightX = 320;
  page.drawText("SELLER DETAILS:", {
    x: rightX,
    y: cursorY,
    size: 9,
    font: fontBold,
    color: ink,
  });
  page.drawText("Purple Friday Merchandise Pvt. Ltd.", {
    x: rightX,
    y: cursorY - 14,
    size: 8,
    font: fontRegular,
    color: ink,
  });
  page.drawText("14/2 Peenya Industrial Area, Phase 1", {
    x: rightX,
    y: cursorY - 26,
    size: 8,
    font: fontRegular,
    color: ink,
  });
  page.drawText("Bengaluru, Karnataka - 560058", {
    x: rightX,
    y: cursorY - 38,
    size: 8,
    font: fontRegular,
    color: ink,
  });
  page.drawText("GSTIN: 29AAACP1234F1Z5 (State: 29 Karnataka)", {
    x: rightX,
    y: cursorY - 50,
    size: 8,
    font: fontBold,
    color: violet,
  });

  // Divider
  cursorY -= 70;
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 0.5,
    color: muted,
  });

  // 3. Buyer / Billed To Details
  cursorY -= 20;
  page.drawText("BILLED TO / SHIP TO:", {
    x: margin,
    y: cursorY,
    size: 9,
    font: fontBold,
    color: ink,
  });

  cursorY -= 14;
  page.drawText(
    `${data.customer.name}${data.customer.company ? ` (${data.customer.company})` : ""}`,
    {
      x: margin,
      y: cursorY,
      size: 9,
      font: fontBold,
      color: ink,
    }
  );

  cursorY -= 12;
  page.drawText(
    `${data.customer.addressLine1}${data.customer.addressLine2 ? `, ${data.customer.addressLine2}` : ""}`,
    {
      x: margin,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: ink,
    }
  );

  cursorY -= 12;
  page.drawText(
    `${data.customer.city}, ${data.customer.state} - ${data.customer.pin}`,
    {
      x: margin,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: ink,
    }
  );

  cursorY -= 12;
  page.drawText(`Phone: ${data.customer.phone} | Email: ${data.customer.email}`, {
    x: margin,
    y: cursorY,
    size: 8,
    font: fontRegular,
    color: muted,
  });

  if (data.customer.gstin) {
    cursorY -= 12;
    page.drawText(`Buyer GSTIN: ${data.customer.gstin} (Input Tax Credit Eligible)`, {
      x: margin,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: violet,
    });
  }

  // 4. Line Items Table
  cursorY -= 25;

  // Table Header Box
  page.drawRectangle({
    x: margin,
    y: cursorY - 6,
    width: width - margin * 2,
    height: 18,
    color: lightGrey,
  });

  page.drawText("#", { x: margin + 6, y: cursorY, size: 8, font: fontBold, color: ink });
  page.drawText("Item Description", { x: margin + 26, y: cursorY, size: 8, font: fontBold, color: ink });
  page.drawText("HSN", { x: 260, y: cursorY, size: 8, font: fontBold, color: ink });
  page.drawText("Qty", { x: 310, y: cursorY, size: 8, font: fontBold, color: ink });
  page.drawText("Rate (INR)", { x: 360, y: cursorY, size: 8, font: fontBold, color: ink });
  page.drawText("Amount (INR)", { x: 440, y: cursorY, size: 8, font: fontBold, color: ink });

  cursorY -= 20;

  // Items rows
  data.items.forEach((item, index) => {
    const hsn = getHsnCode(item.template);

    page.drawText(String(index + 1), { x: margin + 6, y: cursorY, size: 8, font: fontRegular, color: ink });
    page.drawText(item.name.substring(0, 36), { x: margin + 26, y: cursorY, size: 8, font: fontRegular, color: ink });
    page.drawText(hsn, { x: 260, y: cursorY, size: 8, font: fontRegular, color: ink });
    page.drawText(String(item.qty), { x: 310, y: cursorY, size: 8, font: fontRegular, color: ink });
    page.drawText(`Rs. ${item.unitPrice}`, { x: 360, y: cursorY, size: 8, font: fontRegular, color: ink });
    page.drawText(`Rs. ${item.lineTotal.toLocaleString("en-IN")}`, { x: 440, y: cursorY, size: 8, font: fontRegular, color: ink });

    cursorY -= 16;
  });

  // Table Bottom Rule
  page.drawLine({
    start: { x: margin, y: cursorY + 4 },
    end: { x: width - margin, y: cursorY + 4 },
    thickness: 0.5,
    color: ink,
  });

  // 5. Tax Breakdown & Calculations
  const isIntraState = data.customer.state.toLowerCase().includes("karnataka");
  cursorY -= 16;

  page.drawText(`Taxable Subtotal: Rs. ${data.subtotal.toLocaleString("en-IN")}`, {
    x: 340,
    y: cursorY,
    size: 8,
    font: fontRegular,
    color: ink,
  });

  if (data.discount > 0) {
    cursorY -= 12;
    page.drawText(`Coupon Discount: -Rs. ${data.discount.toLocaleString("en-IN")}`, {
      x: 340,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: ink,
    });
  }

  cursorY -= 12;
  page.drawText(`Shipping: ${data.shipping === 0 ? "FREE" : `Rs. ${data.shipping}`}`, {
    x: 340,
    y: cursorY,
    size: 8,
    font: fontRegular,
    color: ink,
  });

  cursorY -= 12;
  if (isIntraState) {
    const halfGst = Math.round(data.gst / 2);
    page.drawText(`CGST @ 9%: Rs. ${halfGst.toLocaleString("en-IN")}`, {
      x: 340,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: ink,
    });
    cursorY -= 12;
    page.drawText(`SGST @ 9%: Rs. ${halfGst.toLocaleString("en-IN")}`, {
      x: 340,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: ink,
    });
  } else {
    page.drawText(`IGST @ 18%: Rs. ${data.gst.toLocaleString("en-IN")}`, {
      x: 340,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: ink,
    });
  }

  // Grand Total Box
  cursorY -= 20;
  page.drawRectangle({
    x: 330,
    y: cursorY - 6,
    width: width - margin - 330,
    height: 22,
    color: ink,
  });

  page.drawText(`TOTAL (INR): Rs. ${data.total.toLocaleString("en-IN")}`, {
    x: 340,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // 6. Signatory & Footer
  cursorY = 80;
  page.drawLine({
    start: { x: margin, y: cursorY + 30 },
    end: { x: width - margin, y: cursorY + 30 },
    thickness: 0.5,
    color: muted,
  });

  page.drawText("Terms & Conditions: Subject to Bengaluru jurisdiction.", {
    x: margin,
    y: cursorY + 14,
    size: 7,
    font: fontRegular,
    color: muted,
  });
  page.drawText("This is a computer generated tax invoice.", {
    x: margin,
    y: cursorY + 4,
    size: 7,
    font: fontRegular,
    color: muted,
  });

  page.drawText("For PURPLE FRIDAY STUDIO", {
    x: width - margin - 150,
    y: cursorY + 14,
    size: 8,
    font: fontBold,
    color: ink,
  });

  page.drawText("Authorized Signatory", {
    x: width - margin - 150,
    y: cursorY - 4,
    size: 7,
    font: fontRegular,
    color: muted,
  });

  return doc.save();
}
