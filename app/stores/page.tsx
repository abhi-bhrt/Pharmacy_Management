// app/shops/page.tsx
"use client";

import { usePublicShops } from "@/hooks/usePublicShops";
import { GuestAddressModal } from "@/components/features/inventory/GuestAddressModal";
import { Spinner } from "@/components/ui/Spinner";
import { Store, MapPin, Phone, Mail, MessageCircle, Search } from "lucide-react";

export default function PublicShopsPage() {
  const {
    shops,
    loading,
    search,
    setSearch,
    city,
    setCity,
    pincode,
    setPincode,
    showAddressModal,
    setShowAddressModal,
    handleSaveGuestAddress,
  } = usePublicShops();

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-16 px-4 sm:px-6 lg:px-20">
      <GuestAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleSaveGuestAddress}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Partner Pharmacy Stores</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Find licensed local medical shops and retail outlets near you.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddressModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2a9d8f] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" />
            {pincode || city ? `${city}${city && pincode ? ", " : ""}${pincode}` : "Set Location"}
          </button>
        </div>

        <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-xs flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops by name..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-zinc-800 placeholder:text-zinc-400"
          />
        </div>

        {loading ? (
          <Spinner text="Loading nearby stores..." />
        ) : shops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-zinc-200">
            <Store className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No stores found</p>
            <p className="text-xs text-zinc-400 mt-1">Try changing your location filter or check back later.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 shadow-xs">
            {shops.map((shop) => {
              const cleanPhone = shop.phone ? shop.phone.replace(/\D/g, "") : "";
              const whatsappUrl = cleanPhone
                ? `https://wa.me/91${cleanPhone.slice(-10)}?text=Hi%20${encodeURIComponent(shop.shop_name)},%20I%20would%20like%20to%20inquire%20about%20medicine%20availability.`
                : "#";

              return (
                <div
                  key={shop.id || shop.shop_name}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      <Store className="w-4 h-4 text-teal-600 shrink-0" />
                      {shop.shop_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="text-zinc-500">Licence: {shop.drug_licence_number}</span>
                      {shop.address && (
                        <a href={shop.location} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-teal-600 transition-colors">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          {shop.address.area}, {shop.address.district}, {shop.address.state} {shop.address.pincode}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <span className="text-xs text-zinc-600 font-medium hidden md:inline">
                      {shop.phone}
                    </span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </a>
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