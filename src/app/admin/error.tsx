"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Generic log without leaking personal data
    console.error("[Admin Workspace Error]", error.message);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-[#15101F] tracking-tight">
          Admin Operation Error
        </h2>
        <p className="mt-2 text-xs font-mono text-[#15101F]/70 leading-relaxed">
          {error.message || "An unexpected error occurred while processing this admin request."}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F5F0E8] border border-[#15101F]/15 text-[#15101F] font-mono text-xs font-semibold hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
