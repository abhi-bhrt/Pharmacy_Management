// components/features/billing/BillingPosFormView.tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Trash2,
  ShoppingCart,
  CheckCircle2,
  Search,
  Package,
  Building2,
  UserCheck,
  Receipt,
} from "lucide-react";
import type { CartItem, ShopOption } from "@/hooks/useBillingLogic";

interface BillingPosFormViewProps {
  billingType: "B2C" | "B2B";
  setBillingType: (type: "B2C" | "B2B") => void;
  b2bInputMode: "manual" | "search";
  setB2bInputMode: (mode: "manual" | "search") => void;
  shopSearchQuery: string;
  setShopSearchQuery: (val: string) => void;
  shopSearchResults: ShopOption[];
  isShopSearchFocused: boolean;
  setIsShopSearchFocused: (val: boolean) => void;
  handleSelectShop: (shop: ShopOption) => void;
  buyerName: string;
  setBuyerName: (val: string) => void;
  buyerPhone: string;
  setBuyerPhone: (val: string) => void;
  buyerEmail: string;
  setBuyerEmail: (val: string) => void;
  buyerGstin: string;
  setBuyerGstin: (val: string) => void;
  paymentMode: string;
  setPaymentMode: (val: string) => void;
  paymentStatus: string;
  setPaymentStatus: (val: string) => void;
  doctorName: string;
  setDoctorName: (val: string) => void;
  doctorRegNo: string;
  setDoctorRegNo: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  discount: string;
  setDiscount: (val: string) => void;
  cart: CartItem[];
  medSearch: string;
  setMedSearch: (val: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (val: boolean) => void;
  loading: boolean;
  error: string;
  successMessage: string;
  filteredMedicines: any[];
  handleAddToCart: (med: any) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  subTotal: number;
  totalGst: number;
  netAmount: number;
  handleSubmitBill: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function BillingPosFormView({
  billingType,
  setBillingType,
  b2bInputMode,
  setB2bInputMode,
  shopSearchQuery,
  setShopSearchQuery,
  shopSearchResults,
  isShopSearchFocused,
  setIsShopSearchFocused,
  handleSelectShop,
  buyerName,
  setBuyerName,
  buyerPhone,
  setBuyerPhone,
  buyerEmail,
  setBuyerEmail,
  buyerGstin,
  setBuyerGstin,
  paymentMode,
  setPaymentMode,
  paymentStatus,
  setPaymentStatus,
  doctorName,
  setDoctorName,
  doctorRegNo,
  setDoctorRegNo,
  note,
  setNote,
  discount,
  setDiscount,
  cart,
  medSearch,
  setMedSearch,
  isSearchFocused,
  setIsSearchFocused,
  loading,
  error,
  successMessage,
  filteredMedicines,
  handleAddToCart,
  updateQuantity,
  removeItem,
  subTotal,
  totalGst,
  netAmount,
  handleSubmitBill,
}: BillingPosFormViewProps) {
  return (
    <form onSubmit={handleSubmitBill} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 space-y-5">
        <div className="bg-white p-6 rounded-sm border border-slate-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Inventory Medicine Selection
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Live Stock Lookup
            </span>
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={medSearch}
                onChange={(e) => {
                  setMedSearch(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search medicine by name, batch number, HSN, MRP, or expiry..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>

            {isSearchFocused && medSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-sm shadow-lg max-h-72 overflow-y-auto z-50 divide-y divide-slate-200">
                {filteredMedicines.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching medicines found in active inventory.
                  </div>
                ) : (
                  filteredMedicines.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => handleAddToCart(med)}
                      className="p-3 hover:bg-teal-50/70 cursor-pointer flex items-center justify-between transition-colors text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{med.description}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                          Batch: <span className="font-semibold text-slate-700">{med.batch_no}</span> |{" "}
                          Exp: <span className="font-semibold text-slate-700">{med.exp_date ? new Date(med.exp_date).toLocaleDateString() : "N/A"}</span> |{" "}
                          HSN: <span className="font-semibold text-slate-700">{med.hsn_code}</span> |{" "}
                          Pack: <span className="font-semibold text-slate-700">{med.pack_size}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-bold text-teal-700">₹{med.mrp}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                            med.quantity > 0
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          Stock: {med.quantity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="border border-slate-300 rounded-sm overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="p-3">Medicine Description</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">GST%</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      <Package className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs font-semibold uppercase tracking-wider">
                        Search and select medicines above to add items to bill
                      </p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.medicineId} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{item.description}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{item.batchNo}</td>
                      <td className="p-3 text-slate-700">₹{item.rate.toFixed(2)}</td>
                      <td className="p-3 text-slate-700">{item.gstRate}%</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={1}
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.medicineId, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-16 px-2 py-1 border border-slate-300 rounded-sm text-xs text-center font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        ₹
                        {(
                          item.rate * item.quantity +
                          (item.rate * item.quantity * item.gstRate) / 100
                        ).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(item.medicineId)}
                          aria-label={`Remove ${item.description}`}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-sm hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-slate-300 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3.5 gap-3">
            <div className="flex items-center gap-2">
              {billingType === "B2B" ? (
                <Building2 className="w-4 h-4 text-teal-700" />
              ) : (
                <UserCheck className="w-4 h-4 text-teal-700" />
              )}
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Customer & Prescription Details
              </h2>
            </div>

            <div className="inline-flex bg-slate-100 p-0.5 rounded-sm border border-slate-300">
              <button
                type="button"
                onClick={() => setBillingType("B2C")}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                  billingType === "B2C"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Direct Customer (B2C)
              </button>
              <button
                type="button"
                onClick={() => setBillingType("B2B")}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                  billingType === "B2B"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                B2B (Business)
              </button>
            </div>
          </div>

          {billingType === "B2B" && (
            <div className="bg-slate-50 p-4 rounded-sm border border-slate-300 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Is the buyer store registered on our platform?
                </span>
                <div className="inline-flex bg-white p-0.5 rounded-sm border border-slate-300 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setB2bInputMode("manual")}
                    className={`px-3 py-1 font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                      b2bInputMode === "manual"
                        ? "bg-teal-700 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    No (Manual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setB2bInputMode("search")}
                    className={`px-3 py-1 font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                      b2bInputMode === "search"
                        ? "bg-teal-700 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Yes (Auto-Transfer Stock)
                  </button>
                </div>
              </div>

              {b2bInputMode === "search" && (
                <div className="relative pt-1">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={shopSearchQuery}
                      onChange={(e) => {
                        setShopSearchQuery(e.target.value);
                        setIsShopSearchFocused(true);
                      }}
                      onFocus={() => setIsShopSearchFocused(true)}
                      placeholder="Search registered pharmacy by shop name or partial GSTIN..."
                      className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    />
                  </div>

                  {isShopSearchFocused && shopSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-sm shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-slate-200">
                      {shopSearchResults.map((shop) => (
                        <div
                          key={shop.id}
                          onClick={() => handleSelectShop(shop)}
                          className="p-3 hover:bg-teal-50/70 cursor-pointer text-xs flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{shop.shop_name}</p>
                            <p className="text-slate-500 text-[11px]">
                              GSTIN: <span className="font-mono font-semibold text-slate-700">{shop.gstin}</span> | Ph: {shop.phone}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-1 rounded-sm">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={billingType === "B2B" ? "Buyer Shop Name *" : "Customer Full Name *"}
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder={billingType === "B2B" ? "Registered Pharmacy Name" : "Enter full name"}
            />
            <Input
              label="Mobile Number *"
              required
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="10-digit mobile number"
            />
            <Input
              label="Email Address"
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="customer@example.com"
            />

            {billingType === "B2B" ? (
              <Input
                label="GSTIN *"
                required
                value={buyerGstin}
                onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                placeholder="15-character GSTIN"
              />
            ) : (
              <>
                <Input
                  label="Doctor Name (Optional)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Sharma"
                />
                <Input
                  label="Doctor Reg No (Optional)"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  placeholder="REG-1234"
                />
              </>
            )}
          </div>

          <Input
            label="Invoice Note / Dosage Instructions"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Take after meals twice daily"
          />
        </div>
      </div>

      <div className="lg:col-span-4 space-y-5">
        <div className="bg-white p-6 rounded-sm border border-slate-300 shadow-sm space-y-4 sticky top-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Receipt className="w-4 h-4 text-teal-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Billing Summary
            </h2>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-200 pb-4">
            <div className="flex justify-between">
              <span>Subtotal (Taxable)</span>
              <span className="font-semibold text-slate-900">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total GST (CGST + SGST)</span>
              <span className="font-semibold text-slate-900">₹{totalGst.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span>Flat Discount (₹)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2.5 py-1 border border-slate-300 rounded-sm text-right text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
            <span className="uppercase tracking-wider text-xs">Net Payable</span>
            <span className="text-lg text-teal-700">₹{netAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-sm bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="px-3 py-2.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-sm text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full justify-center">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Generate Tax Invoice
          </Button>
        </div>
      </div>
    </form>
  );
}