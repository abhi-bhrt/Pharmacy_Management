// components/features/inventory/InventoryView.tsx
"use client";

import React, { useState, useMemo } from "react";
import { MedicinesTable } from "@/components/features/inventory/MedicinesTable";
import {
  ImageUploadModal,
  type ExtractedMedicineItem,
} from "@/components/features/inventory/ImageUploadModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  Plus,
  Search,
  AlertTriangle,
  X,
  ScanLine,
  Package,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { MedicineItem } from "@/types";
import type { MedicineFormState } from "@/hooks/useInventoryLogic";

interface InventoryViewProps {
  medicines: MedicineItem[];
  loading: boolean;
  fetchError?: string | null;
  search: string;
  setSearch: (value: string) => void;
  page?: number;
  setPage?: (page: number) => void;
  limit?: number;
  total?: number;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isScanModalOpen: boolean;
  setIsScanModalOpen: (open: boolean) => void;
  editingMed: MedicineItem | null;
  form: MedicineFormState;
  setForm: React.Dispatch<React.SetStateAction<MedicineFormState>>;
  error: string;
  submitting: boolean;
  handleOpenCreate: () => void;
  handleSaveAllScannedItems: (items: ExtractedMedicineItem[]) => void;
  handleOpenEdit: (item: MedicineItem) => void;
  handleDelete: (id: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function InventoryView({
  medicines,
  loading,
  fetchError,
  search,
  setSearch,
  page = 1,
  setPage,
  limit = 15,
  total = 0,
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
}: InventoryViewProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "expiring" | "lowStock">("all");

  const isExpiringSoon = (expDateStr?: string) => {
    if (!expDateStr) return false;
    const expDate = new Date(expDateStr);
    if (Number.isNaN(expDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeMonthsFromNow = new Date(today);
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    return expDate <= threeMonthsFromNow;
  };

  const processedMedicines = useMemo(
    () =>
      medicines.map((med) => ({
        ...med,
        isExpiringSoon: isExpiringSoon(med.exp_date),
        isLowStock: med.quantity <= 10,
      })),
    [medicines]
  );

  const filteredMedicines = useMemo(() => {
    if (activeFilter === "expiring") {
      return processedMedicines.filter((m) => m.isExpiringSoon);
    }
    if (activeFilter === "lowStock") {
      return processedMedicines.filter((m) => m.isLowStock);
    }
    return processedMedicines;
  }, [processedMedicines, activeFilter]);

  const expiringCount = processedMedicines.filter((m) => m.isExpiringSoon).length;
  const lowStockCount = processedMedicines.filter((m) => m.isLowStock).length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Inventory & Medicines
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                <ShieldCheck className="w-3 h-3" />
                <span>{total} Total SKUs</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage pharmacy stock levels, batch numbers, GST rates, and expiry dates
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            <ScanLine className="w-4 h-4 text-teal-400" />
            <span>{submitting ? "Importing..." : "Scan Invoice"}</span>
          </button>

          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Medicine
          </Button>
        </div>
      </div>

      {(error || fetchError) && !isModalOpen && (
        <div className="px-4 py-3 rounded-sm bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
          {error || fetchError}
        </div>
      )}

      {!loading && (
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() =>
              setActiveFilter(activeFilter === "expiring" ? "all" : "expiring")
            }
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm border uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              activeFilter === "expiring"
                ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                activeFilter === "expiring" ? "text-white" : "text-amber-600"
              }`}
            />
            <span>Expiring / Expired (&lt; 3M): {expiringCount}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveFilter(activeFilter === "lowStock" ? "all" : "lowStock")
            }
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm border uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              activeFilter === "lowStock"
                ? "bg-red-600 text-white border-red-700 shadow-sm"
                : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                activeFilter === "lowStock" ? "text-white" : "text-red-600"
              }`}
            />
            <span>Low Stock (≤ 10): {lowStockCount}</span>
          </button>

          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2.5 py-1.5 text-[11px] uppercase tracking-wider underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      )}

      <div className="bg-white p-3.5 rounded-sm border border-slate-300 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory by description, batch number, or HSN code..."
          className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <Spinner text="Loading inventory..." />
      ) : (
        <>
          <MedicinesTable
            medicines={filteredMedicines}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />

          {setPage && totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-sm border border-slate-300 shadow-sm flex items-center justify-between text-xs text-slate-600">
              <span>
                Page <strong className="text-slate-900">{page}</strong> of{" "}
                <strong className="text-slate-900">{totalPages}</strong> ({total} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] disabled:opacity-40 cursor-pointer disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] disabled:opacity-40 cursor-pointer disabled:pointer-events-none"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ImageUploadModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSaveAll={handleSaveAllScannedItems}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMed ? "Edit Medicine Record" : "Add New Medicine"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-sm bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <Input
            label="Medicine Description *"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Paracetamol 650mg Tablet"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Batch Number *"
              required
              value={form.batchNo}
              onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
              placeholder="BCH-01"
            />
            <Input
              label="HSN Code *"
              required
              value={form.hsnCode}
              onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              placeholder="3004"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="MRP (₹) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            />
            <Input
              label="Rate (₹) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
            <Input
              label="GST Rate (%) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.gstRate}
              onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Quantity *"
              type="number"
              min="0"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              label="Pack Size *"
              required
              value={form.packSize}
              onChange={(e) => setForm({ ...form, packSize: e.target.value })}
              placeholder="10S"
            />
            <Input
              label="Expiry Date *"
              type="date"
              required
              value={form.expDate}
              onChange={(e) => setForm({ ...form, expDate: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <Button type="submit" loading={submitting} className="w-full justify-center">
              {editingMed ? "Update Medicine" : "Save Medicine"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}