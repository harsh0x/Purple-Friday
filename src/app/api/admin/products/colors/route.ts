import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  getMasterColors,
  addMasterColor,
} from "@/server/products/product-service";

export async function GET() {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const colors = getMasterColors();
  return NextResponse.json({ success: true, colors });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, hex } = body;
    if (!name || !hex) {
      return NextResponse.json({ error: "Name and HEX code are required" }, { status: 400 });
    }

    const color = addMasterColor(name, hex);
    return NextResponse.json({ success: true, color });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add colour";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
