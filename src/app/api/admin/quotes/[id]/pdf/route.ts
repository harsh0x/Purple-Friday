import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import { getAdminQuotes } from "@/lib/admin/admin-store";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const quotes = getAdminQuotes();
  const quote = quotes.find((q) => q.id === id);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { height } = page.getSize();
    let y = height - 50;

    // Header Band
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: 515,
      height: 60,
      color: rgb(0.08, 0.06, 0.12),
    });

    page.drawText("PURPLE FRIDAY STUDIO BRIEF", {
      x: 55,
      y: y - 20,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`REF: ${quote.id.toUpperCase()} • DATE: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}`, {
      x: 55,
      y: y - 38,
      size: 9,
      font: fontRegular,
      color: rgb(0.85, 1, 0.25),
    });

    y -= 80;

    // Customer Information Section
    page.drawText("1. CLIENT SPECIFICATIONS", {
      x: 40,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.42, 0.17, 1),
    });

    y -= 25;
    page.drawText(`Contact Name:   ${quote.customerName}`, { x: 50, y, size: 10, font: fontRegular });
    y -= 18;
    page.drawText(`Email Address:  ${quote.customerEmail}`, { x: 50, y, size: 10, font: fontRegular });
    y -= 18;
    page.drawText(`Phone / WA:     ${quote.customerPhone}`, { x: 50, y, size: 10, font: fontRegular });
    y -= 18;
    page.drawText(`Target Product: ${quote.productName}`, { x: 50, y, size: 10, font: fontRegular });
    y -= 18;
    page.drawText(`Estimated Qty:  ${quote.quantity ? quote.quantity + " pieces" : "Bulk / Custom"}`, { x: 50, y, size: 10, font: fontRegular });
    y -= 18;
    page.drawText(`Target Budget:  ${quote.budget ? "Rs. " + quote.budget.toLocaleString("en-IN") : "Standard Tiered"}`, { x: 50, y, size: 10, font: fontRegular });

    y -= 40;

    // Design Notes Section
    page.drawText("2. CREATIVE & PRINTING INSTRUCTIONS", {
      x: 40,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.42, 0.17, 1),
    });

    y -= 25;
    const notesText = quote.notes || "No special Pantone instructions provided. Standard vector trace required.";
    page.drawText(notesText.slice(0, 300), {
      x: 50,
      y,
      size: 10,
      font: fontRegular,
      maxWidth: 495,
      lineHeight: 14,
    });

    y -= 80;

    // Asset Reference
    page.drawText("3. ATTACHED VECTOR / ARTWORK ASSET", {
      x: 40,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.42, 0.17, 1),
    });

    y -= 25;
    page.drawText(`Asset URL: ${quote.briefFileUrl || "Direct vector brief submitted via customizer studio."}`, {
      x: 50,
      y,
      size: 9,
      font: fontRegular,
      maxWidth: 495,
    });

    y -= 60;
    // Footer notes
    page.drawText("Confidential • Purple Friday In-House Prepress Facility • Bengaluru, Karnataka", {
      x: 40,
      y: 40,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PF-Brief-${quote.id}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating brief PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

