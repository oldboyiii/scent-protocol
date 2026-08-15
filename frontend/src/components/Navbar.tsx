"use client";

import Logo from "./Logo";
import WalletButton from "./WalletButton";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Logo size={40} />
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Mint
          </Link>
          <Link 
            href="/collection" 
            className="text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Collection
          </Link>
          <Link 
            href="/gallery" 
            className="text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Gallery
          </Link>
          <ThemeToggle />
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
