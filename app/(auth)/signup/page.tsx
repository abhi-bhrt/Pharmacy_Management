// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, ChevronDown, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";
import type { CreateUserInput } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { name: brandName, tagline, description, LogoIcon, defaultCountry } = BRAND_CONFIG;

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const hasAnyAddressField = Boolean(
      form.pincode.trim() ||
      form.state.trim() ||
      form.district.trim() ||
      form.area.trim()
    );

    if (hasAnyAddressField && (!form.pincode.trim() || !form.state.trim())) {
      setError("Pincode and State are required when providing an address");
      return;
    }

    setLoading(true);

    try {
      const payload: CreateUserInput = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobNo: form.mobNo.trim(),
        password: form.password,
        address: hasAnyAddressField
          ? {
              pincode: form.pincode.trim(),
              state: form.state.trim(),
              district: form.district.trim(),
              area: form.area.trim(),
              country: defaultCountry,
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
              {brandName}
            </span>
          </div>

          <div className="my-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-800 border border-slate-700 text-teal-400 text-[11px] font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Account Registration</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
              {tagline}
            </h2>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{brandName} System</span>
            <span className="text-teal-400 font-medium">Verified Onboarding</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6 pb-4 border-b border-slate-200 flex items-baseline justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Create your {brandName} account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Complete the fields below to register
              </p>
            </div>
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
                htmlFor="signup-name"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                disabled={loading}
                autoComplete="name"
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 disabled:bg-slate-50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 disabled:bg-slate-50 transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="signup-mob"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Mobile Number
                </label>
                <input
                  id="signup-mob"
                  type="tel"
                  required
                  disabled={loading}
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={form.mobNo}
                  onChange={(e) => setForm({ ...form, mobNo: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 disabled:bg-slate-50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 disabled:bg-slate-50 transition-colors"
              />
            </div>

            <div className="border border-slate-300 rounded-sm overflow-hidden bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-700" />
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Address Details
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (Optional)
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                    showAddress ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAddress && (
                <div className="p-4 border-t border-slate-300 bg-white space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="signup-pincode"
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                      >
                        Pincode
                      </label>
                      <input
                        id="signup-pincode"
                        type="text"
                        disabled={loading}
                        autoComplete="postal-code"
                        placeholder="6-digit pincode"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="signup-state"
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                      >
                        State
                      </label>
                      <input
                        id="signup-state"
                        type="text"
                        disabled={loading}
                        autoComplete="address-level1"
                        placeholder="State"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="signup-district"
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                      >
                        District
                      </label>
                      <input
                        id="signup-district"
                        type="text"
                        disabled={loading}
                        autoComplete="address-level2"
                        placeholder="District"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="signup-area"
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1"
                      >
                        Area / Street
                      </label>
                      <input
                        id="signup-area"
                        type="text"
                        disabled={loading}
                        autoComplete="street-address"
                        placeholder="Street or locality"
                        value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Already have an account?</span>
            <Link
              href="/signin"
              className="text-teal-700 font-semibold hover:text-teal-800 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}