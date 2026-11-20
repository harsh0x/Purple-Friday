import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { SUPPORT_TICKET_STORE, addSupportTicketReply } from "@/server/reviews/review-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketNumber } = await params;
  const ticket = SUPPORT_TICKET_STORE.get(ticketNumber);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketNumber } = await params;

  try {
    const body = await req.json();
    const { message, newStatus } = body;

    if (!message && !newStatus) {
      return NextResponse.json({ error: "Message or newStatus required" }, { status: 400 });
    }

    const updated = await addSupportTicketReply({
      ticketNumber,
      message: message || `Status updated to ${newStatus}`,
      newStatus,
      actor: session.name,
      actorRole: session.role,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}