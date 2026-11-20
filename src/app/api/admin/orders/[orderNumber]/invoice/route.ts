import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getOrderByNumber, getOrderById } from "@/lib/orders";
import { generateTaxInvoicePdf } from "@/server/invoices/invoice-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string } | undefined;

  if (!user || !hasPermission(user.role as never, "admin:view_orders")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber) || getOrderById(orderNumber);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdfBytes = await generateTaxInvoicePdf({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    companyName: order.companyName,
    email: order.customerEmail,
    phone: order.customerPhone,
    address: order.shippingAddress,
    buyerGstin: order.gstin,
    items: order.items.map((i) => ({
      name: i.productName,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    gst: order.gst,
    total: order.total,
    paymentMethod: order.paymentMethod || "RAZORPAY",
    paymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
