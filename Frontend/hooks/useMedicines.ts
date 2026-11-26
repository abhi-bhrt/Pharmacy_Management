// hooks/useMedicines.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import { apiFetch } from "@/lib/api/api";
import type { MedicineItem } from "@/types";

export type { MedicineItem };

export function useMedicines(limit: number = 15) {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
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

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: debouncedSearch.trim(),
        page: String(page),
        limit: String(limit),
      });

      const res = await apiFetch(`/api/protected/medicines?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message || "Failed to load inventory");
      }

      setMedicines(data.data?.medicines || []);
      setTotal(data.data?.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load inventory";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  return {
    medicines,
    loading,
    error,
    search,
    setSearch: handleSearchChange,
    page,
    setPage,
    limit,
    total,
    refresh: fetchMedicines,
  };
}