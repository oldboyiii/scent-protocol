"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import WalletModal from "./WalletModal";

export default function Navbar() {
  const { address, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-400 font-bold text-lg hover:text-amber-300 transition-colors">
            <span className="text-xl">🜂</span>
            <span>ScentProtocol</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors hidden sm:block">Home</Link>
            <Link href="/collection" className="text-white/60 hover:text-white text-sm transition-colors">Collection</Link>
            <Link href="/marketplace" className="text-white/60 hover:text-amber-400 text-sm transition-colors font-medium">Marketplace</Link>
            <Link href="/gallery" className="text-white/60 hover:text-white text-sm transition-colors hidden md:block">Gallery</Link>
            <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors hidden md:block">About</Link>
            <Link href="/faq" className="text-white/60 hover:text-white text-sm transition-colors hidden md:block">FAQ</Link>

            {address ? (
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs font-mono hidden md:inline">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10 transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>

      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
