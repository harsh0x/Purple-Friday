import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  savePushSubscription,
  isPushConfigured,
  getVapidPublicKey,
} from "@/server/notifications/web-push";

export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured(),
    vapidPublicKey: getVapidPublicKey(),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id || session.user.email || "customer";

  try {
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: "Invalid subscription data." }, { status: 400 });
    }

    const record = await savePushSubscription(userId, { endpoint, keys });
    return NextResponse.json({ success: true, id: record.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save push subscription.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
