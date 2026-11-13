// components/medicines/GuestAddressModal.tsx
"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import type { UserAddress } from "@/store/useAuthStore";

interface GuestAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: UserAddress) => void;
  initialAddress?: UserAddress | null;
}

export function GuestAddressModal({
  isOpen,
  onClose,
  onSave,
  initialAddress,
}: GuestAddressModalProps) {
  const [form, setForm] = useState<UserAddress>({
    pincode: initialAddress?.pincode || "",
    state: initialAddress?.state || "",
    district: initialAddress?.district || "",
    area: initialAddress?.area || "",
    country: "IN",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
      <div className="bg-white w-full max-w-md rounded-xl border border-zinc-200 shadow-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#2a9d8f]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Select Your Location</h2>
              <p className="text-xs text-zinc-500">
                Enter your address to find nearby pharmacy stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Pincode *
              </label>
              <input
                type="text"
                required
                placeholder="484001"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400/65 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                District / City *
              </label>
              <input
                type="text"
                required
                placeholder="Shahdol"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400/65 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="Madhya Pradesh"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400/65 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                placeholder="Sohagpur"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400/65 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] focus:border-[#2a9d8f]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#2a9d8f] hover:bg-[#238276] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Show Medicines
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}