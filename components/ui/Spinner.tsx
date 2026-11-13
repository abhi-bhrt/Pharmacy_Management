// components/ui/Spinner.tsx
import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
}

export function Spinner({ size = "sm", text = "Loading..." }: SpinnerProps) {
  const dimensions = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const spinnerElement = (
    <div className={`relative flex items-center justify-center ${dimensions[size]} animate-spin`}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[15%] h-[30%] bg-[#2a9d8f] rounded-full"
          style={{
            transform: `rotate(${i * 30}deg) translate(0, -130%)`,
            opacity: (i + 1) / 12,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4 bg-zinc-50">
      <div className="flex flex-col items-center space-y-4">
        {spinnerElement}
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-zinc-800">{text}</p>
        </div>
      </div>
    </div>
  );
}