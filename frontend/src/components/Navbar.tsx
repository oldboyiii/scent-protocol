"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const GENESIS_CONTRACT_ADDRESS = "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";
const MFW_CONTRACT_ADDRESS = "0xBcF87E80C18CF5d0D8769703fDb891A16D279B50";

const GENESIS_ABI = [
  "function balanceOf(address owner) external view returns (uint256)"
];

const MFW_ABI = [
  "function balanceOf(address owner) external view returns (uint256)"
];

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
  
  const [hasGenesisBadge, setHasGenesisBadge] = useState(false);
  const [hasMFWBadge, setHasMFWBadge] = useState(false);

  useEffect(() => {
    async function checkBadges() {
      if (!address || !isConnected) {
        setHasGenesisBadge(false);
        setHasMFWBadge(false);
        return;
      }

      try {
        const w = window as any;
        if (!w.ethereum) return;
        
        const provider = new ethers.BrowserProvider(w.ethereum);

        try {
          const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
          const balance = await genesisContract.balanceOf(address);
          setHasGenesisBadge(Number(balance) > 0);
        } catch (error) {
          console.warn("Failed to check Genesis badge:", error);
        }

        try {
          const mfwContract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, provider);
          const balance = await mfwContract.balanceOf(address);
          setHasMFWBadge(Number(balance) > 0);
        } catch (error) {
          console.warn("Failed to check MFW badge:", error);
        }
      } catch (error) {
        console.warn("Wallet info check error:", error);
      }
    }

    checkBadges();
  }, [address, isConnected]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        <div className="flex-shrink-0">
          <Logo />
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Home</Link>
          <Link href="/collection" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Collection</Link>
          <Link href="/marketplace" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Marketplace</Link>
          <Link href="/gallery" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Gallery</Link>
          <Link href="/events" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Events</Link>
          <Link href="/about" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">About</Link>
          <Link href="/faq" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">FAQ</Link>
        </nav>

        <div className="flex-shrink-0 flex items-center gap-2">
          {isConnected && address && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
              {hasGenesisBadge && (
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/50" title="Genesis Holder">
                  <svg viewBox="0 0 24 16" className="w-2.5 h-1.5 text-amber-400">
                    <path d="M2 14 Q12 2 22 14" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              )}
              
              {hasMFWBadge && (
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/50" title="MFW 2026 Holder">
                  <svg className="w-2.5 h-2.5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="10" y="6" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
                    <path d="M8 9C8 9 7 11 7 13V20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20V13C17 11 16 9 16 9H8Z" fill="currentColor" opacity="0.6"/>
                    <path d="M10 12V19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
                  </svg>
                </div>
              )}
              
              <span className="text-[9px] text-emerald-400 font-semibold tracking-wide uppercase">
                {chain ? getNetworkName(chain.id, chain.name || "") : "Unknown"}
              </span>
            </div>
          )}
          
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
}
