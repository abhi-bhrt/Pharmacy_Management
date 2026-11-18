// app/(dashboard)/invoices/page.tsx
"use client";

import { useInvoices } from "@/hooks/useInvoices";
import { InvoicesTable } from "@/components/features/invoices/InvoicesTable";
import { Spinner } from "@/components/ui/Spinner";
import {
  Search,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function InvoicesPage() {
  const { invoices, loading, error, search, setSearch, page, setPage, limit, total } =
    useInvoices(15);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-sm border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Invoices & Billing History
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                <ShieldCheck className="w-3 h-3" />
                <span>{total} Total Bills</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Search generated GST tax invoices, verify payment statuses, and print receipts
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-sm bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white p-3.5 rounded-sm border border-slate-300 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number, customer name, or mobile number..."
          className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <Spinner text="Loading invoices..." />
      ) : (
        <>
          <InvoicesTable invoices={invoices} />

          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 rounded-sm border border-slate-300 shadow-sm flex items-center justify-between text-xs text-slate-600">
              <span>
                Page <strong className="text-slate-900">{page}</strong> of{" "}
                <strong className="text-slate-900">{totalPages}</strong> ({total} invoices)
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
    </div>
  );
}