// components/features/shop/LocationPromptModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AddressInput } from "@/types";

interface LocationPromptModalProps {
  onLocationSaved?: (location: { city: string; pincode: string }) => void;
  allowDismiss?: boolean;
}

export function LocationPromptModal({
  onLocationSaved,
  allowDismiss = true,
}: LocationPromptModalProps) {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const guestAddress = useAuthStore((state) => state.guestAddress);
  const setGuestAddress = useAuthStore((state) => state.setGuestAddress);

  const { name: brandName, defaultCountry } = BRAND_CONFIG;

  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");

  const onLocationSavedRef = useRef(onLocationSaved);
  onLocationSavedRef.current = onLocationSaved;
  const hasCheckedInitialRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || authLoading || hasCheckedInitialRef.current) return;
    hasCheckedInitialRef.current = true;

    const activeAddress = user?.address || guestAddress;
    const savedCity = (activeAddress?.district || activeAddress?.area || "").trim();
    const savedPincode = (activeAddress?.pincode || "").trim();

    if (savedCity || savedPincode) {
      setCity(savedCity);
      setPincode(savedPincode);
      setIsOpen(false);
      onLocationSavedRef.current?.({ city: savedCity, pincode: savedPincode });
    } else {
      setIsOpen(true);
    }
  }, [hasHydrated, authLoading, user, guestAddress]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedCity = city.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedCity || !trimmedPincode) {
      setError("Please enter both city/district and pincode.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedPincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    const addressPayload: AddressInput = {
      pincode: trimmedPincode,
      state: guestAddress?.state || "",
      district: trimmedCity,
      area: guestAddress?.area || "",
      country: defaultCountry,
    };

    setGuestAddress(addressPayload);
    setIsOpen(false);
    onLocationSavedRef.current?.({ city: trimmedCity, pincode: trimmedPincode });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white rounded-sm shadow-lg border border-slate-300 w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-teal-600 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                Enter Your Location
              </h2>
              <p className="text-[11px] text-slate-400">
                Set your city and pincode to locate {brandName} stores
              </p>
            </div>
          </div>
          {allowDismiss && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close location modal"
              className="text-slate-400 hover:text-white p-1 rounded-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-sm bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <Input
            label="City / District *"
            required
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. Kolkata, Mumbai"
          />

          <Input
            label="Pincode *"
            required
            maxLength={6}
            inputMode="numeric"
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ""));
              if (error) setError("");
            }}
            placeholder="e.g. 700001"
          />

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            {allowDismiss && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm transition-colors cursor-pointer"
              >
                Skip
              </button>
            )}
            <Button type="submit" className="justify-center">
              Continue to Stores
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}