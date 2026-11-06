"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, MessageSquare } from "lucide-react";
import { RegistrationMark, CropCorners } from "@/components/ui/decorative";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Technical error logged silently without exposing stack traces to end users
    console.error("[Segment Error Boundary Caught]:", error);
  }, [error]);

  const requestId = error.digest || "PF-ERR-500";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-paper relative overflow-hidden">
      <div className="max-w-lg w-full border-2 border-ink bg-paper-pure p-8 rounded-sm shadow-stamp relative text-center space-y-6">
        <CropCorners offset={8} length={12} />

        <div className="flex items-center justify-center gap-2 text-red-600">
          <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
          <RegistrationMark size={16} variant="ink" />
          <span className="font-mono text-xs uppercase tracking-widest font-bold">
            Prepress Exception Intercepted
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="heading-sub font-extrabold text-ink">
            A Press Room Misalignment Occurred
          </h1>
          <p className="text-sm font-sans text-ink/70">
            Our automated printing pipeline caught an unexpected exception. Your cart and customizations remain safely stored in memory.
          </p>
        </div>

        {/* Error Reference Token */}
        <div className="p-3 bg-paper rounded-xs border border-ink/20 font-mono text-xs text-ink/70">
          <span>Error Reference: </span>
          <span className="font-bold text-ink">{requestId}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="stamp"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Retry Action
          </Button>
          <Link href="/">
            <Button variant="ghost" leftIcon={<Home className="h-4 w-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-ink/10">
          <a
            href={`https://wa.me/919876543210?text=Hi%20Team%2C%20I%20ran%20into%20error%20${requestId}%20on%20Purple%20Friday.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink/70 hover:text-violet underline"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Report incident on WhatsApp with Reference ID</span>
          </a>
        </div>
      </div>
    </div>
  );
}

