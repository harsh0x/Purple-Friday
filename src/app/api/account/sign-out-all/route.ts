import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bumpTokenVersion } from "@/lib/auth-service";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  try {
    await bumpTokenVersion(userId);
    return NextResponse.json({
      success: true,
      message: "All other sessions have been signed out.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sign out of devices.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
