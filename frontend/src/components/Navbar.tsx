"use client";

import Link from "next/link";
import Logo from "./Logo";
import WalletButton from "./WalletButton";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">
            Mint
          </Link>
          <Link href="/collection" className="text-sm text-white/70 hover:text-white transition-colors">
            Collection
          </Link>
          <Link href="/gallery" className="text-sm text-white/70 hover:text-white transition-colors">
            Gallery
          </Link>
          <Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/faq" className="text-sm text-white/70 hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

