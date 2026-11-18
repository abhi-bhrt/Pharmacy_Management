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
        }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .invoice-container {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 12px !important;
            margin: 0 !important;
            page-break-inside: avoid;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
        }}
      />

      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 text-teal-700" />
          <span>Back to Invoices</span>
        </Link>

        <Button onClick={handlePrint} size="sm">
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print Tax Invoice
        </Button>
      </div>

      <div className="invoice-container max-w-2xl mx-auto bg-white p-6 rounded-sm border border-slate-300 shadow-sm space-y-5 relative overflow-hidden text-xs">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img
            src="/home.png"
            alt="Watermark"
            className="w-full h-full object-contain opacity-10 select-none"
          />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-start border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                {shop?.shop_name || brandName}
              </h1>
              {shop?.drug_licence_number && (
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Drug Licence: <span className="font-semibold">{shop.drug_licence_number}</span>
                </p>
              )}
              {shop?.gstin && (
                <p className="text-[11px] text-slate-600">
                  GSTIN: <span className="font-mono font-semibold">{shop.gstin}</span>
                </p>
              )}
              <p className="text-[11px] text-slate-600">
                Phone: {shop?.phone || "N/A"} | Email: {shop?.email || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold text-slate-900">
                {invoice.invoice_no}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Date: {new Date(invoice.invoice_date).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-sm border border-slate-300">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                Billed To
              </p>
              <p className="font-bold text-slate-950 text-xs">{invoice.buyer?.name}</p>
              <p className="text-slate-700 text-[11px]">Phone: {invoice.buyer?.phone}</p>
              {invoice.buyer?.email && (
                <p className="text-slate-700 text-[11px]">Email: {invoice.buyer.email}</p>
              )}
              {invoice.buyer?.gstin && (
                <p className="text-slate-700 text-[11px] font-mono">
                  GSTIN: {invoice.buyer.gstin}
                </p>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                Prescription & Payment
              </p>
              {invoice.doctor_name && (
                <p className="text-slate-700 text-[11px]">Doctor: {invoice.doctor_name}</p>
              )}
              {invoice.doctor_reg_no && (
                <p className="text-slate-700 text-[11px]">Reg No: {invoice.doctor_reg_no}</p>
              )}
              <p className="text-slate-700 text-[11px]">
                Payment Mode: <span className="font-bold">{invoice.payment_mode}</span>
              </p>
              <p className="text-slate-700 text-[11px]">
                Status: <span className="font-bold">{invoice.payment_status}</span>
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                <th className="py-2 px-2.5">Item Description</th>
                <th className="py-2 px-2">Batch</th>
                <th className="py-2 px-2">HSN</th>
                <th className="py-2 px-2">Qty</th>
                <th className="py-2 px-2">MRP</th>
                <th className="py-2 px-2">Rate</th>
                <th className="py-2 px-2">GST%</th>
                <th className="py-2 px-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2 px-2.5 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-2 px-2 font-mono text-slate-600">{item.batch_no}</td>
                  <td className="py-2 px-2 font-mono text-slate-600">{item.hsn_code}</td>
                  <td className="py-2 px-2 text-slate-700">{item.quantity}</td>
                  <td className="py-2 px-2 text-slate-700">₹{item.mrp}</td>
                  <td className="py-2 px-2 text-slate-700">₹{item.rate}</td>
                  <td className="py-2 px-2 text-slate-700">{item.gst_rate}%</td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                    ₹{item.total_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoice.note && (
            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-sm text-[11px] text-slate-700">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mr-1.5">
                Note:
              </span>
              {invoice.note}
            </div>
          )}

          <div className="flex justify-between items-end pt-3 border-t border-slate-300">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white border border-slate-300 p-1 rounded-sm flex items-center justify-center shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    invoiceUrl
                  )}`}
                  alt="Invoice Link QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-800 uppercase tracking-wider">
                  Scan for e-Receipt
                </p>
                <p className="text-slate-600 font-mono text-[9px] max-w-[200px] truncate">
                  {invoiceUrl}
                </p>
                <p className="text-[9px] text-slate-400">View anytime on web</p>
              </div>
            </div>

            <div className="w-56 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{invoice.sub_total}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST</span>
                <span>₹{invoice.cgst_total}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST</span>
                <span>₹{invoice.sgst_total}</span>
              </div>
              {parseFloat(invoice.discount || "0") > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>-₹{invoice.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-300 pt-1.5">
                <span className="uppercase tracking-wider">Net Payable</span>
                <span className="text-teal-700 text-sm">₹{invoice.net_amount}</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 text-center">
            Thank you for choosing {shop?.shop_name || brandName}. Wishing you a speedy recovery.
          </p>
        </div>
      </div>
    </>
  );
}