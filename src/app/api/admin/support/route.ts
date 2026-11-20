import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { SUPPORT_TICKET_STORE, StoredSupportTicket } from "@/server/reviews/review-service";
import crypto from "crypto";
import { writeAudit } from "@/lib/admin/audit";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let tickets = Array.from(SUPPORT_TICKET_STORE.values());
  if (status && status !== "ALL") {
    tickets = tickets.filter((t) => t.status === status);
  }

  // Sort newest first
  tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allTickets = Array.from(SUPPORT_TICKET_STORE.values());

  return NextResponse.json({
    tickets,
    counts: {
      all: allTickets.length,
      open: allTickets.filter((t) => t.status === "OPEN").length,
      pending: allTickets.filter((t) => t.status === "PENDING_CUSTOMER").length,
      resolved: allTickets.filter((t) => t.status === "RESOLVED").length,
      closed: allTickets.filter((t) => t.status === "CLOSED").length,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderNumber, customerName, customerEmail, subject, message, priority } = body;

    if (!orderNumber || !customerName || !customerEmail || !message) {
      return NextResponse.json({ error: "Missing required ticket fields" }, { status: 400 });
    }

    const ticketNumber = `TKT-${new Date().getFullYear()}-${1000 + SUPPORT_TICKET_STORE.size + 1}`;
    const now = new Date().toISOString();

    const newTicket: StoredSupportTicket = {
      id: `tkt_${crypto.randomUUID()}`,
      ticketNumber,
      orderNumber,
      customerName,
      customerEmail,
      subject: subject || `Inquiry on Order #${orderNumber}`,
      status: "OPEN",
      priority: priority || "MEDIUM",
      assignee: session.email || "support@purplefriday.in",
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: session.name,
          senderRole: session.role,
          message,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    SUPPORT_TICKET_STORE.set(ticketNumber, newTicket);

    await writeAudit({
      actor: session.name,
      actorRole: session.role,
      action: "support.ticket_created",
      entityType: "SUPPORT_TICKET",
      entityId: ticketNumber,
      after: newTicket as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create support ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}