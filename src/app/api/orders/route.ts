import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";

const orderInputSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  customerEmail: z.string().email("Invalid email address."),
  customerPhone: z
    .string()
    .regex(/^[6-9][0-9]{9}$/, "Please enter a valid 10-digit Indian mobile number."),
  companyName: z.string().optional(),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format (15 characters required)."
    )
    .optional()
    .or(z.literal("")),
  shippingAddress: z.object({
    line1: z.string().min(3, "Address line 1 is required."),
    line2: z.string().optional(),
    city: z.string().min(2, "City is required."),
    state: z.string().min(2, "State is required."),
    pin: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code."),
  }),
  billingAddress: z
    .object({
      state: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD", "PREPAID"]).default("RAZORPAY").optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      optionKey: z.string().min(1),
      qty: z.number().int().min(1),
      options: z.record(z.string(), z.string()).optional(),
      designId: z.string().optional(),
    })
  ).min(1, "Order must contain at least one item."),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // CSRF Origin Protection
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-origin requests are forbidden." },
      { status: 403 }
    );
  }

  // Rate Limiting (10 requests/min per IP)
  const clientKey = getClientKey(req, "orders");
  const rateLimitResult = await checkRateLimit(clientKey, 10, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many order attempts. Please slow down." },
      { status: 429 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;

  try {
    const body = await req.json();
    const parsed = orderInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid order information.",
        },
        { status: 400 }
      );
    }

    const { gstin, ...rest } = parsed.data;

    const order = await createOrder({
      ...rest,
      gstin: gstin || undefined,
      userId,
    });

    const isRazorpayConfigured = Boolean(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes("dummy")
    );

    const chargeAmountPaise =
      order.paymentMethod === "COD"
        ? (order.advancePaidPaise || Math.round(order.total * 25))
        : order.total * 100;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: order.razorpayOrderId,
      amount: chargeAmountPaise, // Online charge amount in paise (advance for COD, full for prepaid)
      currency: "INR",
      paymentMethod: order.paymentMethod,
      advancePaidPaise: order.advancePaidPaise,
      balanceDuePaise: order.balanceDuePaise,
      keyId: isRazorpayConfigured ? process.env.RAZORPAY_KEY_ID : "rzp_test_mock_purple_friday",
      isMock: !isRazorpayConfigured,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}