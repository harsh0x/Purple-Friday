import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/orders";
import { generateGstInvoicePdf } from "@/lib/invoice-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order number" }, { status: 400 });
  }

  const order = getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const pdfBytes = await generateGstInvoicePdf({
      orderNumber: order.orderNumber,
      invoiceNumber: `INV-${order.orderNumber.replace("PF-", "")}`,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        company: order.companyName,
        gstin: order.gstin,
        addressLine1: order.shippingAddress.line1,
        addressLine2: order.shippingAddress.line2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pin: order.shippingAddress.pin,
      },
      items: order.items.map((i) => ({
        name: i.productName,
        template: i.template,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        options: i.options,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      gst: order.gst,
      total: order.total,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate GST invoice";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
