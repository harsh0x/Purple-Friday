import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { recommendCorporateKit, CorporateAudience } from "@/lib/corporate/kits";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamSize = Math.max(10, Math.min(5000, Number(searchParams.get("teamSize") || 50)));
  const budget = Math.max(300, Math.min(10000, Number(searchParams.get("budget") || 1200)));
  const audience = (searchParams.get("audience") || "new_joiners") as CorporateAudience;

  const kit = recommendCorporateKit(teamSize, budget, audience);

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { height } = page.getSize();
    let y = height - 40;

    // Header Background Band
    page.drawRectangle({
      x: 36,
      y: y - 55,
      width: 523,
      height: 65,
      color: rgb(0.08, 0.06, 0.12), // Ink #15101F
    });

    page.drawText("PURPLE FRIDAY PRINTWORKS", {
      x: 50,
      y: y - 22,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("Commercial Corporate Gifting Proposal & B2B Volume Quotation", {
      x: 50,
      y: y - 38,
      size: 9,
      font: fontRegular,
      color: rgb(0.85, 1, 0.25), // Spot-lime
    });

    const quoteRef = `PF-CORP-${Date.now().toString().slice(-6)}`;
    page.drawText(`REF: ${quoteRef}  •  DATE: ${new Date().toLocaleDateString("en-IN")}`, {
      x: 360,
      y: y - 22,
      size: 9,
      font: fontBold,
      color: rgb(0.8, 0.72, 1), // Lilac
    });

    y -= 85;

    // Entity Details (2 Columns)
    page.drawText("ISSUED BY:", { x: 40, y, size: 8, font: fontBold, color: rgb(0.42, 0.17, 1) });
    page.drawText("PREPARED FOR:", { x: 300, y, size: 8, font: fontBold, color: rgb(0.42, 0.17, 1) });

    y -= 14;
    page.drawText("Purple Friday Private Limited", { x: 40, y, size: 9, font: fontBold });
    page.drawText("Corporate Client Portfolio", { x: 300, y, size: 9, font: fontBold });

    y -= 12;
    page.drawText("Plot 42/B, Industrial Area, HSR Layout Sector 3", { x: 40, y, size: 8, font: fontRegular });
    page.drawText(`Batch Size: ${teamSize} Team Members / Kits`, { x: 300, y, size: 8, font: fontRegular });

    y -= 12;
    page.drawText("Bengaluru, Karnataka 560102  •  GSTIN: 29AAACP1234F1Z5", { x: 40, y, size: 8, font: fontRegular });
    page.drawText(`Target Per-Head Budget: Rs. ${budget.toLocaleString("en-IN")}`, { x: 300, y, size: 8, font: fontRegular });

    y -= 30;

    // Proposed Package Banner
    page.drawRectangle({
      x: 36,
      y: y - 26,
      width: 523,
      height: 32,
      color: rgb(0.95, 0.94, 0.98),
      borderColor: rgb(0.42, 0.17, 1),
      borderWidth: 1,
    });

    page.drawText(`SELECTED SUITE: ${kit.kitTitle.toUpperCase()}`, {
      x: 48,
      y: y - 13,
      size: 10,
      font: fontBold,
      color: rgb(0.42, 0.17, 1),
    });

    page.drawText(kit.themeTagline, {
      x: 48,
      y: y - 23,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 50;

    // Table Header
    page.drawRectangle({
      x: 36,
      y: y - 18,
      width: 523,
      height: 22,
      color: rgb(0.15, 0.1, 0.22),
    });

    page.drawText("ITEM DESCRIPTION", { x: 45, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("CATEGORY", { x: 260, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("RETAIL MRP", { x: 350, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("BULK RATE", { x: 430, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("LINE TOTAL", { x: 495, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });

    y -= 25;

    // Line Items
    kit.items.forEach((item, index) => {
      const lineUnit = teamSize >= 200 ? item.bulkPrice250 : item.bulkPrice50;
      const lineTotal = lineUnit * teamSize;

      if (index % 2 === 1) {
        page.drawRectangle({
          x: 36,
          y: y - 16,
          width: 523,
          height: 22,
          color: rgb(0.97, 0.97, 0.98),
        });
      }

      page.drawText(item.name, { x: 45, y: y - 10, size: 8, font: fontBold, maxWidth: 200 });
      page.drawText(item.category, { x: 260, y: y - 10, size: 8, font: fontRegular });
      page.drawText(`Rs. ${item.mrp}`, { x: 350, y: y - 10, size: 8, font: fontRegular });
      page.drawText(`Rs. ${lineUnit}`, { x: 430, y: y - 10, size: 8, font: fontBold, color: rgb(0.42, 0.17, 1) });
      page.drawText(`Rs. ${lineTotal.toLocaleString("en-IN")}`, { x: 495, y: y - 10, size: 8, font: fontBold });

      y -= 22;
    });

    // Custom Presentation Packaging Line
    page.drawText("Custom Branded Rigid Magnetic Clasp Gift Box + Tissue Wrap", { x: 45, y: y - 10, size: 8, font: fontBold });
    page.drawText("Packaging", { x: 260, y: y - 10, size: 8, font: fontRegular });
    page.drawText("Rs. 250", { x: 350, y: y - 10, size: 8, font: fontRegular });
    page.drawText("INCLUDED", { x: 430, y: y - 10, size: 8, font: fontBold, color: rgb(0.1, 0.6, 0.2) });
    page.drawText("Rs. 0 (Free)", { x: 495, y: y - 10, size: 8, font: fontBold });

    y -= 35;

    // Divider Line
    page.drawLine({
      start: { x: 36, y },
      end: { x: 559, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 25;

    // Commercial Summary (Right-aligned)
    const subtotal = kit.totalTeamInvestment;
    const gst18 = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + gst18;

    const summaryX = 350;
    const valueX = 495;

    page.drawText("Retail Catalog Value:", { x: summaryX, y, size: 8, font: fontRegular });
    page.drawText(`Rs. ${(kit.mrpPerKit * teamSize).toLocaleString("en-IN")}`, { x: valueX, y, size: 8, font: fontRegular });

    y -= 14;
    page.drawText(`B2B Volume Discount (${kit.percentSavings}%):`, { x: summaryX, y, size: 8, font: fontBold, color: rgb(0.1, 0.6, 0.2) });
    page.drawText(`- Rs. ${kit.totalProjectSavings.toLocaleString("en-IN")}`, { x: valueX, y, size: 8, font: fontBold, color: rgb(0.1, 0.6, 0.2) });

    y -= 14;
    page.drawText("Subtotal (excl. tax):", { x: summaryX, y, size: 9, font: fontBold });
    page.drawText(`Rs. ${subtotal.toLocaleString("en-IN")}`, { x: valueX, y, size: 9, font: fontBold });

    y -= 14;
    page.drawText("Goods & Services Tax (GST 18%):", { x: summaryX, y, size: 8, font: fontRegular });
    page.drawText(`Rs. ${gst18.toLocaleString("en-IN")}`, { x: valueX, y, size: 8, font: fontRegular });

    y -= 18;
    page.drawRectangle({
      x: summaryX - 10,
      y: y - 8,
      width: 220,
      height: 24,
      color: rgb(0.08, 0.06, 0.12),
    });

    page.drawText("NET PAYABLE AMOUNT:", { x: summaryX, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(`Rs. ${grandTotal.toLocaleString("en-IN")}`, { x: valueX - 5, y, size: 10, font: fontBold, color: rgb(0.85, 1, 0.25) });

    y -= 50;

    // Commercial Terms & Production Note
    page.drawText("COMMERCIAL TERMS & PRODUCTION SPECIFICATIONS:", { x: 40, y, size: 8, font: fontBold, color: rgb(0.42, 0.17, 1) });
    y -= 14;
    page.drawText("1. Turnaround: 24-48 hours pre-press digital proof rendering; dispatch in 4-5 working days upon proof approval.", { x: 40, y, size: 7.5, font: fontRegular });
    y -= 11;
    page.drawText("2. GST Compliance: B2B Tax invoice eligible for 18% Input Tax Credit (ITC) with valid corporate GSTIN.", { x: 40, y, size: 7.5, font: fontRegular });
    y -= 11;
    page.drawText("3. Logistics: Free pan-India air express delivery via Delhivery / BlueDart Apex on all orders above Rs. 2,500.", { x: 40, y, size: 7.5, font: fontRegular });
    y -= 11;
    page.drawText("4. Validity: This volume quote is valid for 30 calendar days from the date of issuance.", { x: 40, y, size: 7.5, font: fontRegular });

    y -= 50;
    // Signatory Block
    page.drawText("Authorized Signatory", { x: 440, y: 55, size: 8, font: fontBold });
    page.drawText("Purple Friday Prepress Studio", { x: 440, y: 45, size: 7, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PurpleFriday-CorporateQuote-${teamSize}kits.pdf"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating quotation PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

