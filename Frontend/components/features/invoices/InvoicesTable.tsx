// components/features/invoices/InvoicesTable.tsx
import React from "react";
import { Table } from "@/components/ui/Table";
import { Eye } from "lucide-react";
import Link from "next/link";
import type { InvoiceSummaryItem } from "@/hooks/useInvoices";

interface InvoicesTableProps {
  invoices: InvoiceSummaryItem[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const headers = [
    "Invoice No",
    "Date",
    "Customer / Store",
    "Phone",
    "Items",
    "Net Amount",
    "Mode",
    "Status",
    "Actions",
  ];

  return (
    <Table
      headers={headers}
      isEmpty={invoices.length === 0}
      emptyMessage="No tax invoices generated yet."
    >
      {invoices.map((inv) => (
        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
          <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
            {inv.invoice_no}
          </td>
          <td className="px-4 py-3 text-slate-600">
            {new Date(inv.invoice_date).toLocaleDateString()}
          </td>
          <td className="px-4 py-3 font-semibold text-slate-900">{inv.buyer_name}</td>
          <td className="px-4 py-3 text-slate-600">{inv.buyer_phone}</td>
          <td className="px-4 py-3 text-slate-600">{inv.item_count} items</td>
          <td className="px-4 py-3 font-bold text-slate-900">₹{inv.net_amount}</td>
          <td className="px-4 py-3 text-slate-600 font-semibold text-[11px]">
            {inv.payment_mode}
          </td>
          <td className="px-4 py-3">
            <span
              className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                inv.payment_status === "PAID"
                  ? "bg-teal-50 text-teal-800 border-teal-200"
                  : inv.payment_status === "PARTIALLY_PAID"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {inv.payment_status.replace("_", " ")}
            </span>
          </td>
          <td className="px-4 py-3">
            <Link
              href={`/invoices/${inv.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
}