import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRazorpaySignature } from "@/lib/security/payments";
import { markOrderPaid, getOrderById } from "@/lib/orders";
import { processCodAdvancePayment } from "@/server/payments/cod-service";
import { toPaise } from "@/server/pricing/engine";

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

      const existingOrder = getOrderById(orderId);
      if (!existingOrder) {
        return NextResponse.json(
          { success: false, error: "Order not found." },
          { status: 404 }
        );
      }

      if (existingOrder.paymentMethod === "COD") {
        const advancePaise = existingOrder.advancePaidPaise || Math.round(toPaise(existingOrder.total) * 0.25);
        await processCodAdvancePayment({
          orderNumber: existingOrder.orderNumber,
          paymentId,
          amountPaise: advancePaise,
        });
        existingOrder.status = "PAID";
        existingOrder.paymentStatus = "ADVANCE_PAID";
        existingOrder.razorpayPaymentId = paymentId;
      } else {
        await markOrderPaid(orderId, paymentId);
      }

      return NextResponse.json({
        success: true,
        orderNumber: existingOrder.orderNumber,
        paymentMethod: existingOrder.paymentMethod,
        paymentStatus: existingOrder.paymentStatus,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment verification failed";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }