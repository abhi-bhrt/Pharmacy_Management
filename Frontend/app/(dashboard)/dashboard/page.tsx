// app/(dashboard)/dashboard/page.tsx
"use client";

import Link from "next/link";
import {
  Package,
  FileText,
  ShoppingCart,
  Settings,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);

  const { name: brandName, LogoIcon } = BRAND_CONFIG;

  if (authLoading || !user) {
    return <Spinner text="Loading dashboard workspace..." />;
  }

  const shop = user.address && "shop_name" in user ? (user as any) : null;
  const address = shop?.address || user.address;

  const formattedAddress = address
    ? [address.area, address.district, address.state, address.pincode]
        .filter(Boolean)
        .join(", ")
    : "No registered address provided";

  const navActions = [
    {
      name: "Inventory Management",
      description: "Manage medicines, real-time stock batches, MRP rates, and expiry tracking.",
      href: "/inventory",
      icon: Package,
    },
    {
      name: "POS Billing Terminal",
      description: "Generate instant counter bills, apply GST calculations, and print invoices.",
      href: "/billing",
      icon: ShoppingCart,
    },
    {
      name: "Invoice History",
      description: "Review past transactions, inspect sale records, and reprint tax invoices.",
      href: "/invoices",
      icon: FileText,
    },
    {
      name: "Shop & License Settings",
      description: "Update store credentials, drug licence numbers, GSTIN, and map location.",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-sm border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <LogoIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {user.name || "Administrator"}
              </h1>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {brandName} Enterprise Portal • Signed in as {user.email}
            </p>
          </div>
        </div>

        <Link
          href="/profile"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-sm shrink-0"
        >
          <span>Edit Profile</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Shop & Business Profile Overview
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Active Enterprise Store</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Registered Mobile
            </span>
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.mob_no || "Not provided"}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Email Address
            </span>
            <p className="font-semibold text-slate-900 flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Account Status
            </span>
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>{user.status || "ACTIVE"} ({user.is_profile_complete ? "Profile Complete" : "Incomplete"})</span>
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Registered Address / Location
            </span>
            <p className="font-semibold text-slate-900 flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{formattedAddress}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Licence Verification
            </span>
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <FileBadge className="w-3.5 h-3.5 text-teal-700" />
              <span>Drug Authority Compliant</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
          Quick Portal Actions
        </h2>

        <div className="divide-y divide-slate-200">
          {navActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-sm bg-slate-100 border border-slate-200 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-700 group-hover:text-white group-hover:border-teal-700 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider group-hover:text-teal-700 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}