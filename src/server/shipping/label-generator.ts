import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { StoredShipment } from "./shipping-service";

/**
 * Generates an official 4x6 inch (288 x 432 pt) courier shipping label PDF.
 */
export async function generateShippingLabelPdf(shipment: StoredShipment): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Standard 4x6" thermal label size in PDF points: 288 x 432
  const page = pdfDoc.addPage([288, 432]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const { width, height } = page.getSize();
  let y = height - 20;

  // Outer Border
  page.drawRectangle({
    x: 10,
    y: 10,
    width: width - 20,
    height: height - 20,
    borderWidth: 1.5,
    borderColor: rgb(0, 0, 0),
  });

  // Top Banner: Courier & Purple Friday Branding
  page.drawRectangle({
    x: 10,
    y: y - 32,
    width: width - 20,
    height: 32,
    color: rgb(0.082, 0.063, 0.122),
  });

  page.drawText("PURPLE FRIDAY LOGISTICS", {
    x: 20,
    y: y - 18,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(shipment.courier || "EXPRESS AIR", {
    x: width - 95,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: rgb(0.85, 1, 0.25),
  });

  y -= 45;

  // AWB and Barcode Representation
  page.drawText("AWB / TRACKING NUMBER:", {
    x: 20,
    y,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 14;
  page.drawText(shipment.awb || `AWB-${shipment.shipmentNumber}`, {
    x: 20,
    y,
    size: 14,
    font: fontMono,
    color: rgb(0, 0, 0),
  });

  y -= 25;

  // Simulated Barcode Lines
  const barcodeX = 20;
  const barcodeWidth = width - 40;
  const barcodeHeight = 28;
  page.drawRectangle({
    x: barcodeX,
    y: y - barcodeHeight,
    width: barcodeWidth,
    height: barcodeHeight,
    color: rgb(0.96, 0.96, 0.96),
  });

  // Draw pattern of vertical stripes
  for (let b = 0; b < barcodeWidth - 10; b += 5) {
    const isBar = (b % 15 !== 0);
    if (isBar) {
      page.drawLine({
        start: { x: barcodeX + 5 + b, y: y - barcodeHeight + 2 },
        end: { x: barcodeX + 5 + b, y: y - 2 },
        thickness: (b % 4 === 0) ? 2.5 : 1.2,
        color: rgb(0, 0, 0),
      });
    }
  }

  y -= (barcodeHeight + 15);

  // Large Routing PIN Code Banner
  page.drawRectangle({
    x: 10,
    y: y - 30,
    width: width - 20,
    height: 30,
    color: rgb(0.92, 0.92, 0.95),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText(`DESTINATION PIN:  ${shipment.pincode}`, {
    x: 20,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(shipment.city.toUpperCase(), {
    x: width - 90,
    y: y - 19,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 45;

  // SHIP TO (Consignee) Details
  page.drawText("SHIP TO (CONSIGNEE):", {
    x: 20,
    y,
    size: 8,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 14;
  page.drawText(shipment.recipientName, {
    x: 20,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  y -= 13;
  page.drawText(`Phone: +91 ${shipment.recipientPhone}`, {
    x: 20,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  y -= 12;
  const addrWrap = shipment.addressLine.length > 38 ? shipment.addressLine.slice(0, 38) + "..." : shipment.addressLine;
  page.drawText(addrWrap, {
    x: 20,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  y -= 12;
  page.drawText(`${shipment.city}, ${shipment.state} - ${shipment.pincode}`, {
    x: 20,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  y -= 25;

  // Payment COD or Prepaid Block
  const isCod = (shipment.collectCodAmountPaise || 0) > 0;
  if (isCod) {
    const due = Math.round(shipment.collectCodAmountPaise / 100);
    page.drawRectangle({
      x: 15,
      y: y - 36,
      width: width - 30,
      height: 36,
      color: rgb(1, 0.94, 0.88),
      borderColor: rgb(0.85, 0.2, 0),
      borderWidth: 1.5,
    });

    page.drawText("CASH ON DELIVERY (PARTIAL COD)", {
      x: 25,
      y: y - 16,
      size: 9,
      font: fontBold,
      color: rgb(0.85, 0.2, 0),
    });

    page.drawText(`COLLECT Rs ${due} ON DELIVERY`, {
      x: 25,
      y: y - 30,
      size: 11,
      font: fontBold,
      color: rgb(0.85, 0.2, 0),
    });
  } else {
    page.drawRectangle({
      x: 15,
      y: y - 28,
      width: width - 30,
      height: 28,
      color: rgb(0.92, 0.98, 0.92),
      borderColor: rgb(0.1, 0.6, 0.2),
      borderWidth: 1.5,
    });

    page.drawText("PREPAID ORDER — DO NOT COLLECT CASH", {
      x: 25,
      y: y - 18,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.55, 0.2),
    });
  }

  y -= 50;

  // RETURN TO (Sender) Block
  page.drawLine({
    start: { x: 10, y },
    end: { x: width - 10, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 14;
  page.drawText("IF UNDELIVERED, RETURN TO:", {
    x: 20,
    y,
    size: 7,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 11;
  page.drawText("Purple Friday Merchandise Atelier (Return Center)", {
    x: 20,
    y,
    size: 8,
    font: fontRegular,
  });
  y -= 10;
  page.drawText("108 Industrial Layout, Koramangala 5th Block, Bengaluru 560095", {
    x: 20,
    y,
    size: 8,
    font: fontRegular,
  });

  return await pdfDoc.save();
}
