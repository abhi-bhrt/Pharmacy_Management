// app/(dashboard)/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ShopSettingsForm } from "@/components/features/shop/ShopSettingsForm";
import { Spinner } from "@/components/ui/Spinner";
import { Store, ShieldCheck } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export default function ProfilePage() {
  const { name: brandName } = BRAND_CONFIG;
  const [shop, setShop] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchShop() {
      try {
        const res = await fetch("/api/protected/shops", { credentials: "include" });
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data?.success) {
            setShop(data.data?.shop || null);
          } else {
            setShop(null);
          }
        }
      } catch (err) {
        console.error("Failed to load shop:", err);
        if (isMounted) setShop(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchShop();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Spinner text="Loading shop profile..." />;
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Shop & Business Profile
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Management</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your registered pharmacy details, GSTIN, and store location for {brandName}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-sm">
        <ShopSettingsForm initialShop={shop} />
      </div>
    </div>
  );
}