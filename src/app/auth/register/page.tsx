"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { validatePasswordStrength } from "@/lib/security/auth-policy";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordEvaluation = validatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create account.");
      }

      toast.success("Account registered successfully! Signing in...");

      // Automatically sign in
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/account",
      });

      if (!loginRes?.error) {
        fetch("/api/auth/sync", { method: "POST" }).catch(() => {});
        router.push("/account");
        router.refresh();
      } else {
        router.push("/auth/login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration error";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Strength score bar color
  const getScoreColor = (score: number) => {
    if (score <= 1) return "bg-red-500";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-lime-500";
    return "bg-emerald-500";
  };

  const hasLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-4 text-pf-ink/30 font-mono text-xs">
          <span>⊕ REG-MARK 02</span>
          <span>•</span>
          <span>CLIENT REGISTRATION</span>
        </div>

        <Link href="/" className="font-display font-black text-3xl tracking-tight text-pf-ink">
          Purple <span className="text-pf-violet">Friday</span>
        </Link>
        <h2 className="mt-3 font-display font-bold text-2xl text-pf-ink">
          Create Company Account
        </h2>
        <p className="mt-1 text-sm text-pf-ink/70">
          Save custom product proofs, configure GST billing, and track production.
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
                Full Name / Company Representative
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-ink/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Work Email Address
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
                  placeholder="vikram@enterprise.in"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Password
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

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all ${
                          step <= passwordEvaluation.score
                            ? getScoreColor(passwordEvaluation.score)
                            : "bg-pf-ink/10"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-pf-ink/70 pt-1">
                    <span className={`flex items-center gap-1 ${hasLength ? "text-emerald-600" : ""}`}>
                      {hasLength ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      10+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600" : ""}`}>
                      {hasUpper ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      1 uppercase
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? "text-emerald-600" : ""}`}>
                      {hasLower ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      1 lowercase
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber && hasSymbol ? "text-emerald-600" : ""}`}>
                      {hasNumber && hasSymbol ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Number & symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Confirm Password
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
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-pf-ink/10 text-center">
            <p className="text-xs text-pf-ink/60">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-bold text-pf-violet hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
