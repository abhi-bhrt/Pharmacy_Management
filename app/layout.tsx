// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import AuthProvider from "@/components/providers/AuthProvider";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  title: `${BRAND_CONFIG.name} - ${BRAND_CONFIG.tagline}`,
  description: BRAND_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="bg-slate-100 min-h-screen text-slate-900 antialiased selection:bg-teal-700 selection:text-white"
        suppressHydrationWarning
      >
        <ConfirmProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}