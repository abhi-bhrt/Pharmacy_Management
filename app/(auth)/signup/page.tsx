// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pill, AlertCircle, Loader2, ChevronDown, MapPin, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [showAddress, setShowAddress] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobNo: "",
    password: "",
    pincode: "",
    state: "",
    district: "",
    area: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const hasAddress =
        form.pincode.trim() ||
        form.state.trim() ||
        form.district.trim() ||
        form.area.trim();

      const payload = {
        name: form.name,
        email: form.email,
        mobNo: form.mobNo,
        password: form.password,
        address: hasAddress
          ? {
              pincode: form.pincode,
              state: form.state,
              district: form.district,
              area: form.area,
              country: "IN",
            }
          : undefined,
      };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create account");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Outer Card Wrapper (Split Screen Style) */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-zinc-200/80 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Side: Visual Banner Panel (Inspired by reference layout) */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-teal-900 via-[#2a9d8f] to-teal-800 p-10 flex flex-col justify-between text-white overflow-hidden">
          {/* Subtle background decorative shapes */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

          {/* Top Brand/Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Pill className="h-5 w-5 rotate-45" />
            </div>
            <span className="font-semibold tracking-tight text-lg">PharmaCare</span>
          </div>

          {/* Middle Content Callout */}
          <div className="relative z-10 my-auto py-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              Manage inventory & billing with ease.
            </h2>
            <p className="text-teal-100/80 text-sm mt-3 leading-relaxed">
              Streamline your pharmacy workflow, track real-time stock levels, and securely handle prescriptions all in one place.
            </p>
          </div>

          {/* Bottom Carousel Indicator Simulation */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="h-1.5 w-6 rounded-full bg-white" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Create an account</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Already have an account?{" "}
              <Link href="/signin" className="text-[#2a9d8f] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Abhishek Bharti"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition shadow-2xs"
              />
            </div>

            {/* Email & Mobile Number Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="abhishek.bharti@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={form.mobNo}
                  onChange={(e) => setForm({ ...form, mobNo: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition shadow-2xs"
              />
            </div>

            {/* Collapsible Optional Address Dropdown */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#2a9d8f]" />
                  <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Add Address Details
                  </span>
                  <span className="text-xs text-zinc-400 font-normal">(Optional)</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${
                    showAddress ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAddress && (
                <div className="p-4 pt-2 border-t border-zinc-200/80 bg-white space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">Pincode</label>
                      <input
                        type="text"
                        placeholder="484001"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">State</label>
                      <input
                        type="text"
                        placeholder="Madhya Pradesh"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">District</label>
                      <input
                        type="text"
                        placeholder="Shahdol"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">Area / Street</label>
                      <input
                        type="text"
                        placeholder="Burhar Road, Sohagpur"
                        value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f] bg-zinc-50/50 transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2a9d8f] hover:bg-[#238276] text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-6 shadow-sm cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 text-teal-100" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}