import { NextRequest, NextResponse } from "next/server";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { createNotification } from "@/lib/admin/notifications";
import prisma from "@/lib/prisma";
import { triggerScheduledReviewRequests } from "@/server/reviews/review-service";
import { processMessageRetries } from "@/server/notifications/notify";
import { getAdminProducts } from "@/server/products/product-service";
import { notifyAdmin } from "@/server/notifications/admin-dispatcher";

export const dynamic = "force-dynamic";

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

  const orders = Array.from(new Set(ORDER_STORE.values()));

  for (const order of orders) {
    // 1. Single 24-hour Proof Approval Reminder
    if (order.status === "MOCKUP_SENT" && order.mockupSentAt) {
      const sentTime = new Date(order.mockupSentAt).getTime();
      const elapsed = now - sentTime;
      const addr = (order.address || {}) as Record<string, string>;
      const customerEmail = addr.email || "customer";

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
    }
  }

  // 2. Automated Review Requests (runs for orders delivered >= 3 days ago)
  const reviewResult = await triggerScheduledReviewRequests();

  // 3. Process Transactional Message Retries (max 3 tries)
  const retryResult = await processMessageRetries();

  // 4. Low Stock Safety Checks
  let lowStockAlertsSent = 0;
  try {
    const products = await getAdminProducts();
    for (const p of products) {
      if (p.colors) {
        for (const c of p.colors) {
          if (c.stock !== undefined && c.stock !== null && c.stock <= 10) {
            lowStockAlertsSent++;
            await notifyAdmin("LOW_STOCK_ALERT", {
              productId: p.id,
              productName: `${p.name} (${c.name})`,
              currentStock: c.stock,
              threshold: 10,
            });
          }
        }
      }
    }
  } catch {
    // Non-blocking stock check
  }

  return NextResponse.json({
    success: true,
    nudgesSent,
    reviewsTriggered: reviewResult.requestsSent,
    retriesProcessed: retryResult.retried,
    retriesSucceeded: retryResult.succeeded,
    lowStockAlertsSent,
    timestamp: new Date().toISOString(),
  });
}
