import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";

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
      <body className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 min-h-screen text-white">
        <ToastProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
