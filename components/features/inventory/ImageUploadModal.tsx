"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, Loader2, Trash2, CheckCircle2, Plus } from "lucide-react";
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
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
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            processImageFile(file);
          }
        },
        "image/jpeg",
        0.95
      );
    }
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
      e.target.value = "";
    }
  };

  /**
   * Upscale image 2x with gentle grayscale so Tesseract reads small table text
   * without washing out watermarked rows.
   */
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = img.width < 1800 ? 2 : 1.25;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(url);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Gentle contrast keeps watermarked rows intact
        ctx.filter = "grayscale(100%) contrast(115%)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  };

  const processImageFile = async (file: File) => {
    setLoading(true);
    setProgress("Preparing high-res image for OCR...");

    try {
      const processedDataUrl = await preprocessImage(file);
      const worker = await createWorker("eng");

      // PSM 6 = Assume a single uniform block of text (critical for multi-column invoice tables)
      await worker.setParameters({
        tessedit_pageseg_mode: "6" as any,
        preserve_interword_spaces: "1",
      });

      setProgress("Scanning all medicine rows...");
      const ret = await worker.recognize(processedDataUrl);
      const text = ret.data.text;

      await worker.terminate();
      parseInvoiceItems(text);
    } catch (err) {
      console.error("OCR Extraction failed:", err);
      alert("Failed to read text from image.");
      setLoading(false);
    }
  };

  // Normalize OCR digit confusions inside numeric tokens (O -> 0, I/l -> 1, S -> 5, B -> 8)
  const normalizeDigits = (str: string): string => {
    return str
      .replace(/[oOQD]/g, "0")
      .replace(/[iIl|!]/g, "1")
      .replace(/Z/g, "2")
      .replace(/S/g, "5")
      .replace(/B/g, "8");
  };

  // Convert expiry token ("11/26", "7/27", "10/29", or OCR-mangled "11127") into YYYY-MM-DD
  const parseExpiryToken = (token: string): string | null => {
    const cleaned = token.replace(/[^0-9a-zA-Z\/\-]/g, "");

    // Case 1: explicit slash or hyphen (e.g. 11/26, 7/27, 1O/29, 2/2B)
    const sepMatch = cleaned.match(/^([0-9oOiIl]{1,2})[\/\-]([0-9oOiIlSB]{2,4})$/);
    if (sepMatch) {
      const m = parseInt(normalizeDigits(sepMatch[1]), 10);
      let y = parseInt(normalizeDigits(sepMatch[2]), 10);
      if (y < 100) y += 2000;
      if (m >= 1 && m <= 12 && y >= 2024 && y <= 2035) {
        return new Date(Date.UTC(y, m, 0)).toISOString().split("T")[0];
      }
    }

    // Case 2: slash misread as '1' or 'I' or dropped (e.g. "11126" -> 11/26, "7127" -> 7/27, "1029" -> 10/29)
    const digitsOnly = normalizeDigits(cleaned).replace(/[^\d]/g, "");
    if (digitsOnly.length === 5 && digitsOnly[2] === "1") {
      const m = parseInt(digitsOnly.slice(0, 2), 10);
      const y = 2000 + parseInt(digitsOnly.slice(3, 5), 10);
      if (m >= 1 && m <= 12 && y >= 2024 && y <= 2035) {
        return new Date(Date.UTC(y, m, 0)).toISOString().split("T")[0];
      }
    }
    if (digitsOnly.length === 4) {
      // Could be M + '1' + YY (e.g. 7127 -> 7/27) or MM + YY (e.g. 1029 -> 10/29)
      const m2 = parseInt(digitsOnly.slice(0, 2), 10);
      const y2 = 2000 + parseInt(digitsOnly.slice(2, 4), 10);
      if (m2 >= 1 && m2 <= 12 && y2 >= 2024 && y2 <= 2035) {
        return new Date(Date.UTC(y2, m2, 0)).toISOString().split("T")[0];
      }
      if (digitsOnly[1] === "1") {
        const m1 = parseInt(digitsOnly[0], 10);
        const y1 = 2000 + parseInt(digitsOnly.slice(2, 4), 10);
        if (m1 >= 1 && m1 <= 9 && y1 >= 2024 && y1 <= 2035) {
          return new Date(Date.UTC(y1, m1, 0)).toISOString().split("T")[0];
        }
      }
    }

    return null;
  };

  // Detect 4-digit pharma/cosmetic HSN code even with OCR letter substitutions (3004, 2106, 6210)
  const extractHsnCode = (token: string): string | null => {
    const clean = token.replace(/[^a-zA-Z0-9]/g, "");
    if (clean.length !== 4) return null;
    const norm = normalizeDigits(clean);
    if (/^(300\d|210\d|621\d|30\d\d|21\d\d|62\d\d|90\d\d|38\d\d|33\d\d)$/.test(norm)) {
      return norm;
    }
    return null;
  };

  // Convert QTY.+FREE token ("10+1", "6", ".500+.500", "2ML+DISP.500+.500") into integer quantity
  const parseQtyToken = (rawQty: string): string => {
    if (!rawQty) return "1";
    const plusMatch = rawQty.match(/(\d*\.?\d+)\+(\d*\.?\d+)/);
    if (plusMatch) {
      const q1 = parseFloat(plusMatch[1]) || 0;
      const q2 = parseFloat(plusMatch[2]) || 0;
      const sum = Math.round(q1 + q2);
      return sum > 0 ? String(sum) : "1";
    }
    const norm = normalizeDigits(rawQty);
    const numMatch = norm.match(/^\d+$/);
    if (numMatch) return numMatch[0];
    const anyNum = norm.match(/\d+/);
    return anyNum ? anyNum[0] : "1";
  };

  // Extract decimal numbers from the right side of the row (O.MRP, N.MRP, RATE, DIS%, GST%, AMOUNT)
  const extractTrailingDecimals = (str: string): number[] => {
    // Fix spaces around decimal point like "164 .06" or "78,57"
    const normalized = str
      .replace(/(\d)\s*[\.,]\s*(\d{2})\b/g, "$1.$2")
      .replace(/[oO](\.\d{2})\b/g, "0$1");

    const matches = normalized.match(/\d+\.\d{2}/g);
    return matches ? matches.map((m) => parseFloat(m)) : [];
  };

  /**
   * Robust multi-strategy parser for wholesale GST Pharma Invoices
   * Columns: Description | HSN. | Pack | QTY.+FREE | Batch | Exp. | O. MRP. | N MRP. | RATE | DIS% | GST% | AMOUNT
   */
  const parseInvoiceItems = (text: string) => {
    const rawLines = text
      .split("\n")
      .map((l) =>
        l
          .replace(/[|¦!\[\]{}_~«»"“”‘’]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((l) => l.length > 12);

    const itemsList: ExtractedMedicineItem[] = [];
    const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    for (const line of rawLines) {
      // 1. Skip non-item header, watermark, and footer lines
      if (
        /sai\s*drug\s*house|new\s*pawan|swastik\s*galaxy|gst\s*invoice|d\.?l\.?\s*no|gstin|invoice\s*no|d\s*e\s*s\s*c\s*r|description.*hsn|sub\s*total|sgst\s*taxable|cgst\s*taxable|total\s*item|state\s*bank|ifsc\s*code|thousand\s*five|bill\s*risive|erp\s*to\s*erp|marg\s*erp|personally\s*trusted/i.test(
          line
        )
      ) {
        continue;
      }

      // Every valid medicine row on this invoice has decimal price columns on the right
      const decimals = extractTrailingDecimals(line);
      if (decimals.length < 3) continue;

      const tokens = line.split(" ");
      if (tokens.length < 6) continue;

      // 2. Locate HSN Code index (3004, 2106, 6210) to cleanly isolate the Medicine Name on the left
      let hsnIdx = -1;
      let hsnCode = "3004";
      for (let i = 1; i < Math.min(tokens.length - 4, 8); i++) {
        const detectedHsn = extractHsnCode(tokens[i]);
        if (detectedHsn) {
          hsnIdx = i;
          hsnCode = detectedHsn;
          break;
        }
      }

      // 3. Locate Expiry Date token (MM/YY) searching before the price columns
      let expIdx = -1;
      let expDateISO = defaultExpiry;
      const searchStart = Math.min(tokens.length - 3, tokens.length - 1);
      const searchFloor = hsnIdx !== -1 ? hsnIdx + 2 : 2;

      for (let i = searchStart; i >= searchFloor; i--) {
        // Skip pure decimal price tokens like 110.00 or 5.00
        if (/^\d+\.\d{2}$/.test(tokens[i])) continue;
        const parsedExp = parseExpiryToken(tokens[i]);
        if (parsedExp) {
          expIdx = i;
          expDateISO = parsedExp;
          break;
        }
      }

      // 4. Determine Description, Pack, Qty, and Batch
      let description = "";
      let packSize = "10S";
      let quantity = "1";
      let batchNo = "BCH-01";

      // Find where the decimal price columns start in the token array
      let firstPriceIdx = tokens.findIndex(
        (t, idx) => idx > (hsnIdx !== -1 ? hsnIdx : 1) && /^\d+\.\d{2}$/.test(t.replace(/,/g, "."))
      );
      if (firstPriceIdx === -1) firstPriceIdx = tokens.length - decimals.length;

      if (expIdx === -1) {
        // Fallback: Expiry was right before the first decimal price
        expIdx = Math.max(firstPriceIdx - 1, (hsnIdx !== -1 ? hsnIdx : 1) + 2);
        const fallbackExp = parseExpiryToken(tokens[expIdx] || "");
        if (fallbackExp) expDateISO = fallbackExp;
      }

      // Batch is the token immediately before Expiry
      if (expIdx - 1 > (hsnIdx !== -1 ? hsnIdx : 0)) {
        batchNo = tokens[expIdx - 1];
      }

      if (hsnIdx !== -1) {
        // Everything before HSN is the exact Medicine Description!
        description = tokens.slice(0, hsnIdx).join(" ");

        // Tokens between HSN and Batch are [Pack..., QTY.+FREE]
        const middleTokens = tokens.slice(hsnIdx + 1, Math.max(hsnIdx + 1, expIdx - 1));
        if (middleTokens.length >= 2) {
          quantity = parseQtyToken(middleTokens[middleTokens.length - 1]);
          packSize = middleTokens.slice(0, -1).join(" ");
        } else if (middleTokens.length === 1) {
          const single = middleTokens[0];
          // Handle long merged Pack+Qty like "2ML+DISP.500+.500"
          if (single.includes("+") && /[a-zA-Z]/.test(single)) {
            quantity = parseQtyToken(single);
            packSize = single.split("+")[0] || "10S";
          } else if (/^\d+(\+\d+)?$/.test(normalizeDigits(single))) {
            quantity = parseQtyToken(single);
          } else {
            packSize = single;
          }
        }
      } else {
        // Fallback if HSN column was unreadable: split at pack-like token (e.g. 2ML, 30ML, 10S, 150ML, 1X5)
        const leftOfBatch = tokens.slice(0, Math.max(1, expIdx - 1));
        const packIdx = leftOfBatch.findIndex(
          (t, idx) =>
            idx >= 1 &&
            /^(\d+\s*(ML|GM|MG|S|TAB|CAP)|\d+[\*X]\d+|\d+GM\/\d+)$/i.test(t)
        );

        if (packIdx !== -1) {
          // Check if token before packIdx is a mangled 4-char HSN
          const possibleHsnIdx =
            packIdx >= 2 && leftOfBatch[packIdx - 1].length === 4 ? packIdx - 1 : packIdx;
          description = leftOfBatch.slice(0, possibleHsnIdx).join(" ");
          const mid = leftOfBatch.slice(packIdx);
          if (mid.length >= 2) {
            quantity = parseQtyToken(mid[mid.length - 1]);
            packSize = mid.slice(0, -1).join(" ");
          } else {
            packSize = mid[0] || "10S";
          }
        } else {
          quantity = parseQtyToken(leftOfBatch[leftOfBatch.length - 1] || "1");
          packSize = leftOfBatch[leftOfBatch.length - 2] || "10S";
          description = leftOfBatch.slice(0, Math.max(1, leftOfBatch.length - 2)).join(" ");
        }
      }

      // 5. Map trailing decimal columns: [O.MRP, N.MRP, RATE, DIS%, GST%, AMOUNT]
      let mrp = 0;
      let rate = 0;
      let gstRate = 5;

      if (decimals.length >= 6) {
        const oMrp = decimals[0];
        const nMrp = decimals[1];
        mrp = nMrp > 0 ? nMrp : oMrp;
        rate = decimals[2];
        gstRate = decimals[4];
      } else if (decimals.length === 5) {
        // Usually O.MRP (0.00) or DIS% (0.00) was skipped
        const first = decimals[0];
        const second = decimals[1];
        const third = decimals[2];
        if (first === 0) {
          mrp = second;
          rate = third;
        } else if (Math.abs(first - second) < 0.01 || first > second) {
          // O.MRP and N.MRP both present, DIS% skipped
          mrp = second > 0 ? second : first;
          rate = third;
        } else {
          mrp = first;
          rate = second;
        }
        gstRate = decimals[3];
      } else {
        // 3 or 4 decimals: [MRP, RATE, GST%, AMOUNT]
        mrp = decimals[0];
        rate = decimals[1] || decimals[0];
        gstRate = decimals[decimals.length - 2] || 5;
      }

      // Snap GST rate to valid Indian GST slabs (0, 5, 12, 18, 28)
      if (![0, 5, 12, 18, 28].includes(Math.round(gstRate))) {
        gstRate = 5;
      } else {
        gstRate = Math.round(gstRate);
      }

      // Clean up Medicine Name
      const cleanDescription = description
        .replace(/^[^a-zA-Z]+/, "") // Strip leading line noise
        .replace(/[^a-zA-Z0-9\s\-\.\/]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const cleanBatch = batchNo.replace(/[^a-zA-Z0-9\-]/g, "") || "BCH-01";

      if (cleanDescription.length >= 3 && (mrp > 0 || rate > 0)) {
        itemsList.push({
          description: cleanDescription.toUpperCase(),
          batchNo: cleanBatch.toUpperCase(),
          hsnCode,
          quantity,
          mrp: (mrp > 0 ? mrp : rate).toFixed(2),
          rate: (rate > 0 ? rate : mrp).toFixed(2),
          gstRate: String(gstRate),
          packSize: packSize.toUpperCase() || "10S",
          expDate: expDateISO,
        });
      }
    }

    setLoading(false);
    setProgress("");

    if (itemsList.length > 0) {
      setExtractedItems(itemsList);
      setShowReviewModal(true);
    } else {
      alert("No items could be automatically parsed. Please ensure the bill table is clear and well-lit.");
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

  const addBlankRow = () => {
    setExtractedItems([
      ...extractedItems,
      {
        description: "",
        batchNo: "BCH-01",
        hsnCode: "3004",
        quantity: "1",
        mrp: "0.00",
        rate: "0.00",
        gstRate: "5",
        packSize: "10S",
        expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
    ]);
  };

  return (
    <>
      {/* Upload / Camera Selection Modal */}
      <Modal
        isOpen={isOpen && !showReviewModal}
        onClose={() => {
          stopCamera();
          onClose();
        }}
        title="Scan Invoice / Bill"
      >
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
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Verify the extracted items below. Edit any field or add/remove rows before saving.
            </p>
            <button
              type="button"
              onClick={addBlankRow}
              className="flex items-center gap-1 text-xs font-semibold text-[#2a9d8f] hover:underline cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          <div className="space-y-3">
            {extractedItems.map((item, index) => (
              <div key={index} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 w-5">#{index + 1}</span>
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

                <div className="grid grid-cols-4 gap-2 text-xs">
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
                    <label className="text-zinc-500 font-medium">Pack</label>
                    <input
                      type="text"
                      value={item.packSize}
                      onChange={(e) => handleItemChange(index, "packSize", e.target.value)}
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
              disabled={extractedItems.length === 0}
              onClick={() => {
                onSaveAll(extractedItems);
                setShowReviewModal(false);
                onClose();
              }}
              className="w-full justify-center bg-[#2a9d8f] hover:bg-[#238276]"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Save All ({extractedItems.length}) to Inventory
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}