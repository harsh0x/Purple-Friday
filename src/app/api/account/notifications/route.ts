import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNotificationsForUserOrRole,
  markAllNotificationsAsRead,
} from "@/lib/admin/notifications";
import { isSameOrigin } from "@/lib/security/origin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const userEmail = session.user.email?.toLowerCase().trim();

  const identifiers: string[] = [];
  if (userId) identifiers.push(userId);
  if (userEmail) identifiers.push(userEmail);
  identifiers.push("role:CUSTOMER");

  const notifications = await getNotificationsForUserOrRole(identifiers);
  const unreadCount = notifications.filter((n) => !n.readTime).length;

  return NextResponse.json({
    success: true,
    notifications,
    unreadCount,
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const userEmail = session.user.email?.toLowerCase().trim();

  const identifiers: string[] = [];
  if (userId) identifiers.push(userId);
  if (userEmail) identifiers.push(userEmail);

  await markAllNotificationsAsRead(identifiers);

  return NextResponse.json({
    success: true,
    message: "All notifications marked as read.",
  });
}
