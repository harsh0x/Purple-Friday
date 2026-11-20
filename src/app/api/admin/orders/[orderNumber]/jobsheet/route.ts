import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";
import { generateProductionJobSheetPdf } from "@/server/production/jobsheet-generator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { orderNumber } = await context.params;

  try {
    const pdfBytes = await generateProductionJobSheetPdf(orderNumber);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="PF-JobSheet-${orderNumber}.pdf"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate job sheet";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
