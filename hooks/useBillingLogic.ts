// hooks/useBillingLogic.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMedicines } from "@/hooks/useMedicines";

export interface CartItem {
  medicineId: string;
  description: string;
  batchNo: string;
  rate: number;
  mrp: number;
  gstRate: number;
  quantity: number;
  freeQuantity: number;
  maxStock: number;
}

export interface ShopOption {
  id: string;
  shop_name: string;
  phone: string;
  email: string;
  gstin: string;
}

export function useBillingLogic() {
  const router = useRouter();
  const { medicines } = useMedicines(100);

  const [billingType, setBillingType] = useState<"B2C" | "B2B">("B2C");
  const [b2bInputMode, setB2bInputMode] = useState<"manual" | "search">("manual");
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [shopSearchResults, setShopSearchResults] = useState<ShopOption[]>([]);
  const [isShopSearchFocused, setIsShopSearchFocused] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerGstin, setBuyerGstin] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState("0");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const resetForm = () => {
    setBillingType("B2C");
    setB2bInputMode("manual");
    setShopSearchQuery("");
    setShopSearchResults([]);
    setSelectedShopId(null);
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
    setBuyerGstin("");
    setPaymentMode("UPI");
    setPaymentStatus("PAID");
    setDoctorName("");
    setDoctorRegNo("");
    setNote("");
    setDiscount("0");
    setCart([]);
    setMedSearch("");
    setError("");
  };

  useEffect(() => {
    let isMounted = true;
    const query = shopSearchQuery.trim();

    if (billingType === "B2B" && b2bInputMode === "search" && query.length > 0) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/shops/search?shopName=${encodeURIComponent(query)}`, {
            credentials: "include",
          });
          const data = await res.json().catch(() => null);

          if (!isMounted) return;

          if (data?.success && Array.isArray(data.data?.shops) && data.data.shops.length > 0) {
            setShopSearchResults(data.data.shops);
          } else {
            const resGstin = await fetch(`/api/shops/search?gstin=${encodeURIComponent(query)}`, {
              credentials: "include",
            });
            const dataGstin = await resGstin.json().catch(() => null);
            if (!isMounted) return;

            if (dataGstin?.success && Array.isArray(dataGstin.data?.shops)) {
              setShopSearchResults(dataGstin.data.shops);
            } else {
              setShopSearchResults([]);
            }
          }
        } catch {
          if (isMounted) setShopSearchResults([]);
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setShopSearchResults([]);
    }
  }, [shopSearchQuery, billingType, b2bInputMode]);

  const handleSelectShop = (shop: ShopOption) => {
    setSelectedShopId(shop.id);
    setBuyerName(shop.shop_name);
    setBuyerPhone(shop.phone || "");
    setBuyerEmail(shop.email || "");
    setBuyerGstin(shop.gstin || "");
    setShopSearchQuery(shop.shop_name);
    setIsShopSearchFocused(false);
  };

  const filteredMedicines = medicines.filter((m) => {
    const query = medSearch.toLowerCase().trim();
    if (!query) return false;
    return (
      m.description.toLowerCase().includes(query) ||
      m.batch_no.toLowerCase().includes(query) ||
      m.hsn_code.toLowerCase().includes(query) ||
      String(m.mrp).toLowerCase().includes(query) ||
      String(m.exp_date).toLowerCase().includes(query) ||
      String(m.quantity).includes(query)
    );
  });

  const handleAddToCart = (med: any) => {
    if (med.quantity < 1) return;

    const existing = cart.find((item) => item.medicineId === med.id);
    if (existing) {
      if (existing.quantity + 1 > med.quantity) return;
      setCart(
        cart.map((item) =>
          item.medicineId === med.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          description: med.description,
          batchNo: med.batch_no,
          rate: parseFloat(med.rate) || 0,
          mrp: parseFloat(med.mrp) || 0,
          gstRate: parseFloat(med.gst_rate) || 0,
          quantity: 1,
          freeQuantity: 0,
          maxStock: med.quantity,
        },
      ]);
    }
    setMedSearch("");
    setIsSearchFocused(false);
  };

  const updateQuantity = (medicineId: string, qty: number) => {
    setCart(
      cart.map((item) => {
        if (item.medicineId === medicineId) {
          const newQty = Math.max(1, Math.min(qty, item.maxStock));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (medicineId: string) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const subTotal = cart.reduce((acc, item) => acc + item.rate * item.quantity, 0);
  const totalGst = cart.reduce(
    (acc, item) => acc + (item.rate * item.quantity * item.gstRate) / 100,
    0
  );
  const discountNum = parseFloat(discount) || 0;
  const netAmount = Math.max(0, subTotal + totalGst - discountNum);

  const handleSubmitBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Add at least one medicine item to generate invoice.");
      return;
    }
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setError("Customer Name and Phone number are required.");
      return;
    }
    if (billingType === "B2B" && !buyerGstin.trim()) {
      setError("GSTIN is required for B2B billing.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        buyer: {
          name: buyerName.trim(),
          phone: buyerPhone.trim(),
          email: buyerEmail ? buyerEmail.trim() : null,
          gstin: billingType === "B2B" && buyerGstin ? buyerGstin.trim() : null,
        },
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          freeQuantity: i.freeQuantity,
        })),
        discount: discountNum,
        paymentMode,
        paymentStatus,
        doctorName: billingType === "B2C" && doctorName ? doctorName.trim() : null,
        doctorRegNo: billingType === "B2C" && doctorRegNo ? doctorRegNo.trim() : null,
        note: note ? note.trim() : null,
      };

      if (billingType === "B2B" && b2bInputMode === "search" && selectedShopId) {
        payload.buyerShopId = selectedShopId;
      }

      const res = await fetch("/api/protected/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to generate invoice");
      }

      resetForm();
      setSuccessMessage("Invoice generated successfully!");

      setTimeout(() => {
        router.push(`/invoices/${data.data.invoice.id}`);
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate invoice";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    billingType,
    setBillingType: (type: "B2C" | "B2B") => {
      setBillingType(type);
      if (type === "B2C") {
        setSelectedShopId(null);
        setB2bInputMode("manual");
      }
    },
    b2bInputMode,
    setB2bInputMode,
    shopSearchQuery,
    setShopSearchQuery,
    shopSearchResults,
    isShopSearchFocused,
    setIsShopSearchFocused,
    handleSelectShop,
    buyerName,
    setBuyerName,
    buyerPhone,
    setBuyerPhone,
    buyerEmail,
    setBuyerEmail,
    buyerGstin,
    setBuyerGstin,
    paymentMode,
    setPaymentMode,
    paymentStatus,
    setPaymentStatus,
    doctorName,
    setDoctorName,
    doctorRegNo,
    setDoctorRegNo,
    note,
    setNote,
    discount,
    setDiscount,
    cart,
    medSearch,
    setMedSearch,
    isSearchFocused,
    setIsSearchFocused,
    loading,
    error,
    successMessage,
    filteredMedicines,
    handleAddToCart,
    updateQuantity,
    removeItem,
    subTotal,
    totalGst,
    netAmount,
    handleSubmitBill,
    resetForm,
  };
}