import { NextRequest, NextResponse } from "next/server";
import { SHIPMENT_STORE } from "@/server/shipping/shipping-service";
import { generateShippingLabelPdf } from "@/server/shipping/label-generator";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ shipmentNumber: string }> }
) {
  const { shipmentNumber } = await props.params;

  const shipment =
    SHIPMENT_STORE.get(shipmentNumber) ||
    Array.from(SHIPMENT_STORE.values()).find(
      (s) => s.shipmentNumber === shipmentNumber || s.awb === shipmentNumber
    );

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  try {
    const pdfBytes = await generateShippingLabelPdf(shipment);
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="shipping-label-${shipment.shipmentNumber}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate label";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
