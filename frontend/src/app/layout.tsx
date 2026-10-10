// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import { Providers } from "@/components/Providers";
import Atmosphere from "@/components/Atmosphere";

export const metadata: Metadata = {
  title: "ScentProtocol — AI Perfume House",
  description: "Create unique AI-generated fragrances. Built on Arc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 min-h-screen text-white relative">
        {/* Providers wraps the entire app: wagmi + ConnectKit + React Query */}
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
