import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";
import { signGuestOrderToken } from "@/lib/security/guest-order";
import { notify } from "@/server/notifications/notify";

import { ORDER_IDEMPOTENCY_MAP, CachedOrderResponse } from "@/server/orders/idempotency";

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
  paymentMethod: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        optionKey: z.string().min(1),
        qty: z.number().int().min(1),
        options: z.record(z.string(), z.string()).optional(),
        designId: z.string().optional(),
        unitPrice: z.number().optional(), // Server recomputes, ignore
        lineTotal: z.number().optional(), // Server recomputes, ignore
      })
    )
    .min(1, "Order must contain at least one item."),
  couponCode: z.string().optional(),
  idempotencyKey: z.string().optional(),
  total: z.number().optional(), // Server recomputes, ignore
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

  let userId: string | undefined = undefined;
  try {
    const session = await getServerSession(authOptions);
    userId = session?.user ? (session.user as { id?: string }).id : undefined;
  } catch {
    // In test or non-request context
  }

  try {
    const body = await req.json();

    // Check optional idempotency key
    const headerIdemp =
      req.headers.get("x-idempotency-key") || req.headers.get("idempotency-key");
    const idempotencyKey = (body?.idempotencyKey || headerIdemp || "").trim();

    if (idempotencyKey && ORDER_IDEMPOTENCY_MAP.has(idempotencyKey)) {
      const cached = ORDER_IDEMPOTENCY_MAP.get(idempotencyKey)!;
      const res = NextResponse.json({
        success: true,
        orderId: cached.orderId,
        orderNumber: cached.orderNumber,
        total: cached.total,
        paymentMethod: cached.paymentMethod,
        paymentStatus: cached.paymentStatus,
      });

      // Maintain guest ownership cookie
      res.cookies.set(`pf_guest_order_${cached.orderNumber}`, cached.cookieToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      res.cookies.set("pf_guest_order", cached.cookieToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

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

    const { gstin, items, shippingAddress, billingAddress, customerName, customerEmail, customerPhone, companyName, couponCode } = parsed.data;

    // Server-side calculation ignores any client prices
    const order = await createOrder({
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      gstin: gstin || undefined,
      shippingAddress,
      billingAddress,
      paymentMethod: "COD",
      items,
      couponCode,
      userId,
    });

    // Notify customer via transactional email & admin
    try {
      await notify("order_placed", order.customerEmail, {
        orderNumber: order.orderNumber,
        total: order.total * 100,
        totalFormatted: `₹${order.total.toLocaleString("en-IN")}`,
      });
    } catch (notifErr) {
      console.warn("[orders] Customer order_placed notification failed:", notifErr);
    }

    // Signed guest ownership cookie
    const guestToken = await signGuestOrderToken(order.orderNumber);

    const responsePayload: CachedOrderResponse = {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod || "COD",
      paymentStatus: order.paymentStatus || "PENDING",
      cookieToken: guestToken,
    };

      if (idempotencyKey) {
        ORDER_IDEMPOTENCY_MAP.set(idempotencyKey, responsePayload);
      }

        const response = NextResponse.json({
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          paymentMethod: order.paymentMethod || "COD",
          paymentStatus: order.paymentStatus || "PENDING",
        });

        // Set signed httpOnly cookie for guest ownership
        response.cookies.set(`pf_guest_order_${order.orderNumber}`, guestToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        response.cookies.set("pf_guest_order", guestToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create order";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
      }
    }