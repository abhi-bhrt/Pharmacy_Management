// hooks/usePublicShops.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch } from "@/lib/api/api";
import type { AddressInput, ShopResponse } from "@/types";

export function usePublicShops() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const guestAddress = useAuthStore((state) => state.guestAddress);
  const setGuestAddress = useAuthStore((state) => state.setGuestAddress);

  const [allShops, setAllShops] = useState<ShopResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedCity = useDebounce(city, 300);
  const debouncedPincode = useDebounce(pincode, 300);

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

    async function fetchShops() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        if (debouncedCity.trim()) params.set("city", debouncedCity.trim());
        if (debouncedPincode.trim()) params.set("pincode", debouncedPincode.trim());

        const res = await apiFetch(`/api/shops?${params.toString()}`);
        const data = await res.json();

        if (isMounted) {
          if (res.ok && data?.success) {
            setAllShops(data.data?.shops || []);
          } else {
            setAllShops([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch public shops:", err);
        if (isMounted) setAllShops([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchShops();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, debouncedCity, debouncedPincode, hasInitializedLocation]);

  const shops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allShops;
    return allShops.filter((shop) => shop.shop_name.toLowerCase().includes(q));
  }, [allShops, search]);

  return {
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
  };
}