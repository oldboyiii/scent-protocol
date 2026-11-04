// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import Atmosphere from "@/components/Atmosphere";
import dynamic from "next/dynamic";

// Динамический импорт Providers с полным отключением серверного рендеринга (SSR)
// Это гарантированно предотвращает ошибки "indexedDB is not defined" при сборке на Vercel
const Providers = dynamic(() => import("@/components/Providers"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      Loading Web3...
    </div>
  ),
});

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
        {/* Providers теперь загружается только на клиенте */}
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
