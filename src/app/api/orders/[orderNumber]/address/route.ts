import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { changeOrderDeliveryAddress } from "@/server/customers/account-service";
import { isSameOrigin } from "@/lib/security/origin";

const addressSchema = z.object({
  line1: z.string().min(3, "Address line 1 is required."),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  pin: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code."),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const email = session.user.email;
  const { orderNumber } = await props.params;

  if (!userId || !email) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body.address || body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid address." },
        { status: 400 }
      );
    }

    await changeOrderDeliveryAddress({
      orderNumber,
      userId,
      customerEmail: email,
      address: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: "Order delivery address updated successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update delivery address.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
