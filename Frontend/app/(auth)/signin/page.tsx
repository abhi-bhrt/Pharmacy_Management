// app/(auth)/signin/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";
import { apiFetch } from "@/lib/api/api";

export default function SignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { name, tagline, description, LogoIcon } = BRAND_CONFIG;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const res = await apiFetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid credentials");
      }

      setAuth(data.data.user);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 pt-12">
      <div className="w-full max-w-4xl bg-white rounded-sm shadow-sm border border-slate-300 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <div className="lg:col-span-5 bg-slate-900 p-8 sm:p-10 flex flex-col justify-between text-white border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-teal-600 flex items-center justify-center text-white">
              <LogoIcon className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white uppercase">
              {name}
            </span>
          </div>

          <div className="my-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-800 border border-slate-700 text-teal-400 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Authorized Portal</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
              {tagline}
            </h2>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{name} System</span>
            <span className="text-teal-400 font-medium">Encrypted Session</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6 pb-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign in to {name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered credentials to continue
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border-l-2 border-red-600 text-red-800 rounded-sm text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="signin-email"
                  type="email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="signin-password"
                  type="password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 px-4 rounded-sm text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Don&apos;t have an account?</span>
            <Link
              href="/signup"
              className="text-teal-700 font-semibold hover:text-teal-800 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}