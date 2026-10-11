"use client";

import Link from "next/link";
import Logo from "./Logo";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";

const getNetworkName = (chainId: number, networkName: string): string => {
  if (networkName.toLowerCase().includes("arc")) return "Arc Network";
  
  switch (chainId) {
    case 1: return "Ethereum Mainnet";
    case 11155111: return "Sepolia Testnet";
    case 5042: return "Arc Network";
    case 5043: return "Arc Testnet";
    default: return `Chain ${chainId}`;
  }
};

export default function Navbar() {
  const { address, isConnected, chain } = useAccount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LEFT: Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* CENTER: Navigation Links (Now perfectly centered) */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Home</Link>
          <Link href="/collection" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Collection</Link>
          <Link href="/marketplace" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Marketplace</Link>
          <Link href="/gallery" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Gallery</Link>
          <Link href="/events" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Events</Link>
          <Link href="/about" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">About</Link>
          <Link href="/faq" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">FAQ</Link>
        </nav>

        {/* RIGHT: Compact Wallet Button + Network */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {isConnected && address && chain && (
            <span className="hidden sm:block text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
              {getNetworkName(chain.id, chain.name || "")}
            </span>
          )}
          
          <ConnectKitButton.Custom>
            {({ show, isConnected, ensName, truncatedAddress }) => (
              <button 
                onClick={show}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-all"
              >
                {isConnected ? (ensName || truncatedAddress) : "Connect Wallet"}
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </div>
    </header>
  );
}
