import { NextRequest, NextResponse } from "next/server";
import { getPublishedCms } from "@/server/cms/cms-service";

export const revalidate = 60; // 60s ISR cache tag

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const previewToken = searchParams.get("previewToken");

  const cms = await getPublishedCms(previewToken);

  return NextResponse.json(
    { success: true, cms },
    {
      headers: {
        "Cache-Control": previewToken ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
