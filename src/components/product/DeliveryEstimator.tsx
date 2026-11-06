"use client";

import React, { useState } from "react";
import { Truck, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

interface DeliveryEstimatorProps {
  subtotal?: number;
}

export function DeliveryEstimator({ subtotal = 3000 }: DeliveryEstimatorProps) {
  const [pinCode, setPinCode] = useState("");
  const [estimate, setEstimate] = useState<{
    status: "valid" | "invalid" | null;
    city?: string;
    date?: string;
    isFree?: boolean;
    fee?: number;
    message?: string;
  }>({ status: null });

  const checkPinCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinCode.trim();

    // Indian PIN validation: 6 digits, does not start with 0
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setEstimate({
        status: "invalid",
        message: "Please enter a valid 6-digit Indian postal PIN code.",
      });
      return;
    }

    // Date computation: 4 days from now for metro, 6 days for non-metro
    const now = new Date();
    const metroPrefixes = ["11", "40", "56", "60", "50", "70", "41", "38"];
    const isMetro = metroPrefixes.some((p) => cleanPin.startsWith(p));

    const daysToAdd = isMetro ? 4 : 6;
    const targetDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const dateFormatted = targetDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const isFree = subtotal >= 2500;
    const city = isMetro ? "Metro Air Hub" : "Regional Postal Hub";

    setEstimate({
      status: "valid",
      city,
      date: dateFormatted,
      isFree,
      fee: isFree ? 0 : 150,
      message: isFree
        ? `Free express delivery by ${dateFormatted}`
        : `Courier delivery ₹150 by ${dateFormatted}`,
    });
  };

  return (
    <div className="border-2 border-pf-ink bg-pf-paper p-4 shadow-[3px_3px_0_0_#15101F] space-y-3">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-pf-violet" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-pf-ink">
          Pan-India Delivery Estimator
        </span>
      </div>

      <form onSubmit={checkPinCode} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/50" />
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit PIN code (e.g. 560001)"
            value={pinCode}
            onChange={(e) => {
              setPinCode(e.target.value.replace(/\D/g, ""));
              if (estimate.status) setEstimate({ status: null });
            }}
            className="w-full h-10 pl-9 pr-3 border-2 border-pf-ink bg-white font-mono text-xs font-bold placeholder:text-pf-ink/40 focus:outline-none focus:ring-2 focus:ring-pf-violet"
          />
        </div>

        <button
          type="submit"
          className="h-10 px-4 border-2 border-pf-ink bg-pf-ink text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-pf-violet transition-colors shrink-0"
        >
          Check
        </button>
      </form>

      {/* Result Status */}
      {estimate.status === "valid" && (
        <div className="flex items-start gap-2 pt-1 text-xs text-pf-ink font-sans">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold font-mono text-pf-ink">
              {estimate.message}
            </p>
            <p className="text-[11px] text-pf-ink/70">
              Dispatched from our closest atelier. 18% GST input invoice included.
            </p>
          </div>
        </div>
      )}

      {estimate.status === "invalid" && (
        <div className="flex items-center gap-2 pt-1 text-xs text-rose-600 font-sans">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{estimate.message}</span>
        </div>
      )}
    </div>
  );
}
