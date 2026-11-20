import { NextRequest, NextResponse } from "next/server";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { computeOrderSla } from "@/server/orders/orders-service";
import { createNotification } from "@/lib/admin/notifications";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return handleCronTick(req);
}

export async function POST(req: NextRequest) {
  return handleCronTick(req);
}

async function handleCronTick(req: NextRequest) {
  // CRON_SECRET security gate
  const authHeader = req.headers.get("authorization");
  const cronSecretHeader = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET || "pf_cron_secret_staging_2026";

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` ||
    cronSecretHeader === expectedSecret ||
    process.env.NODE_ENV !== "production";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const now = Date.now();
  const hour = 3600 * 1000;
  let nudgesSent = 0;
  let overdueCount = 0;

  const orders = Array.from(ORDER_STORE.values());

  for (const order of orders) {
    // 1. Proof Approval Reminders (24h and 48h nudges)
    if (order.status === "MOCKUP_SENT" && order.mockupSentAt) {
      const sentTime = new Date(order.mockupSentAt).getTime();
      const elapsed = now - sentTime;
      const addr = (order.address || {}) as Record<string, string>;
      const customerEmail = addr.email || "customer";

      // 24-hour reminder
      if (elapsed >= 24 * hour && order.nudgeCount === 0) {
        order.nudgeCount = 1;
        nudgesSent++;

        await createNotification({
          userOrRole: order.userId || "role:CUSTOMER",
          title: `Friendly Reminder: Proof Pending Approval #${order.orderNumber}`,
          body: `Your digital merchandise proof has been waiting for 24 hours. Review and approve to proceed to production.`,
          link: `/proof/${order.approvalTokenHash || order.orderNumber}`,
        });

        // Record Job row in DB if available
        try {
          if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
            await prisma.job.create({
              data: {
                type: "CUSTOMER_PROOF_REMINDER_24H",
                payload: { orderNumber: order.orderNumber, customerEmail },
                runAt: new Date(),
                processedAt: new Date(),
                status: "COMPLETED",
                dedupKey: `nudge_24h_${order.orderNumber}`,
              },
            });
          }
        } catch {
          // In-memory fallback
        }
      }

      // 48-hour urgent reminder
      if (elapsed >= 48 * hour && order.nudgeCount === 1) {
        order.nudgeCount = 2;
        nudgesSent++;

        await createNotification({
          userOrRole: order.userId || "role:CUSTOMER",
          title: `Urgent: Order #${order.orderNumber} Proof Needs Approval`,
          body: `Your proof has been waiting for 48 hours. Please approve or request changes so we can guarantee your delivery schedule.`,
          link: `/proof/${order.approvalTokenHash || order.orderNumber}`,
        });

        try {
          if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
            await prisma.job.create({
              data: {
                type: "CUSTOMER_PROOF_REMINDER_48H",
                payload: { orderNumber: order.orderNumber, customerEmail },
                runAt: new Date(),
                processedAt: new Date(),
                status: "COMPLETED",
                dedupKey: `nudge_48h_${order.orderNumber}`,
              },
            });
          }
        } catch {
          // In-memory fallback
        }
      }
    }

    // 2. Dispatch SLA Overdue Checks
    if (["CUSTOMER_APPROVED", "IN_PRINTING", "QC_PASSED"].includes(order.status)) {
      const sla = computeOrderSla(order);
      if (sla.isOverdue) {
        overdueCount++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    nudgesSent,
    overdueOrders: overdueCount,
    timestamp: new Date().toISOString(),
  });
}
