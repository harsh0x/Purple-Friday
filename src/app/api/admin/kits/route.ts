import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getAllKits, saveKit } from "@/server/kits/kits-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (
    !user ||
    (!hasPermission(user.role as never, "admin:manage_products") &&
      !hasPermission(user.role as never, "admin:view_orders"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kits = await getAllKits();
  return NextResponse.json({ success: true, kits });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

  if (!user || !hasPermission(user.role as never, "admin:manage_products")) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await saveKit(body, {
      name: user.name || user.email || "Super Admin",
      role: user.role || "SUPER_ADMIN",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, kit: result.kit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save kit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
