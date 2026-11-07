import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin/tier-validator";
import { getAuditLogs } from "@/lib/admin/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = getAuditLogs();
  return NextResponse.json({ success: true, logs });
}

