// components/features/shop/ShopSettingsForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { MapLocationPicker } from "@/components/providers/MapLocationPicker";
import { BRAND_CONFIG } from "@/config/brand";

interface ShopSettingsFormProps {
  initialShop?: Record<string, any> | null;
}

export function ShopSettingsForm({ initialShop }: ShopSettingsFormProps) {
  const { defaultCountry } = BRAND_CONFIG;
  const [form, setForm] = useState({
    shopName: initialShop?.shop_name || "",
    phone: initialShop?.phone || "",
    email: initialShop?.email || "",
    drugLicenceNumber: initialShop?.drug_licence_number || "",
    pharmacistName: initialShop?.pharmacist_name || "",
    pharmacistRegistrationNumber: initialShop?.pharmacist_registration_number || "",
    gstin: initialShop?.gstin || "",
    pincode: initialShop?.address?.pincode || "",
    state: initialShop?.address?.state || "",
    district: initialShop?.address?.district || "",
    area: initialShop?.address?.area || "",
    location: initialShop?.location || "",
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const method = initialShop ? "PATCH" : "POST";

    try {
      const payload = {
        shopName: form.shopName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        drugLicenceNumber: form.drugLicenceNumber.trim(),
        pharmacistName: form.pharmacistName.trim(),
        pharmacistRegistrationNumber: form.pharmacistRegistrationNumber.trim(),
        gstin: form.gstin.trim(),
        location: form.location.trim(),
        address: {
          pincode: form.pincode.trim(),
          state: form.state.trim(),
          district: form.district.trim(),
          area: form.area.trim(),
          country: defaultCountry,
        },
      };

      const res = await fetch("/api/protected/shops", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save shop details");
      }

      setSuccess("Shop profile saved successfully");

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3">
        {initialShop ? "Edit Pharmacy Shop Profile" : "Create Pharmacy Shop Profile"}
      </h2>

      {error && (
        <div className="p-3 bg-red-50 border-l-2 border-red-600 text-red-800 rounded-sm text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-teal-50 border-l-2 border-teal-700 text-teal-900 rounded-sm text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Shop Name *"
          required
          disabled={loading}
          value={form.shopName}
          onChange={(e) => setForm({ ...form, shopName: e.target.value })}
          placeholder="City MediCare"
        />
        <Input
          label="Shop Phone *"
          required
          disabled={loading}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="9830098300"
        />
        <Input
          label="Shop Email *"
          type="email"
          required
          disabled={loading}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="shop@medicare.com"
        />
        <Input
          label="GSTIN Number *"
          required
          disabled={loading}
          value={form.gstin}
          onChange={(e) => setForm({ ...form, gstin: e.target.value })}
          placeholder="19AAAAA0000A1Z5"
        />
        <Input
          label="Drug Licence Number *"
          required
          disabled={loading}
          value={form.drugLicenceNumber}
          onChange={(e) => setForm({ ...form, drugLicenceNumber: e.target.value })}
          placeholder="DL-123456"
        />
        <Input
          label="Pharmacist Name *"
          required
          disabled={loading}
          value={form.pharmacistName}
          onChange={(e) => setForm({ ...form, pharmacistName: e.target.value })}
          placeholder="Dr. A. Sharma"
        />
        <Input
          label="Pharmacist Registration Number *"
          required
          disabled={loading}
          value={form.pharmacistRegistrationNumber}
          onChange={(e) => setForm({ ...form, pharmacistRegistrationNumber: e.target.value })}
          placeholder="REG-987"
        />
      </div>

      <div className="border-t border-slate-200 pt-5 space-y-4">
        <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
          Store Address
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Pincode"
            disabled={loading}
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            placeholder="Pincode"
          />
          <Input
            label="State"
            disabled={loading}
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            placeholder="State"
          />
          <Input
            label="District"
            disabled={loading}
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            placeholder="District"
          />
          <Input
            label="Area"
            disabled={loading}
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            placeholder="Area"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5 space-y-4">
        <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
          Google Map Location Pin
        </h3>
        <MapLocationPicker
          value={form.location}
          initialLocationUrl={initialShop?.location || ""}
          onChange={(url) => setForm((prev) => ({ ...prev, location: url }))}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full sm:w-auto rounded-sm">
        Save Shop Details
      </Button>
    </form>
  );
}
