// components/features/invoices/InvoiceReceipt.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BRAND_CONFIG } from "@/config/brand";

interface InvoiceReceiptProps {
  invoice: any;
  shop: any;
}

export function InvoiceReceipt({ invoice, shop }: InvoiceReceiptProps) {
  const { name: brandName } = BRAND_CONFIG;

  const handlePrint = () => {
    window.print();
  };

  const invoiceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reciept/${invoice.id}`
      : `/reciept/${invoice.id}`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            color: #1e293b !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .invoice-container {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 6px !important;
            margin: 0 !important;
            color: #1e293b !important;
            page-break-inside: avoid;
          }
          .invoice-container p,
          .invoice-container span,
          .invoice-container td,
          .invoice-container h1 {
            color: #0f172a !important;
          }
          .invoice-container thead tr {
            background-color: #1e293b !important;
          }
          .invoice-container thead th {
            color: #f8fafc !important;
          }
        }
      `,
        }}
      />

      <div className="max-w-3xl mx-auto mb-3 flex items-center justify-between print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-teal-700" />
          <span>Back to Invoices</span>
        </Link>

        <Button onClick={handlePrint} size="sm">
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print Invoice
        </Button>
      </div>

      <div className="invoice-container max-w-3xl mx-auto p-2 rounded-sm border border-slate-200 shadow-sm space-y-2.5 relative overflow-hidden text-[11px] leading-tight text-slate-800">
        <div className="relative z-10 space-y-1">
          {/* Top Header */}
          <div className="flex justify-between items-start gap-3 border-b border-slate-300 pb-2">
            <div className="space-y-0.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
                {shop?.shop_name || brandName}
              </h1>

              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-800">
                {shop?.drug_licence_number && (
                  <span>
                    DL: <strong className="font-semibold">{shop.drug_licence_number}</strong>
                  </span>
                )}
                {shop?.gstin && (
                  <span>
                    GSTIN: <strong className="font-mono font-semibold">{shop.gstin}</strong>
                  </span>
                )}
              </div>

              <p className="text-[10px] text-slate-800">
                Ph: <span>{shop?.phone || "N/A"}</span>
                <span className="mx-1.5 text-slate-300">|</span>
                Email: <span>{shop?.email || "N/A"}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-700">
                Bill No
              </p>
              <p className="text-xs font-mono font-bold text-slate-900">
                {invoice.invoice_no}
              </p>
              <p className="text-[10px] text-slate-800 mt-0.5 tabular-nums">
                {new Date(invoice.invoice_date).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Compact 3-Column Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/90 p-2 rounded-sm border border-slate-200">
            {/* Buyer */}
            <div className="sm:border-r sm:border-slate-200 sm:pr-2 space-y-0.5">
              <p className="font-bold text-teal-800 uppercase tracking-wider text-[9px]">
                Billed To
              </p>
              <p className="font-bold text-slate-900 text-[11px] truncate">
                {invoice.buyer?.name}
              </p>
              <p className="text-[10px] text-slate-800 tabular-nums">
                Ph: {invoice.buyer?.phone}
              </p>
              {invoice.buyer?.email && (
                <p className="text-[10px] text-slate-800 truncate">
                  {invoice.buyer.email}
                </p>
              )}
              {invoice.buyer?.gstin && (
                <p className="text-[10px] text-slate-800 font-mono truncate">
                  GSTIN: {invoice.buyer.gstin}
                </p>
              )}
            </div>

            {/* Prescription */}
            <div className="sm:border-r sm:border-slate-200 sm:pr-2 space-y-0.5">
              <p className="font-bold text-teal-800 uppercase tracking-wider text-[9px]">
                Prescription
              </p>
              {invoice.doctor_name || invoice.doctor_reg_no ? (
                <>
                  {invoice.doctor_name && (
                    <p className="text-[10px] text-slate-900 font-medium truncate">
                      Dr. {invoice.doctor_name.replace(/^Dr\.?\s*/i, "")}
                    </p>
                  )}
                  {invoice.doctor_reg_no && (
                    <p className="text-[10px] text-slate-800 font-mono truncate">
                      Reg: {invoice.doctor_reg_no}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-slate-700 italic">Not specified</p>
              )}
            </div>

            {/* Payment */}
            <div className="space-y-0.5">
              <p className="font-bold text-teal-800 uppercase tracking-wider text-[9px]">
                Payment
              </p>
              <p className="text-[10px] text-slate-800">
                Mode: <span className="font-semibold text-slate-900">{invoice.payment_mode}</span>
              </p>
              <p className="text-[10px] text-slate-800">
                Status: <span className="font-semibold text-slate-900">{invoice.payment_status}</span>
              </p>
            </div>
          </div>

          {/* Compact Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 tabular-nums">
              <thead>
                <tr className="bg-slate-800 text-slate-50 text-[9px] uppercase tracking-wider">
                  <th className="py-1 px-2">Item Description</th>
                  <th className="py-1 px-1.5">Batch</th>
                  <th className="py-1 px-1.5">HSN</th>
                  <th className="py-1 px-1.5 text-right">Qty</th>
                  <th className="py-1 px-1.5 text-right">MRP</th>
                  <th className="py-1 px-1.5 text-right">Rate</th>
                  <th className="py-1 px-1.5 text-right">GST</th>
                  <th className="py-1 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[10px] text-slate-800">
                {invoice.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-1 px-2 font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-1 px-1.5 font-mono text-slate-800 whitespace-nowrap">
                      {item.batch_no}
                    </td>
                    <td className="py-1 px-1.5 font-mono text-slate-800 whitespace-nowrap">
                      {item.hsn_code}
                    </td>
                    <td className="py-1 px-1.5 text-right text-slate-900 whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="py-1 px-1.5 text-right text-slate-800 whitespace-nowrap">
                      ₹{item.mrp}
                    </td>
                    <td className="py-1 px-1.5 text-right text-slate-900 whitespace-nowrap">
                      ₹{item.rate}
                    </td>
                    <td className="py-1 px-1.5 text-right text-slate-800 whitespace-nowrap">
                      {item.gst_rate}%
                    </td>
                    <td className="py-1 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{item.total_amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer: QR + Note on Left, Totals on Right */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-2.5 pt-2 border-t border-slate-300">
            <div className="flex-1 space-y-1.5">
              {invoice.note && (
                <div className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-sm text-[10px] text-slate-800">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-slate-900 mr-1">
                    Note:
                  </span>
                  {invoice.note}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="w-20 h-20 bg-white border border-slate-300 p-0.5 rounded-sm flex items-center justify-center shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      invoiceUrl
                    )}`}
                    alt="Invoice Link QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[9px] text-slate-800 space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-900 uppercase tracking-wider">
                    Scan for e-Receipt
                  </p>
                  <p className="text-slate-800 font-mono text-[8.5px] max-w-[230px] truncate">
                    {invoiceUrl}
                  </p>
                  <p className="text-slate-700">View anytime on web</p>
                </div>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="w-full sm:w-52 bg-slate-50/90 border border-slate-200 rounded-sm p-2 space-y-0.5 text-[10px] text-slate-800 tabular-nums shrink-0">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{invoice.sub_total}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST</span>
                <span>₹{invoice.cgst_total}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST</span>
                <span>₹{invoice.sgst_total}</span>
              </div>
              {parseFloat(invoice.discount || "0") > 0 && (
                <div className="flex justify-between text-teal-800 font-semibold">
                  <span>Discount</span>
                  <span>-₹{invoice.discount}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-xs font-bold text-slate-900 border-t border-slate-300 pt-1 mt-1">
                <span className="uppercase tracking-wider text-[10px]">Net Payable</span>
                <span className="text-teal-800 text-sm">₹{invoice.net_amount}</span>
              </div>
            </div>
          </div>

          {/* Closing Line */}
          <p className="text-[9.5px] text-slate-800 pt-1 border-t border-slate-200 text-center">
            Thank you for choosing{" "}
            <span className="font-semibold text-slate-900">
              {shop?.shop_name || brandName}
            </span>
            . Wishing you a speedy recovery.
          </p>
        </div>
      </div>
    </>
  );
}