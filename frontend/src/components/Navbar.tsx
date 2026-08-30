"use client";

import Link from "next/link";
import Logo from "./Logo";
// Убрали импорт WalletButton, так как его нет

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LEFT: Original Logo Component */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* CENTER: Navigation Links - Perfectly Centered */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">
            Home
          </Link>
          <Link href="/collection" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">
            Collection
          </Link>
          <Link href="/marketplace" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">
            Marketplace
          </Link>
          <Link href="/gallery" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">
            Gallery
          </Link>
          <Link href="/about" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">
            About
          </Link>
          <Link href="/faq" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* RIGHT: Inline Wallet Button Placeholder */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {/* Если у тебя есть другой компонент для кошелька, замени этот div на него */}
          {/* Например: <ConnectButton /> из rainbowkit или web3modal */}
          <button className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             0x5Fed...20DA
          </button>
        </div>

      </div>
    </header>
  );
}
