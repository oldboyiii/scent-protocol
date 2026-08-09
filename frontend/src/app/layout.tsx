import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
