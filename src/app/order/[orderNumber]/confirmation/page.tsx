"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Download,
  Palette,
  MapPin,
  Package,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface ConfirmationItem {
  productId: string;
  productName: string;
  template?: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  options?: Record<string, string>;
}

interface ConfirmationOrder {
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  companyName?: string;
  gstin?: string;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pin?: string;
  };
  items?: ConfirmationItem[];
  subtotal?: number;
  discount?: number;
  shipping?: number;
  gst?: number;
  total?: number;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;
  userId?: string;
}

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams?: Promise<{ token?: string }>;
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const orderNumber = unwrappedParams?.orderNumber || "";

  const cart = useCart();
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Clear cart upon reaching confirmation so header badge resets
  useEffect(() => {
    cart.clearCart();
  }, []);

  // 2. Hydrate order state from localStorage/sessionStorage first (instant & reliable across serverless restarts)
  useEffect(() => {
    if (!orderNumber) return;

    let foundLocalOrder: ConfirmationOrder | null = null;
    try {
      const stored = localStorage.getItem(`pf_order_${orderNumber}`);
      if (stored) {
        foundLocalOrder = JSON.parse(stored);
      } else {
        const latest = sessionStorage.getItem("pf_latest_order");
        if (latest) {
          const parsed = JSON.parse(latest);
          if (parsed.orderNumber === orderNumber) {
            foundLocalOrder = parsed;
          }
        }
      }
    } catch {}

    if (foundLocalOrder) {
      setOrder(foundLocalOrder);
      setIsLoading(false);
    }

    // 3. Simultaneously probe the API for latest server-side order record
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.order) {
          setOrder(data.order);
        }
      })
      .catch(() => {
        // Retain local order fallback
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderNumber]);

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
            Order Reference: <span className="font-mono font-bold text-pf-violet">{orderNumber}</span>
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/api/orders/${encodeURIComponent(orderNumber)}/invoice`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pf-ink text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-ink/90 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Proforma / Invoice</span>
            </a>

            <Link
              href="/track-order"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-pf-ink/20 text-pf-ink font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-paper transition-colors"
            >
              <Search className="w-4 h-4" />
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
              Order Confirmed
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
                  Your customized merchandise specs have been received by our Bengaluru atelier workshop.
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
                  High-density DTG, spot screen, or laser etching executes following your digital proof approval.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-60">
              <div className="w-7 h-7 rounded-full bg-pf-ink/10 text-pf-ink/70 flex items-center justify-center shrink-0 font-bold">
                4
              </div>
              <div>
                <div className="font-bold text-pf-ink">Step 4: Express Air Dispatch & Pay on Delivery</div>
                <div className="text-pf-ink/60 font-sans text-xs">
                  Direct courier shipment to your doorstep. Pay conveniently via cash, card, or UPI on delivery.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address Snapshot (if available) */}
        {order?.shippingAddress && (
          <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-pf-ink/10">
              <MapPin className="w-5 h-5 text-pf-violet" />
              <h3 className="font-display font-bold text-lg text-pf-ink">Delivery Destination</h3>
            </div>
            <div className="text-xs font-mono space-y-1 text-pf-ink/80">
              <div className="font-bold text-pf-ink">
                {order.customerName || "Customer"} {order.customerPhone ? `(${order.customerPhone})` : ""}
              </div>
              {order.customerEmail && <div>{order.customerEmail}</div>}
              {order.shippingAddress.line1 && <div>{order.shippingAddress.line1}</div>}
              {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
              <div>
                {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ")}
                {order.shippingAddress.pin ? ` - ${order.shippingAddress.pin}` : ""}
              </div>
              {order.companyName && <div>Company: {order.companyName}</div>}
              {order.gstin && <div className="text-pf-violet font-semibold">GSTIN: {order.gstin}</div>}
            </div>
          </div>
        )}

        {/* Order Details Card (if items available) */}
        {order?.items && order.items.length > 0 && (
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
                    ₹{(item.lineTotal || item.unitPrice * item.qty || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-pf-ink/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-pf-ink/70">
                <span>Taxable Subtotal:</span>
                <span>₹{(order.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              {order.discount && order.discount > 0 ? (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount:</span>
                  <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-pf-ink/70">
                <span>Shipping:</span>
                <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping || 0}`}</span>
              </div>
              <div className="flex justify-between text-pf-ink/70">
                <span>GST 18% (Tax Breakdown):</span>
                <span>₹{(order.gst || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-pf-ink/20 flex justify-between font-bold text-base text-pf-ink">
                <span>Total Payable on Delivery:</span>
                <span className="text-pf-violet">₹{(order.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Guest conversion banner or Logged-in Account Link */}
        <div className="mt-8 bg-pf-lilac/20 p-6 rounded-2xl border border-pf-violet/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-display font-bold text-base text-pf-ink">
              Track Your Merchandise Run
            </h4>
            <p className="text-xs text-pf-ink/70 mt-0.5">
              Access your digital proof sign-off, live courier telemetry, and automated invoice anytime with your order reference.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/track-order"
              className="px-4 py-2 bg-pf-violet text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Track Live Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-pf-ink/20 text-pf-ink text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-pf-paper transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
