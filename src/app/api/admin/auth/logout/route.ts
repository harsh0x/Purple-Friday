import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/admin/admin-session";
import { writeAudit } from "@/lib/admin/audit";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  if (session) {
    await writeAudit({
      actor: session.email,
      actorRole: session.role,
      action: "auth.admin_logout",
      entityType: "STAFF_USER",
      entityId: session.userId,
      ipAddress: clientIp,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  clearAdminSessionCookie(response);
  return response;
}
