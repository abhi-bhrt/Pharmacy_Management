// app/(dashboard)/layout.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Store,
  Package,
  FileText,
  ShoppingCart,
  Home,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";
import { Spinner } from "@/components/ui/Spinner";
import NotFound from "../not-found";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const { name: brandName, LogoIcon } = BRAND_CONFIG;

  const sidebarLinks = [
    { name: "Overview", href: "/dashboard", icon: Store },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "POS Billing", href: "/billing", icon: ShoppingCart },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Settings", href: "/settings", icon: ShieldAlert },
  ];

  const handleExitDashboard = () => {
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return <Spinner text="Verifying access..." />;
  }

  if (!user || !isAdmin) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-slate-900 border-r border-slate-800 z-30 justify-between text-white">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
              <LogoIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {brandName} Portal
              </span>
              <span className="text-[10px] text-slate-400">Admin Control</span>
            </div>
          </div>

          <nav className="px-3 py-6 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-teal-700 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700 text-teal-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name ? user.name.charAt(0) : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || "Administrator"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || "admin@pharmacare.com"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExitDashboard}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-teal-400" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen p-4 sm:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}