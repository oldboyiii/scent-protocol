import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScentProtocol — Digital Perfume House",
  description: "Create unique AI-generated fragrances as NFTs. Built on Arc Network. USDC = gas. Sub-second finality.",
  openGraph: {
    title: "ScentProtocol — Digital Perfume House",
    description: "Create unique AI-generated fragrances as NFTs. Built on Arc Network.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScentProtocol — Digital Perfume House",
    description: "Create unique AI-generated fragrances as NFTs. Built on Arc Network.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <Navbar />
          <main className="pt-20">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
