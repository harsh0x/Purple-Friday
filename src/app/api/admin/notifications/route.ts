import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";
import {
  getNotificationsForUserOrRole,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/admin/notifications";

const PatchNotificationSchema = z
  .object({
    action: z.enum(["MARK_READ", "MARK_ALL_READ"]),
    id: z.string().optional(),
  })
  .strict();

export async function GET() {
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifiers = [
    session.userId,
    `role:${session.role}`,
    "role:STAFF",
    "role:SUPER_ADMIN", // Fallback system alerts
  ];

  const notifications = await getNotificationsForUserOrRole(identifiers);
  const unreadCount = notifications.filter((n) => !n.readTime).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const parsed = PatchNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 400 });
  }

  const { action, id } = parsed.data;

  if (action === "MARK_READ") {
    if (!id) return NextResponse.json({ error: "Notification id required." }, { status: 400 });
    await markNotificationAsRead(id);
    return NextResponse.json({ success: true });
  }

  if (action === "MARK_ALL_READ") {
    const identifiers = [session.userId, `role:${session.role}`, "role:STAFF", "role:SUPER_ADMIN"];
    await markAllNotificationsAsRead(identifiers);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported operation." }, { status: 400 });
}
