// components/features/inventory/MedicinesTable.tsx
import React from "react";
import { Table } from "@/components/ui/Table";
import { Trash2, Edit, AlertTriangle } from "lucide-react";
import type { MedicineItem } from "@/types";

interface MedicinesTableProps {
  medicines: MedicineItem[];
  onEdit: (item: MedicineItem) => void;
  onDelete: (id: string) => void;
}

export function MedicinesTable({ medicines, onEdit, onDelete }: MedicinesTableProps) {
  const headers = [
    "Description",
    "Batch No",
    "HSN",
    "Pack",
    "MRP",
    "Rate",
    "GST",
    "Expiry Date",
    "Stock",
    "Actions",
  ];

  const getExpiryStatus = (expDateStr?: string): "expired" | "expiring" | "ok" => {
    if (!expDateStr) return "ok";
    const expDate = new Date(expDateStr);
    if (Number.isNaN(expDate.getTime())) return "ok";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expDate < today) return "expired";

    const threeMonthsFromNow = new Date(today);
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    if (expDate <= threeMonthsFromNow) return "expiring";

    return "ok";
  };

  return (
    <Table
      headers={headers}
      isEmpty={medicines.length === 0}
      emptyMessage="No medicines found in inventory."
    >
      {medicines.map((med) => {
        const expiryStatus = getExpiryStatus(med.exp_date);
        const lowStock = med.quantity <= 10;

        return (
          <tr key={med.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 font-bold text-slate-900">{med.description}</td>
            <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{med.batch_no}</td>
            <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{med.hsn_code}</td>
            <td className="px-4 py-3 text-slate-600">{med.pack_size}</td>
            <td className="px-4 py-3 font-bold text-slate-900">₹{med.mrp}</td>
            <td className="px-4 py-3 text-slate-600">₹{med.rate}</td>
            <td className="px-4 py-3 text-slate-600">{med.gst_rate}%</td>

            <td className="px-4 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-slate-700 text-xs">
                  {med.exp_date ? new Date(med.exp_date).toLocaleDateString() : "N/A"}
                </span>
                {expiryStatus === "expired" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 w-fit">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>Expired</span>
                  </span>
                )}
                {expiryStatus === "expiring" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 w-fit">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Expiring Soon</span>
                  </span>
                )}
              </div>
            </td>

            <td className="px-4 py-3">
              <div className="flex flex-col gap-1">
                <span
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border w-fit ${
                    !lowStock
                      ? "bg-teal-50 text-teal-800 border-teal-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {med.quantity} units
                </span>
                {lowStock && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock</span>
                  </span>
                )}
              </div>
            </td>

            <td className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(med)}
                  aria-label={`Edit ${med.description}`}
                  className="p-1.5 text-slate-500 hover:text-teal-700 rounded-sm hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(med.id)}
                  aria-label={`Delete ${med.description}`}
                  className="p-1.5 text-slate-500 hover:text-red-700 rounded-sm hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}