// app/loading.tsx
import { BRAND_CONFIG } from "@/config/brand";

export default function Loading() {
  const { LogoIcon } = BRAND_CONFIG;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-14 h-14 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 animate-pulse shadow-sm">
          <LogoIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Loading workspace...
          </p>
          <p className="text-xs text-slate-500">
            Please wait while we prepare your clinical portal.
          </p>
        </div>
      </div>
    </div>
  );
}