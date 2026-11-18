// components/ui/Modal.tsx
import React from "react";
import { X } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { LogoIcon } = BRAND_CONFIG;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
      <div className="bg-white rounded-sm shadow-lg border border-slate-300 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-teal-600 flex items-center justify-center text-white shrink-0">
              <LogoIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
}