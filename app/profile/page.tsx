// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { BRAND_CONFIG } from "@/config/brand";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  User,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import type { UpdateUserInput, UserProfileResponse } from "@/types";

export default function UserProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { name: brandName, defaultCountry } = BRAND_CONFIG;

  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobNo: "",
    pincode: "",
    state: "",
    district: "",
    area: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.replace("/signin");
    }
  }, [mounted, authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        mobNo: user.mob_no || "",
        pincode: user.address?.pincode || "",
        state: user.address?.state || "",
        district: user.address?.district || "",
        area: user.address?.area || "",
      });
    }
  }, [user]);

  const resetFormToUser = () => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      mobNo: user.mob_no || "",
      pincode: user.address?.pincode || "",
      state: user.address?.state || "",
      district: user.address?.district || "",
      area: user.address?.area || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const hasAnyAddressField = Boolean(
      form.pincode.trim() ||
      form.state.trim() ||
      form.district.trim() ||
      form.area.trim()
    );

    if (hasAnyAddressField && (!form.pincode.trim() || !form.state.trim())) {
      setError("Pincode and State are required when updating address details");
      return;
    }

    setSaving(true);

    try {
      const payload: UpdateUserInput = {
        name: form.name.trim(),
        mobNo: form.mobNo.trim(),
        address: hasAnyAddressField
          ? {
              pincode: form.pincode.trim(),
              state: form.state.trim(),
              district: form.district.trim(),
              area: form.area.trim(),
              country: defaultCountry,
            }
          : undefined,
      };

      const res = await fetch("/api/protected/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update profile");
      }

      if (data.data?.user) {
        setAuth(data.data.user as UserProfileResponse);
      }

      setSuccess("Profile updated successfully");
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || authLoading || !user) {
    return <Spinner text="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-slate-100 pt-24 pb-16 px-2 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Account Profile
                </h1>
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {brandName} identity and registered address configuration
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setIsEditing(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-teal-700 hover:bg-teal-600 rounded-sm transition-colors cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-sm border border-slate-300 shadow-sm space-y-6"
        >
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

          <fieldset disabled={!isEditing || saving} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Personal Credentials
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Email Address (Read-Only)"
                  type="email"
                  disabled
                  value={form.email}
                  onChange={() => {}}
                />
                <Input
                  label="Mobile Number *"
                  required
                  value={form.mobNo}
                  onChange={(e) => setForm({ ...form, mobNo: e.target.value })}
                />
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Account Status
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-sm text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>{user.status || "ACTIVE"}</span>
                    <span className="text-[10px] font-semibold text-teal-700">
                      {user.is_profile_complete ? "COMPLETE" : "INCOMPLETE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200">
                <MapPin className="w-4 h-4 text-teal-700" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Registered Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
                <Input
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
                <Input
                  label="District"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
                <Input
                  label="Area / Street"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
              </div>
            </div>
          </fieldset>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              <Button type="submit" loading={saving} className="flex-1 rounded-sm">
                Save Changes
              </Button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                  resetFormToUser();
                }}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-300 rounded-sm hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}