// app/invoices/[id]/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InvoiceReceipt } from "@/components/features/invoices/InvoiceReceipt";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api/api";

function PublicInvoiceDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchPublicInvoice() {
      try {
        const res = await apiFetch(`/api/invoices/${id}`);
        const data = await res.json().catch(() => null);

        if (!isMounted) return;

        if (res.ok && data?.success) {
          const inv = data.data.invoice;
          setInvoice(inv);
          // The public invoice service nests shop info inside inv.shop
          setShop(inv.shop || null);
        } else {
          setError(data?.error?.message || "Invoice not found or link has expired.");
        }
      } catch (err) {
        console.error("Failed to load public invoice receipt:", err);
        setError("Network error while loading invoice.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      fetchPublicInvoice();
    } else {
      setLoading(false);
      setError("Invalid invoice identifier.");
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <Spinner text="Loading public tax invoice..." />;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm border border-slate-300 shadow-sm text-center space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Invoice Not Found
          </h2>
          <p className="text-xs text-slate-600">
            {error || "The requested invoice receipt does not exist or the URL is invalid."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 pt-20">
      <InvoiceReceipt invoice={invoice} shop={shop} />
    </div>
  );
}

export default function PublicInvoicePage() {
  return (
    <Suspense fallback={<Spinner text="Loading invoice..." />}>
      <PublicInvoiceDetailContent />
    </Suspense>
  );
}