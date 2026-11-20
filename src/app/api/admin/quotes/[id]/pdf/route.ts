import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getQuoteByIdOrNumber } from "@/server/quotes/quotes-service";
import { generateQuotePdf } from "@/server/invoices/invoice-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (
    !user ||
    (!hasPermission(user.role as never, "admin:view_orders") &&
      !hasPermission(user.role as never, "admin:manage_products"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await getQuoteByIdOrNumber(id);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const pdfBytes = await generateQuotePdf(quote);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Quote-${quote.quoteNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
