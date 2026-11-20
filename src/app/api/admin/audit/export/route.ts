import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requirePermission } from "@/lib/admin/permissions";
import { getAuditLogs, AuditQueryFilter } from "@/lib/admin/audit";
import { exportAuditLogsToCsv } from "@/lib/security/csv";

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
    limit: 1000,
  };

  const logs = await getAuditLogs(filter);
  const csvContent = exportAuditLogsToCsv(logs);

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `purple-friday-audit-${dateStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
