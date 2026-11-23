import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  getAdminAlertPreferences,
  updateAdminAlertPreferences,
} from "@/lib/admin/app-settings";
import { isPushConfigured } from "@/server/notifications/web-push";

export async function GET() {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const preferences = await getAdminAlertPreferences();
  return NextResponse.json({
    preferences,
    isPushConfigured: isPushConfigured(),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await updateAdminAlertPreferences(
      body.preferences || body,
      session!.email,
      session!.role
    );

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: "Notification preferences saved and audited.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notification settings.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
