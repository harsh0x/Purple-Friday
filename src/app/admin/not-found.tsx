import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#15101F]/10 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6A2CFF]/10 border border-[#6A2CFF]/20 text-[#6A2CFF] mb-4">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-[#15101F] tracking-tight">
          Page Not Found in Control Room
        </h2>
        <p className="mt-2 text-xs font-mono text-[#15101F]/70 leading-relaxed">
          The requested admin page does not exist or may not have been unlocked in this phase.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#15101F] text-white font-mono text-xs font-semibold hover:bg-[#221A31] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
