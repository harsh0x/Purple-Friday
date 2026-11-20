import { NextRequest, NextResponse } from "next/server";
import { verifyCmsPreviewToken } from "@/server/cms/cms-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token || !verifyCmsPreviewToken(token)) {
    return NextResponse.json({ error: "Invalid or expired preview token" }, { status: 403 });
  }

  // Redirect to homepage with previewToken set in URL
  const origin = req.nextUrl.origin;
  const redirectUrl = new URL("/", origin);
  redirectUrl.searchParams.set("previewToken", token);

  return NextResponse.redirect(redirectUrl);
}
