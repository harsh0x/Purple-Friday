"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request.");
      }

      setSubmitted(true);
      toast.success("Password reset instructions dispatched.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-pf-ink/60 hover:text-pf-violet transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <h2 className="font-display font-bold text-2xl text-pf-ink">Reset Account Password</h2>
        <p className="mt-1 text-sm text-pf-ink/70">
          Enter your registered work email to receive password recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-pf-ink/10 rounded-2xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-pf-ink">Instructions Dispatched</h3>
              <p className="text-sm text-pf-ink/70">
                If an account exists for <span className="font-mono font-semibold">{email}</span>, you will receive an editorial reset link shortly.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-xs font-mono text-pf-violet uppercase tracking-wider font-bold hover:underline"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-ink/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>{loading ? "Sending..." : "Send Reset Link"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
