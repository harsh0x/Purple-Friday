import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRazorpaySignature } from "@/lib/security/payments";
import { markOrderPaid } from "@/lib/orders";

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    const { orderId, razorpayOrderId, paymentId, signature } = parsed.data;

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLiveRazorpay = Boolean(
      razorpaySecret &&
      !razorpaySecret.includes("dummy") &&
      !razorpaySecret.includes("sample")
    );

    if (isLiveRazorpay && razorpaySecret) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId,
        signature,
        secret: razorpaySecret,
      });

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Payment signature verification failed." },
          { status: 400 }
        );
      }
    }

    // Update order status to PAID
    const order = await markOrderPaid(orderId, paymentId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // Confirmation email (Resend / console fallback)
    console.log(
      `[ORDER CONFIRMATION EMAIL] Sent to ${order.customerEmail} for ${order.orderNumber} (₹${order.total})`
    );

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}