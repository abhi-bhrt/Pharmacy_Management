// app/(dashboard)/billing/page.tsx
"use client";

import { useBillingLogic } from "@/hooks/useBillingLogic";
import { BillingPosFormView } from "@/components/features/billing/BillingPosFormView";
import { ShoppingCart, ShieldCheck, RotateCcw } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export default function BillingPage() {
  const { name: brandName } = BRAND_CONFIG;
  const logic = useBillingLogic();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Point of Sale Billing
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                <ShieldCheck className="w-3 h-3" />
                <span>GST & B2B Ready</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate B2C retail receipts or B2B pharmacy transfers on {brandName}
            </p>
          </div>
        </div>

        {logic.cart.length > 0 && (
          <button
            type="button"
            onClick={logic.resetForm}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reset Terminal</span>
          </button>
        )}
      </div>

      <BillingPosFormView {...logic} />
    </div>
  );
}