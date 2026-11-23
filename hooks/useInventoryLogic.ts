// hooks/useInventoryLogic.ts
"use client";

import { useState } from "react";
import { useMedicines } from "@/hooks/useMedicines";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import type { MedicineItem } from "@/types";
import type { ExtractedMedicineItem } from "@/components/features/inventory/ImageUploadModal";

export interface MedicineFormState {
  description: string;
  batchNo: string;
  mrp: string;
  rate: string;
  gstRate: string;
  expDate: string;
  quantity: string;
  hsnCode: string;
  packSize: string;
}

const INITIAL_FORM_STATE: MedicineFormState = {
  description: "",
  batchNo: "",
  mrp: "",
  rate: "",
  gstRate: "",
  expDate: "",
  quantity: "",
  hsnCode: "3004",
  packSize: "",
};

export function useInventoryLogic() {
  const confirm = useConfirm();
  const {
    medicines,
    loading,
    error: fetchError,
    search,
    setSearch,
    page,
    setPage,
    limit,
    total,
    refresh,
  } = useMedicines(15);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicineItem | null>(null);
  const [form, setForm] = useState<MedicineFormState>(INITIAL_FORM_STATE);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setError("");
    setEditingMed(null);
    setForm(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };

  const handleSaveAllScannedItems = async (items: ExtractedMedicineItem[]) => {
    if (!items.length) return;
    setSubmitting(true);
    setError("");

    const failedItems: string[] = [];

    try {
      for (const item of items) {
        const res = await fetch("/api/protected/medicines", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: item.description,
            batchNo: item.batchNo,
            hsnCode: item.hsnCode || "3004",
            mrp: parseFloat(item.mrp) || 0,
            rate: parseFloat(item.rate) || 0,
            gstRate: parseFloat(item.gstRate) || 5,
            quantity: parseInt(item.quantity, 10) || 1,
            packSize: item.packSize || "10S",
            expDate: item.expDate,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          failedItems.push(
            `${item.description}: ${data?.error?.message || "Failed to save"}`
          );
        }
      }

      if (failedItems.length > 0) {
        setError(`Some items could not be imported: ${failedItems.join(" | ")}`);
      }

      refresh();
    } catch (err) {
      console.error("Batch save error:", err);
      setError("Unexpected error occurred while importing scanned medicines.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (item: MedicineItem) => {
    setError("");
    setEditingMed(item);
    setForm({
      description: item.description,
      batchNo: item.batch_no,
      mrp: String(item.mrp),
      rate: String(item.rate),
      gstRate: String(item.gst_rate),
      expDate: item.exp_date ? String(item.exp_date).split("T")[0] : "",
      quantity: String(item.quantity),
      hsnCode: item.hsn_code,
      packSize: item.pack_size,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Remove medicine?",
      message: "Are you sure you want to remove this medicine from inventory?",
      confirmLabel: "Remove medicine",
    });
    if (!confirmed) {
      return;
    }

    setError("");
    try {
      const res = await fetch(`/api/protected/medicines/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error?.message || "Failed to delete medicine");
        return;
      }

      refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Network error while deleting medicine.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = editingMed
      ? `/api/protected/medicines/${editingMed.id}`
      : "/api/protected/medicines";
    const method = editingMed ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mrp: parseFloat(form.mrp),
          rate: parseFloat(form.rate),
          gstRate: parseFloat(form.gstRate),
          quantity: parseInt(form.quantity, 10),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to save medicine");
      }

      setIsModalOpen(false);
      refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save medicine";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    medicines,
    loading,
    fetchError,
    search,
    setSearch,
    page,
    setPage,
    limit,
    total,
    isModalOpen,
    setIsModalOpen,
    isScanModalOpen,
    setIsScanModalOpen,
    editingMed,
    form,
    setForm,
    error,
    submitting,
    handleOpenCreate,
    handleSaveAllScannedItems,
    handleOpenEdit,
    handleDelete,
    handleSubmit,
  };
}