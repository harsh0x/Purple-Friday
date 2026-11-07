import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import {
  getAdminQuotes,
  updateAdminQuoteStatus,
  AdminQuote,
} from "@/lib/admin/admin-store";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotes = getAdminQuotes();
  return NextResponse.json({ success: true, quotes });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    const allowedStatuses: AdminQuote["status"][] = ["IN_TOUCH", "QUOTED", "WON", "LOST"];
    if (!id || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Valid ID and status required" }, { status: 400 });
    }

    const updated = updateAdminQuoteStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await logAdminAction({
      adminId: (session?.user as { id?: string })?.id || "admin",
      adminEmail: session?.user?.email || "admin@purplefriday.com",
      action: "UPDATE_QUOTE_STATUS",
      targetId: id,
      details: { status },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating quote";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
