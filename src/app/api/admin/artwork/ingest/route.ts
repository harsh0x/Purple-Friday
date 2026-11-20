import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";
import { ingestArtworkFile } from "@/server/artwork/artwork-ingestion";
import { ORDER_STORE } from "@/server/orders/state-machine";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orderNumber = formData.get("orderNumber") as string | null;
    const itemId = formData.get("itemId") as string | null;
    const printWidthInchesStr = formData.get("printWidthInches") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const printWidthInches = printWidthInchesStr ? parseFloat(printWidthInchesStr) : 10;

    const result = await ingestArtworkFile({
      buffer,
      originalFilename: file.name,
      printWidthInches,
    });

    // If order and item specified, associate artwork with the order item
    if (orderNumber && itemId) {
      const order =
        ORDER_STORE.get(orderNumber) ||
        Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

      if (order) {
        const item = order.items.find((i) => i.id === itemId);
        if (item) {
          item.artworkUrl = result.previewUrl || result.downloadUrl;
          order.version += 1;
          order.updatedAt = new Date().toISOString();
        }
      }
    }

    return NextResponse.json({ success: true, artwork: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Artwork ingestion failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
