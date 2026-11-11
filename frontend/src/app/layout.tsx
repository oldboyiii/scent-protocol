// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import Atmosphere from "@/components/Atmosphere";
import { Cormorant_Garamond } from "next/font/google";
import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Refined serif for headings only. Body text stays Inter (set in globals.css).
const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Dynamic import for Providers with SSR completely disabled.
// We map the named export 'Providers' to 'default' to satisfy Next.js dynamic import requirements.
const Providers = dynamic(
  () => import("@/components/Providers").then((mod) => ({ default: mod.Providers })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading Web3...
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "ScentProtocol — AI Perfume House",
  description: "Create unique AI-generated fragrances. Built on Arc.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={display.variable}>
      <body className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 min-h-screen text-white relative">
        <Providers>
          <ToastProvider>
            <Atmosphere />
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 pt-20 pb-8 relative z-10">
              {children}
            </main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
