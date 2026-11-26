// hooks/useInvoices.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";

export interface InvoiceSummaryItem {
  id: string;
  invoice_no: string;
  invoice_date: string;
  net_amount: string;
  payment_mode: string;
  payment_status: string;
  buyer_name: string;
  buyer_phone: string;
  item_count: number;
}

export function useInvoices(limit: number = 15) {
  const [invoices, setInvoices] = useState<InvoiceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: debouncedSearch.trim(),
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/protected/invoices?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to load invoices");
      }

      setInvoices(data.data?.invoices || []);
      setTotal(data.data?.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load invoices";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    search,
    setSearch: handleSearchChange,
    page,
    setPage,
    limit,
    total,
    refresh: fetchInvoices,
  };
}