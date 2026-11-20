import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedAnalyticsDemoData } from "@/server/analytics/demo-seed";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Demo analytics seed is strictly forbidden in production environments." },
      { status: 403 }
    );
  }

  const session = await getServerSession(authOptions);
  // Allow authorized staff or in test/development
  if (!session?.user && process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedAnalyticsDemoData();
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.totalOrdersCreated} demo analytics orders across 12 months.`,
      result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to seed demo analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
