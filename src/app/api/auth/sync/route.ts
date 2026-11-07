import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveUploaderIdentity } from "@/lib/security/session";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const { uploaderId: anonId } = resolveUploaderIdentity(req);

  let syncedCount = 0;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy") && anonId) {
      // Re-assign designs created under anonymous session to authenticated user
      const result = await prisma.design.updateMany({
        where: { userId: anonId },
        data: { userId },
      });
      syncedCount = result.count;
    }
  } catch {
    // Ignore fallback
  }

  return NextResponse.json({
    success: true,
    syncedCount,
  });
}
