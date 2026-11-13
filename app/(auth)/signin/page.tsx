"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pill, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to log in");
      }
      setAuth(data.data.user);
      router.push("/");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-md shadow-xs border border-zinc-200">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#2a9d8f] mb-2">
            <Pill className="h-6 w-6 rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Sign in to PharmaCare</h1>
          <p className="text-sm text-zinc-600 mt-1">Access your pharmacy management portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#2a9d8f] hover:bg-[#238276] text-white font-medium py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#2a9d8f] font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}