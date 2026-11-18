// app/shops/page.tsx
"use client";

import { usePublicShops } from "@/hooks/usePublicShops";
import { GuestAddressModal } from "@/components/features/inventory/GuestAddressModal";
import { Spinner } from "@/components/ui/Spinner";
import { Store, MapPin, MessageCircle, Search, ShieldCheck, Phone } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

export default function PublicShopsPage() {
  const { name: brandName } = BRAND_CONFIG;
  const {
    shops,
    loading,
    search,
    setSearch,
    city,
    pincode,
    showAddressModal,
    setShowAddressModal,
    handleSaveGuestAddress,
  } = usePublicShops();

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
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Partner Pharmacy Stores
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Find licensed medical shops and retail outlets registered with {brandName}
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
            placeholder="Search partner shops by name..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {loading ? (
          <Spinner text="Loading nearby stores..." />
        ) : shops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-sm border border-slate-300 shadow-sm">
            <Store className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              No stores found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try changing your location filter or check back later.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-sm border border-slate-300 divide-y divide-slate-200 shadow-sm">
            {shops.map((shop) => {
              const cleanPhone = shop.phone ? shop.phone.replace(/\D/g, "") : "";
              const whatsappUrl = cleanPhone
                ? `https://wa.me/91${cleanPhone.slice(-10)}?text=Hi%20${encodeURIComponent(
                    shop.shop_name
                  )},%20I%20would%20like%20to%20inquire%20about%20medicine%20availability.`
                : "#";

              const formattedAddress = shop.address
                ? [
                    shop.address.area,
                    shop.address.district,
                    shop.address.state,
                    shop.address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : null;

              return (
                <div
                  key={shop.id || shop.shop_name}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Store className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>{shop.shop_name}</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 uppercase tracking-wide text-[11px]">
                        DL: {shop.drug_licence_number}
                      </span>
                      {formattedAddress &&
                        (shop.location ? (
                          <a
                            href={shop.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-teal-700 hover:text-teal-800 hover:underline transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formattedAddress}</span>
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formattedAddress}</span>
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    {shop.phone && (
                      <a
                        href={`tel:${shop.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-teal-700 font-semibold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{shop.phone}</span>
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}