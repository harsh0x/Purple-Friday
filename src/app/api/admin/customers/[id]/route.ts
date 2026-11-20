import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { computeRfmCustomerProfiles } from "@/server/analytics/rfm";

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

  const orders = Array.from(ORDER_STORE.values());
  const profiles = computeRfmCustomerProfiles(orders);

  const profile = profiles.find(
    (p) =>
      p.customerId === decodedId ||
      p.customerEmail.toLowerCase() === decodedId.toLowerCase()
  );

  if (!profile) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}