// app/create-shop/page.tsx
"use client";

import { ShopSettingsForm } from "@/components/features/shop/ShopSettingsForm";
import { Store } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export default function CreateShopPage() {
  const { name: brandName } = BRAND_CONFIG;

  return (
    <div className="min-h-screen bg-slate-100 pt-24 pb-16 px-2 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Register Your Pharmacy Shop
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Provide your store details, GSTIN, and drug licence information for {brandName}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-sm">
          <ShopSettingsForm initialShop={null} />
        </div>
      </div>
    </div>
  );
}