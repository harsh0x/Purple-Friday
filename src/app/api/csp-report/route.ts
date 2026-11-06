import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    let reportData = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/csp-report") || contentType.includes("application/json")) {
      reportData = await req.json();
    } else {
      const text = await req.text();
      try {
        reportData = JSON.parse(text);
      } catch {
        reportData = { raw: text };
      }
    }

    logger.warn({ cspReport: reportData }, "[CSP Violation Report]");

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logger.error({ err }, "Failed to parse CSP violation report");
    return new NextResponse(null, { status: 400 });
  }
}

