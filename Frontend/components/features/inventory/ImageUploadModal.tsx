// components/features/inventory/ImageUploadModal.tsx
"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  Camera,
  Loader2,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  FileText,
  AlertCircle,
  ScanLine,
  Eye,
} from "lucide-react";
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

interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onSaveAll,
}: ImageUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [scanError, setScanError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMedicineItem[]>([]);
  const [rawOcrText, setRawOcrText] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultExpiry = () =>
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const resetAndClose = () => {
    stopCamera();
    setLoading(false);
    setProgress("");
    setScanError("");
    setExtractedItems([]);
    setRawOcrText("");
    setShowRawText(false);
    setShowReviewModal(false);
    onClose();
  };

  const startCamera = async () => {
    setScanError("");
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setScanError("Unable to access device camera. Please check browser permissions or upload an image file.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
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
            const file = new File([blob], "camera-capture.jpg", {
              type: "image/jpeg",
            });
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
   * Upscale and apply adaptive luminance contrast enhancement so small invoice
   * fonts read cleanly while removing faint background watermarks and shading.
   */
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const targetMinWidth = 2400;
        const scale =
          img.width < targetMinWidth
            ? Math.min(3, targetMinWidth / img.width)
            : 1.25;

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(url);
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Pixel-level grayscale + background watermark suppression
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Rec. 709 luminance
          const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          // Suppress light watermarks/paper tint (> 195 -> pure white) and sharpen dark ink (< 140)
          let adjusted: number;
          if (lum > 195) {
            adjusted = 255;
          } else if (lum < 115) {
            adjusted = Math.max(0, lum * 0.75);
          } else {
            adjusted = ((lum - 115) / 80) * 255;
          }
          data[i] = adjusted;
          data[i + 1] = adjusted;
          data[i + 2] = adjusted;
        }

        ctx.putImageData(imageData, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  };

  /**
   * Reconstruct horizontal invoice rows using word bounding boxes so columns
   * stay aligned on a single row even if the invoice photo is slightly tilted.
   */
  const reconstructRowsFromWords = (words: OcrWord[]): string[] => {
    if (!words || words.length === 0) return [];

    const sortedByY = [...words]
      .filter((w) => w.text && w.text.trim().length > 0)
      .sort((a, b) => a.bbox.y0 - b.bbox.y0);

    const rows: { centerY: number; height: number; words: OcrWord[] }[] = [];

    for (const word of sortedByY) {
      const wordHeight = Math.max(8, word.bbox.y1 - word.bbox.y0);
      const wordCenterY = (word.bbox.y0 + word.bbox.y1) / 2;

      const matchingRow = rows.find(
        (r) => Math.abs(r.centerY - wordCenterY) <= Math.max(r.height, wordHeight) * 0.55
      );

      if (matchingRow) {
        matchingRow.words.push(word);
        matchingRow.centerY =
          (matchingRow.centerY * (matchingRow.words.length - 1) + wordCenterY) /
          matchingRow.words.length;
      } else {
        rows.push({
          centerY: wordCenterY,
          height: wordHeight,
          words: [word],
        });
      }
    }

    return rows
      .sort((a, b) => a.centerY - b.centerY)
      .map((row) =>
        row.words
          .sort((a, b) => a.bbox.x0 - b.bbox.x0)
          .map((w) => w.text.trim())
          .join(" ")
      );
  };

  const processImageFile = async (file: File) => {
    setLoading(true);
    setScanError("");
    setProgress("Enhancing invoice resolution & contrast...");

    try {
      const processedDataUrl = await preprocessImage(file);
      const worker = await createWorker("eng");

      await worker.setParameters({
        tessedit_pageseg_mode: "6" as any,
        preserve_interword_spaces: "1",
      });

      setProgress("Extracting medicine table rows...");
      const ret = await worker.recognize(processedDataUrl);
      const text = ret.data.text || "";
      setRawOcrText(text);

      // Extract word bounding boxes if available for geometric row alignment
      const extractedWords: OcrWord[] = [];
      const blocks = (ret.data as any).blocks;
      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          for (const para of block.paragraphs || []) {
            for (const line of para.lines || []) {
              for (const word of line.words || []) {
                if (word.text && word.bbox) {
                  extractedWords.push({ text: word.text, bbox: word.bbox });
                }
              }
            }
          }
        }
      }

      await worker.terminate();

      const geometricLines = reconstructRowsFromWords(extractedWords);
      const fallbackLines = text.split("\n");
      const linesToParse = geometricLines.length >= 3 ? geometricLines : fallbackLines;

      parseInvoiceItems(linesToParse);
    } catch (err) {
      console.error("OCR Extraction failed:", err);
      setScanError("Failed to read text from image. Please try a clearer, well-lit photo.");
      setLoading(false);
    }
  };

  // Normalize common OCR letter-to-digit confusions inside numeric tokens
  const normalizeDigits = (str: string): string => {
    return str
      .replace(/[oOQD]/g, "0")
      .replace(/[iIl|!]/g, "1")
      .replace(/Z/g, "2")
      .replace(/S/g, "5")
      .replace(/B/g, "8");
  };

  // Convert expiry token ("11/26", "07/2027", "10-29", or "11127") into YYYY-MM-DD
  const parseExpiryToken = (token: string): string | null => {
    const cleaned = token.replace(/[^0-9a-zA-Z\/\-]/g, "");

    const sepMatch = cleaned.match(/^([0-9oOiIl]{1,2})[\/\-]([0-9oOiIlSB]{2,4})$/);
    if (sepMatch) {
      const m = parseInt(normalizeDigits(sepMatch[1]), 10);
      let y = parseInt(normalizeDigits(sepMatch[2]), 10);
      if (y < 100) y += 2000;
      if (m >= 1 && m <= 12 && y >= 2024 && y <= 2038) {
        return new Date(Date.UTC(y, m, 0)).toISOString().split("T")[0];
      }
    }

    const digitsOnly = normalizeDigits(cleaned).replace(/[^\d]/g, "");
    if (digitsOnly.length === 5 && digitsOnly[2] === "1") {
      const m = parseInt(digitsOnly.slice(0, 2), 10);
      const y = 2000 + parseInt(digitsOnly.slice(3, 5), 10);
      if (m >= 1 && m <= 12 && y >= 2024 && y <= 2038) {
        return new Date(Date.UTC(y, m, 0)).toISOString().split("T")[0];
      }
    }

    if (digitsOnly.length === 4) {
      const m2 = parseInt(digitsOnly.slice(0, 2), 10);
      const y2 = 2000 + parseInt(digitsOnly.slice(2, 4), 10);
      if (m2 >= 1 && m2 <= 12 && y2 >= 2024 && y2 <= 2038) {
        return new Date(Date.UTC(y2, m2, 0)).toISOString().split("T")[0];
      }
      if (digitsOnly[1] === "1") {
        const m1 = parseInt(digitsOnly[0], 10);
        const y1 = 2000 + parseInt(digitsOnly.slice(2, 4), 10);
        if (m1 >= 1 && m1 <= 9 && y1 >= 2024 && y1 <= 2038) {
          return new Date(Date.UTC(y1, m1, 0)).toISOString().split("T")[0];
        }
      }
    }

    return null;
  };

  // Detect 4-to-8 digit pharma/healthcare HSN codes (3004, 3003, 2106, 9018, 3304, etc.)
  const extractHsnCode = (token: string): string | null => {
    const clean = token.replace(/[^a-zA-Z0-9]/g, "");
    if (clean.length !== 4 && clean.length !== 6 && clean.length !== 8) return null;
    const norm = normalizeDigits(clean);
    if (/^(300\d|30\d\d|210\d|21\d\d|621\d|901\d|902\d|330\d|340\d|380\d|401\d)(\d{2}|\d{4})?$/.test(norm)) {
      return norm;
    }
    return null;
  };

  // Convert QTY.+FREE token ("10+1", "10 + 2", "6", "5.0") into integer quantity
  const parseQtyToken = (rawQty: string): string => {
    if (!rawQty) return "1";
    const plusMatch = rawQty.match(/(\d*\.?\d+)\s*\+\s*(\d*\.?\d+)/);
    if (plusMatch) {
      const q1 = parseFloat(plusMatch[1]) || 0;
      const q2 = parseFloat(plusMatch[2]) || 0;
      const sum = Math.round(q1 + q2);
      return sum > 0 ? String(sum) : "1";
    }
    const norm = normalizeDigits(rawQty);
    const numMatch = norm.match(/^\d+(\.\d+)?$/);
    if (numMatch) {
      const val = Math.round(parseFloat(numMatch[0]));
      return val > 0 ? String(val) : "1";
    }
    const anyNum = norm.match(/\d+/);
    return anyNum && parseInt(anyNum[0], 10) > 0 ? anyNum[0] : "1";
  };

  // Extract decimal prices from the right side of the row (supports 1 or 2 decimal places)
  const extractTrailingDecimals = (str: string): number[] => {
    const normalized = str
      .replace(/(\d)\s*[\.,]\s*(\d{1,2})\b/g, "$1.$2")
      .replace(/[oO](\.\d{1,2})\b/g, "0$1");

    const matches = normalized.match(/\b\d+\.\d{1,2}\b/g);
    return matches ? matches.map((m) => parseFloat(m)) : [];
  };

  const parseInvoiceItems = (rawLinesInput: string[]) => {
    const rawLines = rawLinesInput
      .map((l) =>
        l
          .replace(/[|¦!\[\]{}_~«»"“”‘’]/g, " ")
          .replace(/(\d)\s*\+\s*(\d)/g, "$1+$2") // Join "10 + 1" -> "10+1"
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((l) => l.length > 10);

    const itemsList: ExtractedMedicineItem[] = [];
    const defaultExpiry = getDefaultExpiry();

    for (const line of rawLines) {
      // 1. Skip non-item header, tax summary, bank, and footer lines
      if (
        /gst\s*invoice|tax\s*invoice|d\.?l\.?\s*no|gstin|invoice\s*no|description.*hsn|particulars.*batch|sub\s*total|grand\s*total|net\s*amount|sgst\s*taxable|cgst\s*taxable|total\s*item|state\s*bank|ifsc\s*code|thousand|rupees\s*only|authorised\s*sign|erp\s*to\s*erp|marg\s*erp|personally\s*trusted/i.test(
          line
        )
      ) {
        continue;
      }

      const decimals = extractTrailingDecimals(line);
      if (decimals.length < 2) continue;

      const tokens = line.split(" ");
      if (tokens.length < 4) continue;

      // Strip leading serial number if present (e.g. "1.", "01", "2)")
      if (/^\d{1,3}[\.\)]?$/.test(tokens[0])) {
        tokens.shift();
      }

      // 2. Locate HSN Code index to cleanly isolate the Medicine Name on the left
      let hsnIdx = -1;
      let hsnCode = "3004";
      for (let i = 1; i < Math.min(tokens.length - 3, 9); i++) {
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
      const searchStart = Math.min(tokens.length - 2, tokens.length - 1);
      const searchFloor = hsnIdx !== -1 ? hsnIdx + 1 : 1;

      for (let i = searchStart; i >= searchFloor; i--) {
        if (/^\d+\.\d{1,2}$/.test(tokens[i])) continue;
        const parsedExp = parseExpiryToken(tokens[i]);
        if (parsedExp) {
          expIdx = i;
          expDateISO = parsedExp;
          break;
        }
      }

      let description = "";
      let packSize = "10S";
      let quantity = "1";
      let batchNo = "BCH-01";

      let firstPriceIdx = tokens.findIndex(
        (t, idx) =>
          idx > (hsnIdx !== -1 ? hsnIdx : 0) &&
          /^\d+\.\d{1,2}$/.test(t.replace(/,/g, "."))
      );
      if (firstPriceIdx === -1) {
        firstPriceIdx = Math.max(2, tokens.length - decimals.length);
      }

      if (expIdx === -1) {
        expIdx = Math.max(firstPriceIdx - 1, (hsnIdx !== -1 ? hsnIdx : 0) + 2);
        const fallbackExp = parseExpiryToken(tokens[expIdx] || "");
        if (fallbackExp) expDateISO = fallbackExp;
      }

      // Batch is the token immediately before Expiry (if it is not a pure price)
      if (
        expIdx - 1 > (hsnIdx !== -1 ? hsnIdx : 0) &&
        !/^\d+\.\d{2}$/.test(tokens[expIdx - 1])
      ) {
        batchNo = tokens[expIdx - 1];
      }

      if (hsnIdx !== -1) {
        description = tokens.slice(0, hsnIdx).join(" ");

        const middleTokens = tokens.slice(
          hsnIdx + 1,
          Math.max(hsnIdx + 1, expIdx - 1)
        );
        if (middleTokens.length >= 2) {
          quantity = parseQtyToken(middleTokens[middleTokens.length - 1]);
          packSize = middleTokens.slice(0, -1).join(" ");
        } else if (middleTokens.length === 1) {
          const single = middleTokens[0];
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
        const leftOfBatch = tokens.slice(0, Math.max(1, expIdx - 1));
        const packIdx = leftOfBatch.findIndex(
          (t, idx) =>
            idx >= 1 &&
            /^(\d+\s*(ML|GM|MG|G|S|T|TAB|CAP)|\d+[\*X]\d+|\d+GM\/\d+)$/i.test(t)
        );

        if (packIdx !== -1) {
          const possibleHsnIdx =
            packIdx >= 2 && leftOfBatch[packIdx - 1].length === 4
              ? packIdx - 1
              : packIdx;
          description = leftOfBatch.slice(0, possibleHsnIdx).join(" ");
          const mid = leftOfBatch.slice(packIdx);
          if (mid.length >= 2) {
            quantity = parseQtyToken(mid[mid.length - 1]);
            packSize = mid.slice(0, -1).join(" ");
          } else {
            packSize = mid[0] || "10S";
          }
        } else if (leftOfBatch.length >= 3) {
          quantity = parseQtyToken(leftOfBatch[leftOfBatch.length - 1]);
          packSize = leftOfBatch[leftOfBatch.length - 2];
          description = leftOfBatch.slice(0, -2).join(" ");
        } else {
          description = leftOfBatch.join(" ");
        }
      }

      // 4. Map trailing decimal columns: [O.MRP, N.MRP, RATE, DIS%, GST%, AMOUNT]
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
        const first = decimals[0];
        const second = decimals[1];
        const third = decimals[2];
        if (first === 0) {
          mrp = second;
          rate = third;
        } else if (Math.abs(first - second) < 0.01 || first > second) {
          mrp = second > 0 ? second : first;
          rate = third;
        } else {
          mrp = first;
          rate = second;
        }
        gstRate = decimals[3];
      } else if (decimals.length >= 3) {
        mrp = decimals[0];
        rate = decimals[1] || decimals[0];
        gstRate = decimals[decimals.length - 2] || 5;
      } else {
        mrp = decimals[0];
        rate = decimals[1] || decimals[0];
      }

      // Ensure MRP >= Rate if columns were swapped on a discounted line
      if (mrp > 0 && rate > mrp && rate < mrp * 1.5) {
        const temp = mrp;
        mrp = rate;
        rate = temp;
      }

      // Snap GST rate to valid Indian pharma GST slabs (0, 5, 12, 18, 28)
      const roundedGst = Math.round(gstRate);
      gstRate = [0, 5, 12, 18, 28].includes(roundedGst) ? roundedGst : 5;

      const cleanDescription = description
        .replace(/^[^a-zA-Z]+/, "")
        .replace(/[^a-zA-Z0-9\s\-\.\/\+]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const cleanBatch =
        batchNo.replace(/[^a-zA-Z0-9\-\/]/g, "").toUpperCase() || "BCH-01";

      if (cleanDescription.length >= 2 && (mrp > 0 || rate > 0)) {
        itemsList.push({
          description: cleanDescription.toUpperCase(),
          batchNo: cleanBatch,
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
      // Open review modal with one blank row + raw OCR text viewer so user is never stuck
      setScanError(
        "Could not auto-detect table rows cleanly. Review the raw scanned text below or add rows manually."
      );
      setExtractedItems([
        {
          description: "",
          batchNo: "BCH-01",
          hsnCode: "3004",
          quantity: "1",
          mrp: "0.00",
          rate: "0.00",
          gstRate: "5",
          packSize: "10S",
          expDate: defaultExpiry,
        },
      ]);
      setShowRawText(true);
      setShowReviewModal(true);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof ExtractedMedicineItem,
    value: string
  ) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addBlankRow = () => {
    setExtractedItems((prev) => [
      ...prev,
      {
        description: "",
        batchNo: "BCH-01",
        hsnCode: "3004",
        quantity: "1",
        mrp: "0.00",
        rate: "0.00",
        gstRate: "5",
        packSize: "10S",
        expDate: getDefaultExpiry(),
      },
    ]);
  };

  const handleConfirmSaveAll = () => {
    const validItems = extractedItems.filter(
      (item) => item.description.trim().length > 0
    );
    if (validItems.length === 0) {
      setScanError("Please enter a medicine description for at least one row before saving.");
      return;
    }
    onSaveAll(validItems);
    resetAndClose();
  };

  return (
    <>
      {/* Step 1: Upload / Camera Selection Modal */}
      <Modal
        isOpen={isOpen && !showReviewModal}
        onClose={resetAndClose}
        title="Scan Wholesale Bill / Invoice"
      >
        <div className="space-y-4">
          {scanError && (
            <div className="px-3.5 py-2.5 rounded-sm bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 bg-slate-50 border border-slate-200 rounded-sm">
              <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {progress}
              </p>
              <p className="text-[11px] text-slate-500">
                Analyzing columns: Description, Batch, HSN, Pack, Qty, MRP, Rate & Expiry
              </p>
            </div>
          ) : isCameraActive ? (
            <div className="space-y-3">
              <div className="relative rounded-sm overflow-hidden bg-slate-950 border border-slate-300 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2.5">
                <Button onClick={captureImage} className="w-full justify-center">
                  Capture Invoice Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  className="w-full justify-center"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Upload a clear photo or scan of a distributor GST invoice to automatically extract medicine rows into your inventory.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-400 rounded-sm bg-slate-50 hover:border-teal-700 hover:bg-teal-50/40 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-sm bg-white border border-slate-300 text-teal-700 flex items-center justify-center mb-2.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Upload Invoice Image
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    PNG, JPG, JPEG, WEBP
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-400 rounded-sm bg-slate-50 hover:border-teal-700 hover:bg-teal-50/40 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-sm bg-white border border-slate-300 text-teal-700 flex items-center justify-center mb-2.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Use Live Camera
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Capture physical bill
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Step 2: Full-Width Tabular Review & Edit Modal */}
      {isOpen && showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6">
          <div className="bg-white rounded-sm shadow-xl border border-slate-300 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Dark Slate Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
                  <ScanLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                    Review Extracted Medicines ({extractedItems.length} Rows)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Verify quantities, batch numbers, MRP, rate, and expiry dates before importing to stock
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                aria-label="Close review modal"
                className="text-slate-400 hover:text-white p-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar & Optional Raw OCR Text Drawer */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addBlankRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>

                {rawOcrText && (
                  <button
                    type="button"
                    onClick={() => setShowRawText((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-700" />
                    <span>{showRawText ? "Hide Raw OCR Text" : "View Raw OCR Text"}</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-500">
                * Blank description rows will be skipped automatically
              </span>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {scanError && (
                <div className="px-3.5 py-2.5 rounded-sm bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{scanError}</span>
                </div>
              )}

              {showRawText && rawOcrText && (
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-sm border border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raw Scanned Invoice Text (Reference)</span>
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap max-h-36 overflow-y-auto text-slate-300 leading-relaxed">
                    {rawOcrText}
                  </pre>
                </div>
              )}

              {/* Structured Editable Spreadsheet Table */}
              <div className="border border-slate-300 rounded-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[920px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-2.5 w-8">#</th>
                      <th className="py-2.5 px-2.5 min-w-[220px]">Medicine Description *</th>
                      <th className="py-2.5 px-2 w-28">Batch No *</th>
                      <th className="py-2.5 px-2 w-20">HSN *</th>
                      <th className="py-2.5 px-2 w-20">Pack *</th>
                      <th className="py-2.5 px-2 w-20">Qty *</th>
                      <th className="py-2.5 px-2 w-24">MRP (₹) *</th>
                      <th className="py-2.5 px-2 w-24">Rate (₹) *</th>
                      <th className="py-2.5 px-2 w-20">GST %</th>
                      <th className="py-2.5 px-2 w-32">Expiry *</th>
                      <th className="py-2.5 px-2 w-10 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {extractedItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="py-10 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          No rows in list. Click &ldquo;Add Row&rdquo; above to add medicines manually.
                        </td>
                      </tr>
                    ) : (
                      extractedItems.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-mono font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-2 px-2.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(index, "description", e.target.value)
                              }
                              placeholder="e.g. DOLO 650MG TAB"
                              className="w-full px-2 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.batchNo}
                              onChange={(e) =>
                                handleItemChange(index, "batchNo", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.hsnCode}
                              onChange={(e) =>
                                handleItemChange(index, "hsnCode", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.packSize}
                              onChange={(e) =>
                                handleItemChange(index, "packSize", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.mrp}
                              onChange={(e) =>
                                handleItemChange(index, "mrp", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(index, "rate", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.gstRate}
                              onChange={(e) =>
                                handleItemChange(index, "gstRate", e.target.value)
                              }
                              className="w-full px-1.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="date"
                              value={item.expDate}
                              onChange={(e) =>
                                handleItemChange(index, "expDate", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-[11px] text-slate-900 bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              aria-label={`Remove row ${index + 1}`}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors cursor-pointer"
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

            {/* Footer Action Bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={extractedItems.length === 0}
                onClick={handleConfirmSaveAll}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Save All ({extractedItems.length}) to Inventory
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}