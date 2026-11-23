import { NextRequest, NextResponse } from "next/server";
import { getPublishedCms } from "@/server/cms/cms-service";

export const revalidate = 60; // 60s ISR cache, revalidated on publish

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const previewToken = searchParams.get("previewToken");

  try {
    const cms = await getPublishedCms(previewToken);
    return NextResponse.json({ success: true, cms }, {
      headers: {
        "Cache-Control": previewToken ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load storefront content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
