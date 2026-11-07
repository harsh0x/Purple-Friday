"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "Forbidden"
      ? "You do not have administrative privileges to access that area."
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
      } else {
        toast.success("Welcome back to Purple Friday!");
        // Sync anonymous designs & cart
        fetch("/api/auth/sync", { method: "POST" }).catch(() => {});
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Registration mark decorative motif */}
        <div className="flex items-center justify-center gap-2 mb-4 text-pf-ink/30 font-mono text-xs">
          <span>⊕ REG-MARK 01</span>
          <span>•</span>
          <span>PROOF AUTH</span>
        </div>

        <Link href="/" className="font-display font-black text-3xl tracking-tight text-pf-ink">
          Purple <span className="text-pf-violet">Friday</span>
        </Link>
        <h2 className="mt-3 font-display font-bold text-2xl text-pf-ink">
          Sign In to Your Studio Account
        </h2>
        <p className="mt-1 text-sm text-pf-ink/70">
          Access your print proofs, order tracking, and volume discounts.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80 mb-1.5">
                Email Address
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet focus:ring-1 focus:ring-pf-violet transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-pf-ink/80">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-mono text-pf-violet hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pf-ink/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pf-paper/30 border border-pf-ink/20 rounded-xl text-sm text-pf-ink placeholder:text-pf-ink/40 focus:outline-none focus:border-pf-violet focus:ring-1 focus:ring-pf-violet transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pf-violet text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-pf-violet/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed Admin Credentials Hint in development */}
          <div className="mt-6 pt-5 border-t border-pf-ink/10 text-center">
            <p className="text-xs text-pf-ink/60">
              Don’t have an account yet?{" "}
              <Link href="/auth/register" className="font-bold text-pf-violet hover:underline">
                Register company account
              </Link>
            </p>

            <div className="mt-4 p-3 rounded-lg bg-pf-paper/70 border border-pf-ink/10 text-left text-[11px] font-mono text-pf-ink/70">
              <div className="flex items-center gap-1 font-bold text-pf-ink mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pf-violet" />
                <span>Demo Admin Access:</span>
              </div>
              <div>Email: admin@purplefriday.com</div>
              <div>Password: Admin@PF2026!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pf-paper flex items-center justify-center font-mono text-xs">
          Loading authentication studio...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

