"use client";

import React, { useEffect } from "react";
import { bricolage, instrumentSans, dmMono } from "@/lib/fonts";
import "@/app/globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Crash Caught]:", error);
  }, [error]);

  const requestId = error.digest || "PF-CRITICAL-500";

  return (
    <html
      lang="en-IN"
      className={`${bricolage.variable} ${instrumentSans.variable} ${dmMono.variable}`}
    >
      <body className="font-sans bg-paper text-ink min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border-2 border-ink bg-paper-pure p-8 rounded-sm shadow-stamp text-center space-y-6">
          <div className="h-12 w-12 mx-auto rounded-full bg-red-100 border border-red-500 flex items-center justify-center text-red-600 font-bold font-mono text-xl">
            !
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl text-ink">
              Critical System Interruption
            </h1>
            <p className="text-xs font-sans text-ink/70">
              The root layout crashed unexpectedly. Please restart the session using the button below.
            </p>
          </div>

          <div className="p-2.5 bg-paper rounded-xs border border-ink/20 font-mono text-xs text-ink/60">
            Crash Token: <span className="font-bold text-ink">{requestId}</span>
          </div>

          <button
            onClick={() => reset()}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-sm bg-violet text-white font-mono text-xs font-bold uppercase shadow-stamp hover:shadow-stamp-hover transition-all"
          >
            Restart Application Session
          </button>
        </div>
      </body>
    </html>
  );
}

