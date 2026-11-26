// components/ui/Button.tsx
import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold uppercase tracking-wider transition-colors rounded-sm focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

  const variants = {
    primary:
      "bg-teal-700 hover:bg-teal-800 text-white border border-teal-800 shadow-sm",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 shadow-sm",
    danger:
      "bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-sm",
    outline:
      "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm",
  };

  const sizes = {
    sm: "text-[11px] px-3 py-1.5 gap-1.5",
    md: "text-xs px-4 py-2 gap-2",
    lg: "text-xs sm:text-sm px-6 py-2.5 gap-2",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {children}
    </button>
  );
}