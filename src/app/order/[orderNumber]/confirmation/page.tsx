import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  CheckCircle2,
  Clock,
  Download,
  Palette,
  MapPin,
  Package,
  ArrowRight,
} from "lucide-react";
import { getOrderByNumberAsync } from "@/lib/orders";
import { verifyGuestOrderToken } from "@/lib/security/guest-order";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams?: Promise<{ token?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { token: urlToken } = (await searchParams) || {};
  const order = await getOrderByNumberAsync(orderNumber);

  if (!order) {
    notFound();
  }

  // Security check: verify guest ownership cookie or logged-in session or signed token in URL
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const guestToken =
    urlToken ||
    cookieStore.get(`pf_guest_order_${orderNumber}`)?.value ||
    cookieStore.get("pf_guest_order")?.value;

  const isGuestAuthorized = await verifyGuestOrderToken(orderNumber, guestToken);
  const isOwnerSession = session?.user && (session.user as { id?: string }).id === order.userId;
  const isAdmin = session?.user && (session.user as { role?: string }).role === "SUPER_ADMIN";

  // Allow access if guest cookie/token matches, user owns the order, admin is viewing, or in dev/local
  if (!isGuestAuthorized && !isOwnerSession && !isAdmin && process.env.NODE_ENV === "production") {
    // If neither cookie nor token matches in production, guide the customer to track-order instead of 404
    redirect(`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`);
  }

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header Banner */}
        <div className="text-center space-y-3 pb-8 border-b border-pf-ink/10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="font-mono text-xs uppercase tracking-widest text-emerald-600 font-bold">
            Order Placed • Cash on Delivery / Pay Later
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-pf-ink tracking-tight">
            Thank you for ordering with Purple Friday
          </h1>

          <p className="text-sm text-pf-ink/70">
            Order Reference: <span className="font-mono font-bold text-pf-violet">{order.orderNumber}</span>
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/api/orders/${order.orderNumber}/invoice`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pf-ink text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-ink/90 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Proforma / Invoice</span>
            </a>

            <Link
              href="/track-order"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-pf-ink/20 text-pf-ink font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-paper transition-colors"
            >
              <span>Track Live Status</span>
            </Link>
          </div>
        </div>

        {/* Proof Timeline (Our Studio Promise) */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
              <Palette className="w-5 h-5 text-pf-violet" />
              <span>Pre-Press Proof & Production Timeline</span>
            </h2>
            <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Order Placed
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 1: Order Placed & Confirmed</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Your customized merchandise specs have been received by our studio workshop.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-pf-violet text-white flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-pf-violet">Step 2: Studio Proof Preparation (Next 24 Hours)</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Our pre-press engineers will prepare your technical alignment proof and send a WhatsApp/email alert for your review.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-60">
              <div className="w-7 h-7 rounded-full bg-pf-ink/10 text-pf-ink/70 flex items-center justify-center shrink-0 font-bold">
                3
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 3: Atelier Production & Quality Check (48 Hours)</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  High-density DTG, screen, or Tajima embroidery run following your explicit proof approval.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-60">
              <div className="w-7 h-7 rounded-full bg-pf-ink/10 text-pf-ink/70 flex items-center justify-center shrink-0 font-bold">
                4
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 4: Dispatch & Pay on Delivery</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Express air/surface shipment. Pay via cash or UPI directly when your package is delivered.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-pf-ink/10">
            <MapPin className="w-5 h-5 text-pf-violet" />
            <h3 className="font-display font-bold text-lg text-pf-ink">Delivery Destination</h3>
          </div>
          <div className="text-xs font-mono space-y-1 text-pf-ink/80">
            <div className="font-bold text-pf-ink">{order.customerName} ({order.customerPhone})</div>
            <div>{order.customerEmail}</div>
            <div>{order.shippingAddress.line1}</div>
            {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
            <div>
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pin}
            </div>
            {order.companyName && <div>Company: {order.companyName}</div>}
            {order.gstin && <div className="text-pf-violet font-semibold">GSTIN: {order.gstin}</div>}
          </div>
        </div>

        {/* Order Details Card */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-pf-ink/10">
            <Package className="w-5 h-5 text-pf-violet" />
            <h3 className="font-display font-bold text-lg text-pf-ink">
              Order Items ({order.items.length})
            </h3>
          </div>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-pf-ink/5">
                <div>
                  <div className="font-semibold text-pf-ink text-sm">{item.productName}</div>
                  <div className="text-pf-ink/60 font-mono">
                    Qty: {item.qty} pcs @ ₹{item.unitPrice} / pc
                  </div>
                </div>
                <div className="font-mono font-bold text-pf-ink text-sm">
                  ₹{item.lineTotal.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-pf-ink/10 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-pf-ink/70">
              <span>Taxable Subtotal:</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount:</span>
                <span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-pf-ink/70">
              <span>Shipping:</span>
              <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
            </div>
            <div className="flex justify-between text-pf-ink/70">
              <span>GST 18% (Tax Breakdown):</span>
              <span>₹{order.gst.toLocaleString("en-IN")}</span>
            </div>
            <div className="pt-2 border-t border-pf-ink/20 flex justify-between font-bold text-base text-pf-ink">
              <span>Total Payable on Delivery:</span>
              <span className="text-pf-violet">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Guest conversion banner or Logged-in Account Link */}
        {!order.userId ? (
          <div className="mt-8 bg-pf-lilac/20 p-6 rounded-2xl border border-pf-violet/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-bold text-base text-pf-ink">
                Create a Purple Friday account
              </h4>
              <p className="text-xs text-pf-ink/70 mt-0.5">
                Sign in or register an account to track your orders, view production proofs, and access re-order presets.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-white border border-pf-ink/20 text-pf-ink text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-paper transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-emerald-50 p-6 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-bold text-base text-emerald-900">
                Linked to your account
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                This order is safely registered to your customer workspace.
              </p>
            </div>
            <Link
              href="/account/orders"
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shrink-0"
            >
              <span>View In Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
