// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Truck,
  BarChart3,
  Store,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const [mounted, setMounted] = useState(false);

  const { name: brandName, description } = BRAND_CONFIG;

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = mounted ? user : null;
  const isUserAdmin = mounted && isAdmin;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-20 pt-24 pb-16">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-800 text-teal-400 text-[11px] font-semibold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>{brandName} Clinical & Retail System</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Manage your{" "}
              <span className="text-teal-700 underline decoration-slate-300 decoration-4 underline-offset-8">
                pharmacy
              </span>{" "}
              <br className="hidden sm:inline" />
              with total control.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={currentUser ? "/profile" : "/signin"}
              className="inline-flex items-center gap-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs uppercase tracking-wider px-6 py-3.5 rounded-sm transition-colors"
            >
              <span>{currentUser ? "Go to Profile" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!currentUser ? (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-semibold text-xs uppercase tracking-wider px-5 py-3.5 rounded-sm transition-colors"
              >
                <span>Create Account</span>
                <UserPlus className="w-4 h-4 text-teal-700" />
              </Link>
            ) : isUserAdmin ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider px-5 py-3.5 rounded-sm transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
                <span>Shop Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/create-shop"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-semibold text-xs uppercase tracking-wider px-5 py-3.5 rounded-sm transition-colors"
              >
                <span>Create New Shop</span>
                <ChevronRight className="w-4 h-4 text-teal-700" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-sm">
              <div className="w-9 h-9 rounded-sm bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Stock Intelligence
                </p>
                <p className="text-[11px] text-slate-500">Real-time low stock & expiry alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-sm">
              <div className="w-9 h-9 rounded-sm bg-teal-700 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  GST Billing
                </p>
                <p className="text-[11px] text-slate-500">Compliant invoices & batch tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative flex justify-center items-center">
          <div className="relative w-[340px] sm:w-[440px] h-[460px] sm:h-[520px] bg-white border border-slate-300 rounded-sm shadow-sm flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
            <div className="relative w-full h-full transform scale-175 left-1/6 transition-transform duration-300">
              <Image
                src="/home.png"
                alt={`${brandName} inventory and medical stock management`}
                fill
                unoptimized
                priority
                className="object-contain object-center select-none pointer-events-none"
              />
            </div>
          </div>

          <div className="absolute -bottom-4 right-2 sm:right-6 bg-white p-3.5 rounded-sm shadow-md border border-slate-300 flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fast Dispatch
              </p>
              <p className="text-[11px] text-slate-500">Automated order routing</p>
            </div>
          </div>

          <div className="absolute top-6 left-2 sm:-left-4 bg-slate-900 text-white px-3.5 py-2.5 rounded-sm shadow-md border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700 text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                License Verified
              </p>
              <p className="text-[10px] text-slate-400">Drug authority compliant</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}