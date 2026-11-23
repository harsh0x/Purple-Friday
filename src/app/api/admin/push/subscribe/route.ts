import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  savePushSubscription,
  isPushConfigured,
  getVapidPublicKey,
} from "@/server/notifications/web-push";
import { writeAudit } from "@/lib/admin/audit";

export async function GET() {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    configured: isPushConfigured(),
    vapidPublicKey: getVapidPublicKey(),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: "Invalid subscription data." }, { status: 400 });
    }

    const record = await savePushSubscription("role:ADMIN", { endpoint, keys });

    await writeAudit({
      actor: session!.email,
      actorRole: session!.role,
      action: "push.subscribed",
      entityType: "PUSH_SUBSCRIPTION",
      entityId: record.id,
      after: { endpoint: endpoint.slice(0, 40) + "..." },
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save push subscription.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
