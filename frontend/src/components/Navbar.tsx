"use client";

import Logo from "./Logo";
import WalletButton from "./WalletButton";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Logo size={40} />
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-gray-700 hover:text-amber-500 transition-colors"
          >
            Mint
          </Link>
          <Link 
            href="/collection" 
            className="text-sm font-medium text-gray-700 hover:text-amber-500 transition-colors"
          >
            Collection
          </Link>
          <Link 
            href="/gallery" 
            className="text-sm font-medium text-gray-700 hover:text-amber-500 transition-colors"
          >
            Gallery
          </Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
