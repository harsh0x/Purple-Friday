import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrderByNumberAsync } from "@/lib/orders";
import { maskCustomerName, maskPhoneNumber, maskEmail } from "@/lib/security/privacy";

const trackOrderSchema = z.object({
  orderNumber: z.string().min(3),
  contact: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const parsed = trackOrderSchema.safeParse(body);

    if (!parsed.success) {
      await ensureConstantTime(startTime, 150);
      return NextResponse.json(
        { success: false, error: "Please enter both an order number and phone or email." },
        { status: 400 }
      );
    }

    const { orderNumber, contact } = parsed.data;
    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    const cleanContact = contact.trim().toLowerCase();

    const order = await getOrderByNumberAsync(cleanOrderNumber);

    const matchesEmail = order?.customerEmail.toLowerCase() === cleanContact;
    const matchesPhone =
      order?.customerPhone.replace(/\D/g, "") === cleanContact.replace(/\D/g, "");

    if (!order || (!matchesEmail && !matchesPhone)) {
      await ensureConstantTime(startTime, 150);
      return NextResponse.json(
        {
          success: false,
          error: "No matching order found for this order reference and contact detail.",
        },
        { status: 404 }
      );
    }

    // Calculate expected dispatch date (4 days from order creation)
    const orderDate = new Date(order.createdAt);
    const expectedDispatch = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);

    await ensureConstantTime(startTime, 150);

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        expectedDispatchDate: expectedDispatch.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        trackingNumber: order.trackingNumber || (order.status === "DISPATCHED" ? `EXP-DEL-${order.orderNumber.replace("PF-", "")}` : undefined),
        customerName: maskCustomerName(order.customerName),
        customerPhone: maskPhoneNumber(order.customerPhone),
        customerEmail: maskEmail(order.customerEmail),
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        itemsCount: order.items.length,
        itemsSummary: order.items.map((i) => `${i.qty}x ${i.productName}`),
      },
    });
  } catch (err: unknown) {
    await ensureConstantTime(startTime, 150);
    const msg = err instanceof Error ? err.message : "Tracking lookup error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * Ensures uniform response time to mitigate side-channel timing attacks
 */
async function ensureConstantTime(startMs: number, targetMs: number) {
  const elapsed = Date.now() - startMs;
  if (elapsed < targetMs) {
    await new Promise((r) => setTimeout(r, targetMs - elapsed));
  }
}

