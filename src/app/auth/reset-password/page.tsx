"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { validatePasswordStrength } from "@/lib/security/auth-policy";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordEvaluation = validatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Missing password reset token in URL.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!passwordEvaluation.valid) {
      setErrorMessage(passwordEvaluation.errors[0]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success("Password reset successfully! Please sign in.");
      router.push("/auth/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resetting password";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="font-display font-bold text-2xl text-pf-ink">Set New Password</h2>
        <p className="mt-1 text-sm text-pf-ink/70">
          Enter a new secure password adhering to the Purple Friday security policy.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-pf-ink/10 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-ink/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet transition-colors"
                />
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-2 space-y-1 text-xs font-mono">
                  <div
                    className={`flex items-center gap-1 ${
                      passwordEvaluation.valid ? "text-emerald-600" : "text-pf-ink/60"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {passwordEvaluation.valid
                        ? "Meets security policy"
                        : passwordEvaluation.errors[0]}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-ink/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordEvaluation.valid}
              className="w-full mt-2 py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Updating Password..." : "Update Password"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-pf-ink/10 text-center">
            <Link href="/auth/login" className="text-xs font-mono text-pf-violet hover:underline">
              Cancel and return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pf-paper flex items-center justify-center font-mono text-xs">
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
