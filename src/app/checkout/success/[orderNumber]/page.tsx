import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Download,
  Palette,
} from "lucide-react";
import { getOrderByNumber } from "@/lib/orders";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);

  if (!order) {
    notFound();
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
            Payment Confirmed • Order Received
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
              <span>Download GST Invoice (PDF)</span>
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
              In Queue
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                ✓
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 1: Order & Artwork Received</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Your customized vectors and line items have been safely neutralized and stored.
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
                  Our pre-press engineers will prepare your technical alignment proof and send a WhatsApp/email alert for your approval.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-60">
              <div className="w-7 h-7 rounded-full bg-pf-ink/10 text-pf-ink/70 flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 3: Press Production & Quality Check (48 Hours)</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Screen, DTG, or offset machine runs with high-density Tajima rigs.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-60">
              <div className="w-7 h-7 rounded-full bg-pf-ink/10 text-pf-ink/70 flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 4: Inspected, Packed & Dispatched</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Shipped via express surface/air courier with tracking notification.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-lg text-pf-ink pb-3 border-b border-pf-ink/10">
            Order Items ({order.items.length})
          </h3>

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
              <span>Total Paid:</span>
              <span className="text-pf-violet">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Guest conversion banner */}
        {!order.userId && (
          <div className="mt-8 bg-pf-lilac/20 p-6 rounded-2xl border border-pf-violet/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-bold text-base text-pf-ink">
                Create a Purple Friday account
              </h4>
              <p className="text-xs text-pf-ink/70 mt-0.5">
                Save this order and proof history to your company workspace.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl shrink-0 hover:bg-pf-violet/90 transition-colors"
            >
              Register Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
