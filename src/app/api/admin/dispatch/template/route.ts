import { NextResponse } from "next/server";
import { getSplitDispatchCsvTemplate } from "@/server/shipping/shipping-service";

export async function GET() {
  const csv = getSplitDispatchCsvTemplate();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="purple-friday-split-dispatch-template.csv"',
    },
  });
}
