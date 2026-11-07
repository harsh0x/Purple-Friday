import { NextRequest, NextResponse } from "next/server";
import { getDesignById } from "@/lib/designs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing design ID" }, { status: 400 });
  }

  const design = await getDesignById(id);
  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    design,
  });
}
