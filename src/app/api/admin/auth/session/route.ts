import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      phone: session.phone,
      mustChangePassword: session.mustChangePassword,
    },
    expiresAt: new Date(session.expiresAt).toISOString(),
  });
}
