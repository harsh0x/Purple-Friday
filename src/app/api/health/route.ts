import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("dummy") &&
      !process.env.DATABASE_URL.includes("sample-project")
    ) {
      await prisma.$queryRaw`SELECT 1`;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Database health check failed" },
      { status: 503 }
    );
  }
}
