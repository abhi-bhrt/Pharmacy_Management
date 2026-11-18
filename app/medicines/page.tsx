// app/medicines/page.tsx
"use client";

import { usePublicMedicines } from "@/hooks/usePublicMedicines";
import { GuestAddressModal } from "@/components/features/inventory/GuestAddressModal";
import { Spinner } from "@/components/ui/Spinner";
import { Search, MapPin, Store, ShieldCheck } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export default function PublicMedicinesPage() {
  const { name: brandName, LogoIcon } = BRAND_CONFIG;
  const {
    medicines,
    loading,
    search,
    setSearch,
    city,
    pincode,
    showAddressModal,
    setShowAddressModal,
    handleSaveGuestAddress,
  } = usePublicMedicines();

  return (
    <div className="min-h-screen bg-slate-100 pt-24 pb-16 px-2 sm:px-6 lg:px-20">
      <GuestAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleSaveGuestAddress}
      />

      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
              <LogoIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Explore Medicines & Inventory
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Live Stock</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Search available salt compositions, generics, and retail stock across {brandName} stores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddressModal(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-teal-700 hover:bg-teal-600 rounded-sm transition-colors cursor-pointer shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {pincode || city
                ? `${city}${city && pincode ? ", " : ""}${pincode}`
                : "Set Location"}
            </span>
          </button>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-slate-300 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines by name, batch number, or HSN code..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {loading ? (
          <Spinner text="Searching medicines..." />
        ) : medicines.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-sm border border-slate-300 shadow-sm">
            <LogoIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              No medicines found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching with a different keyword or updating your location filter.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-sm border border-slate-300 divide-y divide-slate-200 shadow-sm">
            {medicines.map((med) => (
              <div
                key={med.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <LogoIcon className="w-4 h-4 text-teal-700 shrink-0" />
                    <h2 className="font-bold text-slate-900 text-sm">
                      {med.description}
                    </h2>
                    {med.pack_size && (
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {med.pack_size}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{med.shop_name || "Medical Store"}</span>
                    </span>

                    {med.shop_address &&
                      (med.shop_location ? (
                        <a
                          href={med.shop_location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-teal-700 hover:text-teal-800 hover:underline transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{med.shop_address}</span>
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{med.shop_address}</span>
                        </span>
                      ))}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <span className="font-bold text-slate-900 bg-slate-100 border border-slate-300 px-3 py-1 rounded-sm text-xs">
                    ₹{med.mrp}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border ${
                      med.quantity > 0
                        ? "bg-teal-50 text-teal-800 border-teal-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {med.quantity > 0 ? `${med.quantity} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}