// hooks/usePublicShops.ts
"use client";

import { useState, useEffect } from "react";
import { useAuthStore, type UserAddress } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/useDebounce";

export function usePublicShops() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const guestAddress = useAuthStore((state) => state.guestAddress);
  const setGuestAddress = useAuthStore((state) => state.setGuestAddress);

  const [shops, setShops] = useState<any[]>([]);
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
    if (authLoading) return;

    if (user?.address) {
      setCity(user.address.district || user.address.area || "");
      setPincode(user.address.pincode || "");
      setShowAddressModal(false);
      setHasInitializedLocation(true);
      return;
    }

    if (user && !user.address) {
      setHasInitializedLocation(true);
      return;
    }

    const storedGuest = sessionStorage.getItem("guest_address");
    const activeGuest: UserAddress | null =
      guestAddress || (storedGuest ? JSON.parse(storedGuest) : null);

    if (activeGuest && (activeGuest.pincode || activeGuest.district || activeGuest.area)) {
      if (!guestAddress) setGuestAddress(activeGuest);
      setCity(activeGuest.district || activeGuest.area || "");
      setPincode(activeGuest.pincode || "");
      setShowAddressModal(false);
    } else {
      setShowAddressModal(true);
    }
    setHasInitializedLocation(true);
  }, [user, authLoading, guestAddress, setGuestAddress]);

  const handleSaveGuestAddress = (address: UserAddress) => {
    setGuestAddress(address);
    setCity(address.district || address.area || "");
    setPincode(address.pincode || "");
    setShowAddressModal(false);
  };

  useEffect(() => {
    if (!hasInitializedLocation) return;

    async function fetchShops() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (debouncedCity) params.append("city", debouncedCity);
        if (debouncedPincode) params.append("pincode", debouncedPincode);
        params.append("limit", "20");

        const res = await fetch(`/api/shops?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setShops(data.data.shops || (data.data.shop ? [data.data.shop] : []));
        }
      } catch (err) {
        console.error("Failed to fetch shops:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchShops();
  }, [debouncedSearch, debouncedCity, debouncedPincode, hasInitializedLocation]);

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