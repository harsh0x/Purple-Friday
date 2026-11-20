"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forced password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.user?.mustChangePassword) {
        setMustChangePassword(true);
        setLoading(false);
        return;
      }

      // Successful login -> Redirect to role home screen
      router.push(data.homeScreen || "/admin");
      router.refresh();
    } catch {
      setError("Unable to connect to authentication service. Please retry.");
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 10) {
      setChangeError("Password must be at least 10 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChangeError(data.error || "Password update failed.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setChangeError("Password change failed. Please retry.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#15101F] flex items-center justify-center p-4 sm:p-6 text-white selection:bg-[#6A2CFF] selection:text-white">
      {/* Background ambient mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#6A2CFF]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#CDB8FF]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-stamp-sm">
            <ShieldCheck className="w-6 h-6 text-[#D8FF3F]" />
          </div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-[#FAF7F2]">
              Purple Friday <span className="text-[#CDB8FF]">Admin</span>
            </h1>
              <p className="mt-2 text-xs font-sans uppercase tracking-wider text-[#DDD4E6]/70 font-medium">
                India Atelier Control Room
              </p>
            </div>

            {/* Card Surface */}
            <div className="bg-[#1C1628] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              {!mustChangePassword ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-[#DDD4E6] mb-2">
                      Staff Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9F8CB8]" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="staff@purplefriday.in"
                        className="w-full bg-[#15101F] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#6A2CFF] focus:ring-2 focus:ring-[#6A2CFF]/30 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-[#DDD4E6] mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9F8CB8]" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#15101F] border border-white/15 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#6A2CFF] focus:ring-2 focus:ring-[#6A2CFF]/30 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#6A2CFF] hover:bg-[#5820DC] text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#6A2CFF]/20 active:translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    <span>{loading ? "Authenticating..." : "Sign In to Admin"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="p-3.5 rounded-xl bg-[#6A2CFF]/10 border border-[#6A2CFF]/30 text-xs text-[#CDB8FF] leading-relaxed">
                    <span className="font-bold">Initial Login Detected:</span> For your security, you must create a new password (min. 10 characters) before accessing the dashboard.
                  </div>

                  <div>
                    <span className="block text-xs font-mono uppercase tracking-wider text-[#DDD4E6] mb-2">
                      New Password
                    </span>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9F8CB8]" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 10 chars with numbers & symbols"
                        className="w-full bg-[#15101F] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#6A2CFF] focus:ring-2 focus:ring-[#6A2CFF]/30 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-mono uppercase tracking-wider text-[#DDD4E6] mb-2">
                      Confirm Password
                    </span>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9F8CB8]" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full bg-[#15101F] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#6A2CFF] focus:ring-2 focus:ring-[#6A2CFF]/30 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {changeError && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{changeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#D8FF3F] hover:bg-[#C4ED2B] text-[#15101F] font-sans text-xs uppercase tracking-wider font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    <span>{loading ? "Updating Password..." : "Set New Password & Continue"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <span className="text-[11px] font-mono text-[#DDD4E6]/60">
                  Session expires in 8 hours • 30-min idle timeout
                </span>
              </div>
            </div>
        </div >
      </div >
      );
}
