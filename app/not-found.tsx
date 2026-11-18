// app/not-found.tsx
import Link from "next/link";
import { Home, Store, FileText, ShieldAlert } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export default function NotFound() {
  const { name: brandName, LogoIcon } = BRAND_CONFIG;

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-sm border border-slate-300 shadow-sm">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shadow-sm">
            <LogoIcon className="w-8 h-8" />
          </div>
          <span className="absolute -top-2 -right-3 px-2 py-0.5 rounded-sm bg-teal-700 text-white font-bold text-[10px] tracking-wider uppercase shadow-sm">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            The page you are looking for does not exist or has been relocated within the {brandName} portal.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Quick Navigation
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-teal-700">
            <Link
              href="/dashboard"
              className="hover:underline inline-flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/medicines"
              className="hover:underline inline-flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Medicines</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/stores"
              className="hover:underline inline-flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Stores</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}