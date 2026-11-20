import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requirePermission } from "@/lib/admin/permissions";
import { getAuditLogs, AuditQueryFilter } from "@/lib/admin/audit";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  try {
    requirePermission(session, "admin:view_audit");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const filter: AuditQueryFilter = {
    actor: searchParams.get("actor") || undefined,
    action: searchParams.get("action") || undefined,
    entityType: searchParams.get("entityType") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    search: searchParams.get("search") || undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
  };

  const logs = await getAuditLogs(filter);
  return NextResponse.json({ success: true, logs });
}
