import { NextRequest, NextResponse } from "next/server";
import { getShipmentByAwb, syncParentOrderStatus } from "@/server/shipping/shipping-service";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-shipping-webhook-secret");
    const configuredSecret = process.env.SHIPPING_WEBHOOK_SECRET || "default_shipping_secret";

    // Verify secret
    if (secret !== configuredSecret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const body = await req.json();
    const { awb, status, location, description, timestamp } = body;

    if (!awb || !status) {
      return NextResponse.json({ error: "Missing required fields: awb and status" }, { status: 400 });
    }

    const shipment = getShipmentByAwb(awb);
    if (!shipment) {
      return NextResponse.json({ error: `Shipment with AWB ${awb} not found.` }, { status: 404 });
    }

    const now = timestamp || new Date().toISOString();
    shipment.status = status;
    shipment.updatedAt = now;
    shipment.trackingHistory.push({
      timestamp: now,
      status,
      location: location || "Courier Network",
      description: description || `Status updated to ${status}`,
    });

    // If shipment moved to DELIVERED or RTO, evaluate parent order status
    await syncParentOrderStatus(shipment.orderNumber, "system@shipping.webhook", "SYSTEM");

    return NextResponse.json({
      success: true,
      awb,
      orderNumber: shipment.orderNumber,
      updatedStatus: status,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
