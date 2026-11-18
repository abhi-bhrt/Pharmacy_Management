// app/error.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { BRAND_CONFIG } from '@/config/brand';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { name: brandName, LogoIcon } = BRAND_CONFIG;

  useEffect(() => {
    console.error('ErrorBoundary caught an error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-sm border border-slate-300 shadow-sm">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-sm bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
          </div>
          <span className="absolute -top-2 -right-3 px-2 py-0.5 rounded-sm bg-slate-900 text-teal-400 font-bold text-[10px] tracking-wider uppercase shadow-sm border border-slate-800">
            Error
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Something went wrong
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            An unexpected error occurred while rendering this view within the {brandName} portal. You can attempt to reload or return home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Home className="w-4 h-4 text-teal-700" />
            <span>Return Home</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <LogoIcon className="w-3.5 h-3.5 text-teal-700" />
          <span>{brandName} Clinical Safeguard System</span>
        </div>
      </div>
    </main>
  );
}