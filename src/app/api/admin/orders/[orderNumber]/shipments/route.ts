import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  createSingleShipment,
  getShipmentsForOrder,
} from "@/server/shipping/shipping-service";

const shipmentInputSchema = z.object({
  recipientName: z.string().min(2),
  recipientPhone: z.string().min(10),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
  items: z.array(z.object({ name: z.string(), qty: z.number().int().min(1) })),
  providerName: z.enum(["MANUAL", "SHIPROCKET"]).optional(),
  courierName: z.string().optional(),
  awb: z.string().optional(),
  collectCodAmountPaise: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await props.params;
  const shipments = getShipmentsForOrder(orderNumber);
  return NextResponse.json({ success: true, shipments });
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role || "CUSTOMER";
  const email = session.user.email || "staff@purplefriday.in";
  const { orderNumber } = await props.params;

  try {
    const body = await req.json();
    const parsed = shipmentInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid shipment details" },
        { status: 400 }
      );
    }

    const shipment = await createSingleShipment({
      orderNumber,
      recipientName: parsed.data.recipientName,
      recipientPhone: parsed.data.recipientPhone,
      addressLine: parsed.data.addressLine,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      items: parsed.data.items,
      providerName: parsed.data.providerName,
      courierName: parsed.data.courierName,
      awb: parsed.data.awb,
      collectCodAmountPaise: parsed.data.collectCodAmountPaise,
      actor: email,
      actorRole: role,
    });

    return NextResponse.json({ success: true, shipment });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create shipment";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
