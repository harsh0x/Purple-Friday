import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { getCustomerDetail, setCustomerNote } from "@/server/customers/customer-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const detail = await getCustomerDetail(decodedId);
  if (!detail) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

  export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    try {
      const body = await req.json();
      const { note } = body;

      if (typeof note !== "string") {
        return NextResponse.json({ error: "Note string is required" }, { status: 400 });
      }

      const result = await setCustomerNote(decodedId, note, session.email, session.role);
      return NextResponse.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    return POST(req, context);
  }
