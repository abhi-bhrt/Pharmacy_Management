// app/(dashboard)/invoices/[id]/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InvoiceReceipt } from "@/components/features/invoices/InvoiceReceipt";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api/api";

function InvoiceDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDetails() {
      try {
        const [invRes, shopRes] = await Promise.all([
          apiFetch(`/api/protected/invoices/${id}`),
          apiFetch("/api/protected/shops"),
        ]);

        const [invData, shopData] = await Promise.all([
          invRes.json().catch(() => null),
          shopRes.json().catch(() => null),
        ]);

        if (!isMounted) return;

        if (invRes.ok && invData?.success) {
          setInvoice(invData.data.invoice);
        }
        if (shopRes.ok && shopData?.success) {
          setShop(shopData.data.shop);
        }
      } catch (err) {
        console.error("Failed to load invoice receipt:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      fetchDetails();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <Spinner text="Loading invoice receipt..." />;
  }

  if (!invoice) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-sm border border-slate-300 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
        Invoice record not found.
      </div>
    );
  }

  return <InvoiceReceipt invoice={invoice} shop={shop} />;
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={<Spinner text="Loading invoice..." />}>
      <InvoiceDetailContent />
    </Suspense>
  );
}