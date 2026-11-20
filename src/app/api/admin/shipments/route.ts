import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SHIPMENT_STORE, StoredShipment } from "@/server/shipping/shipping-service";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Deduplicate memory store
  const unique = new Map<string, StoredShipment>();
  for (const s of SHIPMENT_STORE.values()) {
    unique.set(s.shipmentNumber, s);
  }

  // If DB available, query
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const dbShipments = await prisma.shipment.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      for (const ds of dbShipments) {
        unique.set(ds.shipmentNumber, {
          id: ds.id,
          orderId: ds.orderId,
          orderNumber: ds.shipmentNumber.split("-SH")[0],
          shipmentNumber: ds.shipmentNumber,
          recipientName: ds.recipientName,
          recipientPhone: ds.recipientPhone,
          addressLine: ds.addressLine,
          city: ds.city,
          state: ds.state,
          pincode: ds.pincode,
          items: (ds.items as unknown as Array<{ name: string; qty: number; sku?: string }>) || [],
          awb: ds.awb,
          courier: ds.courier,
          labelUrl: ds.labelUrl,
          status: ds.status as StoredShipment["status"],
          collectCodAmountPaise: ds.collectCodAmountPaise,
          trackingHistory: (ds.trackingHistory as unknown as StoredShipment["trackingHistory"]) || [],
          createdAt: ds.createdAt.toISOString(),
          updatedAt: ds.updatedAt.toISOString(),
        });
      }
    }
  } catch {
    // Memory fallback
  }

  const list = Array.from(unique.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ success: true, shipments: list });
}
