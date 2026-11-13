"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { createWorker } from "tesseract.js";

export interface ExtractedMedicineItem {
  description: string;
  batchNo: string;
  hsnCode: string;
  quantity: string;
  mrp: string;
  rate: string;
  gstRate: string;
  packSize: string;
  expDate: string;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAll: (items: ExtractedMedicineItem[]) => void;
}

export function ImageUploadModal({ isOpen, onClose, onSaveAll }: ImageUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMedicineItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          processImageFile(file);
        }
      }, "image/jpeg");
    }
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    setLoading(true);
    setProgress("Initializing OCR engine...");

    try {
      const worker = await createWorker("eng");
      setProgress("Extracting invoice items...");
      const ret = await worker.recognize(file);
      let text = ret.data.text;

      // Fix rupee symbol recognized as '3'
      text = text.replace(/3(\d+\.\d{2})/g, "₹$1");

      await worker.terminate();
      parseInvoiceItems(text);
    } catch (err) {
      console.error("OCR Extraction failed:", err);
      alert("Failed to read text from image.");
      setLoading(false);
    }
  };

  // Precise parser for your specific invoice format:
  // Item Description | Batch | HSN | Qty | MRP | Rate | GST% | Total
  const parseInvoiceItems = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Find table start boundary
    const startIndex = lines.findIndex((l) => 
      l.toLowerCase().includes("item description") || l.toLowerCase().includes("batch")
    );
    // Find table end boundary
    const endIndex = lines.findIndex((l) => 
      l.toLowerCase().includes("subtotal") || l.toLowerCase().includes("net amount")
    );

    const itemsList: ExtractedMedicineItem[] = [];

    if (startIndex !== -1) {
      const tableLines = lines.slice(
        startIndex + 1, 
        endIndex !== -1 ? endIndex : lines.length
      );

      for (const line of tableLines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 7) {
          // Extract tokens backwards based on your invoice column layout
          const total = parts[parts.length - 1]?.replace(/[^\d.]/g, "") || "";
          const gstRate = parts[parts.length - 2]?.replace(/[^0-9.]/g, "") || "12";
          const rate = parts[parts.length - 3]?.replace(/[^\d.]/g, "") || "";
          const mrp = parts[parts.length - 4]?.replace(/[^\d.]/g, "") || "";
          const qty = parts[parts.length - 5]?.replace(/[^0-9]/g, "") || "1";
          const hsnCode = parts[parts.length - 6] || "3004";
          const batchNo = parts[parts.length - 7] || "BCH-01";
          const description = parts.slice(0, -7).join(" ") || parts[0];

          if (description && mrp) {
            itemsList.push({
              description: description.replace(/[^a-zA-Z0-9\smg.-]/g, "").trim(),
              batchNo,
              hsnCode,
              quantity: qty || "1",
              mrp,
              rate: rate || mrp,
              gstRate: gstRate || "12",
              packSize: "10s",
              expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default 1 year ahead
            });
          }
        }
      }
    }

    setLoading(false);
    setProgress("");

    if (itemsList.length > 0) {
      setExtractedItems(itemsList);
      setShowReviewModal(true); // Open review list popup
    } else {
      alert("No items could be automatically parsed. Please check the image format.");
    }
  };

  const handleItemChange = (index: number, field: keyof ExtractedMedicineItem, value: string) => {
    const updated = [...extractedItems];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedItems(updated);
  };

  const removeItem = (index: number) => {
    setExtractedItems(extractedItems.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Upload / Camera Selection Modal */}
      <Modal isOpen={isOpen && !showReviewModal} onClose={() => { stopCamera(); onClose(); }} title="Scan Invoice / Bill">
        <div className="space-y-4 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2a9d8f]" />
              <p className="text-sm font-medium text-zinc-600">{progress}</p>
            </div>
          ) : isCameraActive ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                <Button onClick={captureImage} className="w-full justify-center bg-[#2a9d8f] hover:bg-[#238276]">
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={stopCamera} className="w-full justify-center">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 rounded-lg hover:border-[#2a9d8f] hover:bg-zinc-50 transition cursor-pointer"
              >
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-sm font-semibold text-zinc-700">Upload Image</span>
                <span className="text-xs text-zinc-400 mt-1">PNG, JPG, JPEG</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 rounded-lg hover:border-[#2a9d8f] hover:bg-zinc-50 transition cursor-pointer"
              >
                <Camera className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-sm font-semibold text-zinc-700">Open Camera</span>
                <span className="text-xs text-zinc-400 mt-1">Take live photo</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Review & Edit Extracted Items List Modal */}
      <Modal 
        isOpen={showReviewModal} 
        onClose={() => setShowReviewModal(false)} 
        title={`Review Extracted Medicines (${extractedItems.length})`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <p className="text-xs text-zinc-500">
            Verify the extracted items below. You can edit any field or remove items before saving them to inventory.
          </p>

          <div className="space-y-3">
            {extractedItems.map((item, index) => (
              <div key={index} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="w-full font-semibold text-sm bg-white border border-zinc-300 px-2 py-1 rounded"
                    placeholder="Medicine Description"
                  />
                  <button 
                    onClick={() => removeItem(index)} 
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-zinc-500 font-medium">Batch</label>
                    <input
                      type="text"
                      value={item.batchNo}
                      onChange={(e) => handleItemChange(index, "batchNo", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 font-medium">HSN</label>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 font-medium">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-zinc-500 font-medium">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.mrp}
                      onChange={(e) => handleItemChange(index, "mrp", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 font-medium">Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 font-medium">GST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.gstRate}
                      onChange={(e) => handleItemChange(index, "gstRate", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 font-medium">Expiry</label>
                    <input
                      type="date"
                      value={item.expDate}
                      onChange={(e) => handleItemChange(index, "expDate", e.target.value)}
                      className="w-full bg-white border border-zinc-300 px-2 py-1 rounded mt-0.5 text-[10px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowReviewModal(false)} 
              className="w-full justify-center"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                onSaveAll(extractedItems);
                setShowReviewModal(false);
                onClose();
              }} 
              className="w-full justify-center bg-[#2a9d8f] hover:bg-[#238276]"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Save All to Inventory
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}