import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin/admin-session";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getOrderByNumber, getOrderById } from "@/lib/orders";
import { getOrderByIdOrNumber } from "@/server/orders/state-machine";
import { generateTaxInvoicePdf } from "@/server/invoices/invoice-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const adminSession = await getAdminSession();
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string } | undefined;

  const isAuthorized =
    Boolean(adminSession) ||
    Boolean(user && hasPermission(user.role as never, "admin:view_orders"));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await params;
  const canonicalOrder = await getOrderByIdOrNumber(orderNumber);
  const legacyOrder = !canonicalOrder ? (getOrderByNumber(orderNumber) || getOrderById(orderNumber)) : null;

  if (!canonicalOrder && !legacyOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let pdfBytes: Uint8Array;

  if (canonicalOrder) {
    const addr = (canonicalOrder.address || {}) as Record<string, string>;
    pdfBytes = await generateTaxInvoicePdf({
      orderId: canonicalOrder.id,
      orderNumber: canonicalOrder.orderNumber,
      customerName: addr.customerName || canonicalOrder.customerName || "Valued Client",
      companyName: addr.companyName || canonicalOrder.companyName || "",
      email: addr.email || canonicalOrder.customerEmail || "",
      phone: addr.phone || canonicalOrder.customerPhone || "",
      address: {
        line1: addr.line1 || canonicalOrder.shippingAddress?.line1 || "",
        line2: addr.line2 || canonicalOrder.shippingAddress?.line2,
        city: addr.city || canonicalOrder.shippingAddress?.city || "",
        state: addr.state || canonicalOrder.shippingAddress?.state || "",
        pin: addr.pin || canonicalOrder.shippingAddress?.pin || "",
      },
      buyerGstin: canonicalOrder.gstin || undefined,
      items: canonicalOrder.items.map((i) => ({
        name: i.productId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.qty * i.unitPrice,
      })),
      subtotal: canonicalOrder.subtotal,
      discount: canonicalOrder.discount,
      shipping: canonicalOrder.shipping,
      gst: canonicalOrder.gst,
      total: canonicalOrder.total,
      paymentMethod: canonicalOrder.paymentMethod || "COD",
      createdAt: canonicalOrder.createdAt,
    });
  } else {
    const order = legacyOrder!;
    pdfBytes = await generateTaxInvoicePdf({
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
      paymentMethod: order.paymentMethod || "COD",
      paymentId: (order as unknown as Record<string, string>)["paymentReference"] || undefined,
      createdAt: order.createdAt,
    });
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice-${orderNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
