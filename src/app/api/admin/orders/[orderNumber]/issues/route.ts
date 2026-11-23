import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import { writeAudit } from "@/lib/admin/audit";
import { ORDER_ISSUES } from "@/server/customers/account-service";
import { ORDER_STORE, changeOrderStatus } from "@/server/orders/state-machine";
import { notify } from "@/server/notifications/notify";

const issueActionSchema = z.object({
  action: z.enum(["reply", "resolve", "refund"]),
  message: z.string().min(1, "Message or reason is required.").max(1000),
  refundAmountPaise: z.number().int().nonnegative().optional(),
  refundReason: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { orderNumber } = await props.params;

  const issues = Array.from(ORDER_ISSUES.values()).filter(
    (i) => i.orderNumber === orderNumber
  );

  return NextResponse.json({
    success: true,
    orderNumber,
    issues,
  });
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { orderNumber } = await props.params;

  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) {
    return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
  }

  const orderAddr = (order.address || {}) as Record<string, string>;
  const customerEmail = (order.customerEmail || orderAddr.email || "").toLowerCase().trim();

  try {
    const body = await req.json();
    const parsed = issueActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const { action, message, refundAmountPaise, refundReason } = parsed.data;

    // Find latest open issue or create reference
    const orderIssues = Array.from(ORDER_ISSUES.values()).filter(
      (i) => i.orderNumber === orderNumber
    );
    const targetIssue = orderIssues.find((i) => i.status === "OPEN") || orderIssues[0];

    const now = new Date().toISOString();

    if (action === "reply") {
      // 1. Admin Reply
      if (targetIssue) {
        targetIssue.status = "ANSWERED";
        targetIssue.adminReply = message;
        targetIssue.updatedAt = now;
      }

      const eventMessage = `Support reply: "${message}"`;
      order.events = [
        {
          id: `evt_reply_${Date.now()}`,
          type: "INTERNAL_NOTE",
          status: order.status,
          actor: session!.name ? `${session!.name} (${session!.email})` : session!.email,
          actorRole: "ADMIN",
          message: eventMessage,
          createdAt: now,
        },
        ...(order.events || []),
      ];

      if (customerEmail) {
        await notify("problem_report_update", customerEmail, {
          orderNumber,
          updateMessage: message,
        });
      }

      await writeAudit({
        actor: session!.email,
        actorRole: session!.role,
        action: "order.problem_reply",
        entityType: "ORDER",
        entityId: orderNumber,
        after: { action: "reply", message },
      });

      return NextResponse.json({
        success: true,
        message: "Customer notified of your reply.",
        orderNumber,
      });
    }

    if (action === "resolve") {
      // 2. Resolve Issue
      if (targetIssue) {
        targetIssue.status = "CLOSED";
        targetIssue.updatedAt = now;
      }

      const eventMessage = `Issue marked as resolved: "${message}"`;
      order.events = [
        {
          id: `evt_resolved_${Date.now()}`,
          type: "STATUS_CHANGE",
          status: order.status,
          actor: session!.name ? `${session!.name} (${session!.email})` : session!.email,
          actorRole: "ADMIN",
          message: eventMessage,
          createdAt: now,
        },
        ...(order.events || []),
      ];

      if (customerEmail) {
        await notify("problem_report_update", customerEmail, {
          orderNumber,
          updateMessage: `Your reported issue on Order #${orderNumber} has been resolved: ${message}`,
        });
      }

      await writeAudit({
        actor: session!.email,
        actorRole: session!.role,
        action: "order.problem_resolved",
        entityType: "ORDER",
        entityId: orderNumber,
        after: { action: "resolve", message },
      });

      return NextResponse.json({
        success: true,
        message: "Issue resolved and customer notified.",
        orderNumber,
      });
    }

    if (action === "refund") {
      // 3. Refund Issue
      if (targetIssue) {
        targetIssue.status = "REFUNDED";
        targetIssue.updatedAt = now;
      }

      // Transition order status to REFUNDED if permitted
      try {
        await changeOrderStatus(
          order.id,
          "REFUNDED",
          {
            email: session!.email,
            role: session!.role,
            name: session!.name,
          },
          refundReason || message || "Refund processed in response to customer problem report."
        );
      } catch {
        // If state machine transition REFUNDED is directly restricted from current state, log event directly
        order.events = [
          {
            id: `evt_refund_${Date.now()}`,
            type: "STATUS_CHANGE",
            status: "REFUNDED",
            actor: session!.name ? `${session!.name} (${session!.email})` : session!.email,
            actorRole: "ADMIN",
            message: `Refund granted: "${message}"`,
            createdAt: now,
          },
          ...(order.events || []),
        ];
      }

      if (customerEmail) {
        await notify("cancelled_or_refunded", customerEmail, {
          orderNumber,
          reason: `Refund approved: ${message}`,
        });
      }

      await writeAudit({
        actor: session!.email,
        actorRole: session!.role,
        action: "order.problem_refunded",
        entityType: "ORDER",
        entityId: orderNumber,
        after: { action: "refund", message, refundAmountPaise },
      });

      return NextResponse.json({
        success: true,
        message: "Refund processed and customer notified.",
        orderNumber,
      });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to execute issue action.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
