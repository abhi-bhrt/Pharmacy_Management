// hooks/usePublicMedicines.ts
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/useDebounce";
import type { AddressInput, PublicMedicineResponse } from "@/types";

export function usePublicMedicines() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const guestAddress = useAuthStore((state) => state.guestAddress);
  const setGuestAddress = useAuthStore((state) => state.setGuestAddress);

  const [medicines, setMedicines] = useState<PublicMedicineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const debouncedCity = useDebounce(city, 400);
  const debouncedPincode = useDebounce(pincode, 400);

  useEffect(() => {
    if (!hasHydrated || authLoading) return;

    const activeAddress = user?.address || guestAddress;
    const hasValidLocation = Boolean(
      activeAddress?.pincode?.trim() ||
      activeAddress?.district?.trim() ||
      activeAddress?.area?.trim()
    );

    if (hasValidLocation && activeAddress) {
      setCity(activeAddress.district || activeAddress.area || "");
      setPincode(activeAddress.pincode || "");
      setShowAddressModal(false);
    } else if (!hasInitializedLocation) {
      setShowAddressModal(true);
    }

    setHasInitializedLocation(true);
  }, [hasHydrated, authLoading, user, guestAddress, hasInitializedLocation]);

  const handleSaveGuestAddress = (address: AddressInput) => {
    const normalizedAddress: AddressInput = {
      pincode: address.pincode?.trim() || "",
      state: address.state?.trim() || "",
      district: address.district?.trim() || "",
      area: address.area?.trim() || "",
      country: address.country || "IN",
    };

    setGuestAddress(normalizedAddress);
    setCity(normalizedAddress.district || normalizedAddress.area || "");
    setPincode(normalizedAddress.pincode || "");
    setShowAddressModal(false);
  };

  useEffect(() => {
    if (!hasInitializedLocation) return;

    let isMounted = true;

    async function fetchMedicines() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        if (debouncedCity.trim()) params.set("city", debouncedCity.trim());
        if (debouncedPincode.trim()) params.set("pincode", debouncedPincode.trim());
        params.set("limit", "20");

        const res = await fetch(`/api/medicines?${params.toString()}`);
        const data = await res.json();

        if (isMounted) {
          if (res.ok && data?.success) {
            setMedicines(data.data?.medicines || []);
          } else {
            setMedicines([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
        if (isMounted) setMedicines([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMedicines();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, debouncedCity, debouncedPincode, hasInitializedLocation]);

  return {
    medicines,
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
  };
}