"use client";

import Logo from "./Logo";
import WalletButton from "./WalletButton";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md overflow-visible">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 overflow-visible">
        <Logo size={40} />
        
        <nav className="flex items-center gap-6 overflow-visible">
          <Link 
            href="/" 
            className="text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors"
          >
            Mint
          </Link>
          <Link 
            href="/collection" 
            className="text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors"
          >
            Collection
          </Link>
          <Link 
            href="/gallery" 
            className="text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors"
          >
            Gallery
          </Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
