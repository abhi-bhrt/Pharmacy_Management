// components/features/inventory/GuestAddressModal.tsx
"use client";

import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import type { AddressInput } from "@/types";

interface GuestAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressInput) => void;
  initialAddress?: AddressInput | null;
}

export function GuestAddressModal({
  isOpen,
  onClose,
  onSave,
  initialAddress,
}: GuestAddressModalProps) {
  const { defaultCountry } = BRAND_CONFIG;

  const [form, setForm] = useState<AddressInput>({
    pincode: initialAddress?.pincode || "",
    state: initialAddress?.state || "",
    district: initialAddress?.district || "",
    area: initialAddress?.area || "",
    country: initialAddress?.country || defaultCountry,
  });

  useEffect(() => {
    if (initialAddress) {
      setForm({
        pincode: initialAddress.pincode || "",
        state: initialAddress.state || "",
        district: initialAddress.district || "",
        area: initialAddress.area || "",
        country: initialAddress.country || defaultCountry,
      });
    }
  }, [initialAddress, defaultCountry]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      pincode: form.pincode.trim(),
      state: form.state.trim(),
      district: form.district?.trim() || "",
      area: form.area?.trim() || "",
      country: defaultCountry,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white w-full max-w-md rounded-sm border border-slate-300 shadow-lg overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                Select Your Location
              </h2>
              <p className="text-[11px] text-slate-400">
                Enter your address to find nearby pharmacy stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="guest-pincode"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Pincode *
              </label>
              <input
                id="guest-pincode"
                type="text"
                required
                placeholder="484001"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>

            <div>
              <label
                htmlFor="guest-district"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                District / City *
              </label>
              <input
                id="guest-district"
                type="text"
                required
                placeholder="Shahdol"
                value={form.district || ""}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>

            <div>
              <label
                htmlFor="guest-state"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                State
              </label>
              <input
                id="guest-state"
                type="text"
                placeholder="Madhya Pradesh"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>

            <div>
              <label
                htmlFor="guest-area"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Area / Locality
              </label>
              <input
                id="guest-area"
                type="text"
                placeholder="Sohagpur"
                value={form.area || ""}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer"
            >
              Show Medicines
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}