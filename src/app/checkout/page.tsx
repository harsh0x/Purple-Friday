"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";

const PIN_DIRECTORY: Record<string, { city: string; state: string }> = {
  "560": { city: "Bengaluru", state: "Karnataka" },
  "570": { city: "Mysuru", state: "Karnataka" },
  "600": { city: "Chennai", state: "Tamil Nadu" },
  "641": { city: "Coimbatore", state: "Tamil Nadu" },
  "400": { city: "Mumbai", state: "Maharashtra" },
  "411": { city: "Pune", state: "Maharashtra" },
  "110": { city: "New Delhi", state: "Delhi" },
  "122": { city: "Gurugram", state: "Haryana" },
  "201": { city: "Noida", state: "Uttar Pradesh" },
  "500": { city: "Hyderabad", state: "Telangana" },
  "700": { city: "Kolkata", state: "West Bengal" },
  "380": { city: "Ahmedabad", state: "Gujarat" },
  "302": { city: "Jaipur", state: "Rajasthan" },
};

export default function CheckoutPage() {
  const router = useRouter();
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const cart = useCart();

  const [stage, setStage] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [pin, setPin] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [gstin, setGstin] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gstCreditEligible, setGstCreditEligible] = useState(false);

  // PIN code auto-fill
  useEffect(() => {
    if (pin.length >= 3) {
      const prefix = pin.slice(0, 3);
      if (PIN_DIRECTORY[prefix]) {
        setCity(PIN_DIRECTORY[prefix].city);
        setStateName(PIN_DIRECTORY[prefix].state);
      }
    }
  }, [pin]);

  // GSTIN format check
  useEffect(() => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    setGstCreditEligible(gstinRegex.test(gstin.toUpperCase()));
  }, [gstin]);

  // Calculate cart subtotal & GST
  const subtotal = cart.items.reduce(
    (acc, item) => acc + (item.unitPrice || 100) * item.qty,
    0
  );
  const discount = cart.couponCode === "FIRSTORDER" ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal - discount >= 2500 ? 0 : 150;
  const taxable = subtotal - discount;
  const gst = Math.round(taxable * 0.18);
  const total = taxable + gst + shipping;

  const handleProceedToDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setStage(2);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      toast.error("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!line1 || !city || !stateName) {
      toast.error("Please complete all required delivery fields.");
      return;
    }
    setStage(3);
  };

    const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

    const handlePlaceOrder = async () => {
      if (cart.items.length === 0) {
        toast.error("Your cart is empty.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            companyName: company || undefined,
            gstin: gstin.toUpperCase() || undefined,
            shippingAddress: {
              line1,
              line2: line2 || undefined,
              city,
              state: stateName,
              pin,
            },
            items: cart.items.map((i) => ({
              productId: i.productId,
              optionKey: i.optionKey,
              qty: i.qty,
              options: i.options,
              designId: i.designId,
            })),
            couponCode: cart.couponCode || undefined,
            idempotencyKey,
          }),
        });

        const orderData = await res.json();
        if (!res.ok || !orderData.success) {
          throw new Error(orderData.error || "Order creation failed.");
        }

        // Clear Cart
        cart.clearCart();
        toast.success("Order placed successfully!");

        // Redirect to Confirmation
        router.push(`/order/${orderData.orderNumber}/confirmation`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to place order";
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (cart.items.length === 0) {
      return (
        <div className="min-h-screen bg-pf-paper flex flex-col items-center justify-center p-4 text-center">
          <h2 className="font-display font-bold text-2xl text-pf-ink mb-2">Your Studio Cart is Empty</h2>
          <p className="text-sm text-pf-ink/70 mb-6">Explore our curated collections to start customizing merchandise.</p>
          <Link
            href="/collections/all"
            className="px-6 py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl"
          >
            Explore Catalog
          </Link>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-pf-paper text-pf-ink pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Breadcrumbs */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 pb-8 border-b border-pf-ink/10 text-xs font-mono">
            <div className={`flex items-center gap-1.5 ${stage >= 1 ? "text-pf-violet font-bold" : "text-pf-ink/40"}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center">1</span>
              <span>Contact</span>
            </div>
            <span>•</span>
            <div className={`flex items-center gap-1.5 ${stage >= 2 ? "text-pf-violet font-bold" : "text-pf-ink/40"}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center">2</span>
              <span>Delivery</span>
            </div>
            <span>•</span>
            <div className={`flex items-center gap-1.5 ${stage === 3 ? "text-pf-violet font-bold" : "text-pf-ink/40"}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center">3</span>
              <span>Payment</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Stage Form Column */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-pf-ink/10 shadow-sm space-y-6">
              {/* STAGE 1: CONTACT */}
              {stage === 1 && (
                <form onSubmit={handleProceedToDelivery} className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-pf-ink/10">
                    <h2 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
                      <User className="w-5 h-5 text-pf-violet" />
                      <span>Contact Information</span>
                    </h2>
                    <span className="text-xs font-mono text-pf-ink/60">Step 1 of 3</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Vikram Sharma"
                        className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                        Mobile Number (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vikram@enterprise.in"
                        className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                        Company / Organization (Optional)
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Innovations Pvt Ltd"
                        className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue to Delivery Address</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STAGE 2: DELIVERY & GSTIN */}
              {stage === 2 && (
                <form onSubmit={handleProceedToPayment} className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-pf-ink/10">
                    <h2 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
                      <Truck className="w-5 h-5 text-pf-violet" />
                      <span>Shipping & GSTIN Details</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setStage(1)}
                      className="text-xs font-mono text-pf-violet hover:underline"
                    >
                      Edit Contact
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                      6-Digit PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="e.g. 560001"
                      className="w-full sm:w-1/2 px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                      Address Line 1 (Building, Street, Landmark) *
                    </label>
                    <input
                      type="text"
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="14/B, Tech Park Main Road"
                      className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                      Address Line 2 (Apartment, Suite, Unit)
                    </label>
                    <input
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      placeholder="Floor 4, Unit 402"
                      className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="Karnataka"
                        className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
                      />
                    </div>
                  </div>

                  {/* GSTIN input with live credit indicator */}
                  <div className="pt-2 border-t border-pf-ink/10">
                    <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1 flex items-center justify-between">
                      <span>Company GSTIN (Optional)</span>
                      <span className="text-pf-violet font-bold text-[11px]">18% ITC Credit</span>
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                      placeholder="29AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm font-mono text-pf-ink focus:outline-none focus:border-pf-violet uppercase"
                    />

                    {gstCreditEligible && (
                      <div className="mt-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Verified GSTIN format. ₹{gst.toLocaleString("en-IN")} Input Tax Credit claimable on this order.
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STAGE 3: PAYMENT / PLACE ORDER */}
              {stage === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-pf-ink/10">
                    <h2 className="font-display font-bold text-xl text-pf-ink flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-pf-violet" />
                      <span>Payment Method</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setStage(2)}
                      className="text-xs font-mono text-pf-violet hover:underline"
                    >
                      Edit Delivery
                    </button>
                  </div>

                  {/* Delivery Snapshot */}
                  <div className="p-4 bg-pf-paper rounded-xl border border-pf-ink/10 text-xs font-mono space-y-1">
                    <div className="font-bold text-pf-ink">Deliver to: {name} ({phone})</div>
                    <div className="text-pf-ink/70">{line1}, {city}, {stateName} - {pin}</div>
                    {gstin && <div className="text-pf-violet font-semibold">GSTIN: {gstin}</div>}
                  </div>

                        {/* Payment Option: Cash on Delivery / Pay later */}
                        <div className="border-2 border-pf-violet rounded-xl p-5 bg-pf-lilac/10 flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-pf-violet/10 flex items-center justify-center text-pf-violet shrink-0 mt-0.5">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-pf-ink">Cash on Delivery / Pay later</div>
                              <p className="text-xs text-pf-ink/70 mt-1 leading-relaxed">
                                Pay when your order arrives. We will confirm your order and send your design proof for approval.
                              </p>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-pf-violet shrink-0 mt-0.5" />
                        </div>

                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={isSubmitting}
                          className="w-full py-4 bg-pf-violet text-white font-mono text-sm uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Placing Your Order...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Place Order • ₹{total.toLocaleString("en-IN")}</span>
                            </>
                          )}
                        </button>
                      </div>
            )}
                    </div>

                    {/* Right Summary Column */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
                      <h3 className="font-display font-bold text-lg text-pf-ink pb-3 border-b border-pf-ink/10">
                        Order Summary ({cart.items.length} products)
                      </h3>

                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cart.items.map((item) => (
                          <div key={item.optionKey} className="flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-pf-ink">{item.name}</div>
                              <div className="text-pf-ink/60 font-mono">
                                Qty: {item.qty} × ₹{item.unitPrice}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-pf-ink">
                              ₹{((item.unitPrice || 100) * item.qty).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-pf-ink/10 space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-pf-ink/70">
                          <span>Taxable Subtotal:</span>
                          <span>₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Coupon Discount:</span>
                            <span>-₹{discount.toLocaleString("en-IN")}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-pf-ink/70">
                          <span>Shipping:</span>
                          <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                        </div>

                        <div className="flex justify-between text-pf-ink/70">
                          <span>GST (18% Input Credit):</span>
                          <span>₹{gst.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="pt-2 border-t border-pf-ink/20 flex justify-between font-bold text-base text-pf-ink">
                          <span>Grand Total:</span>
                          <span className="text-pf-violet">₹{total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
    </div>
            );
}
