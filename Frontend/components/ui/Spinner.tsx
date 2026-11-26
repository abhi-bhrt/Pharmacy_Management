// components/ui/Spinner.tsx
import React from "react";
import { BRAND_CONFIG } from "@/config/brand";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
}

export function Spinner({ size = "md", text = "Loading..." }: SpinnerProps) {
  const { LogoIcon } = BRAND_CONFIG;

  const dimensions = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4 bg-slate-100">
      <div className="flex flex-col items-center space-y-3">
        <div
          className={`rounded-sm bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center animate-pulse shadow-sm ${dimensions[size]}`}
        >
          <LogoIcon className="w-1/2 h-1/2" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}