"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  check: () => boolean;
}

// Official SVG icons from trusted sources
const WalletIcons = {
  // Official MetaMask icon - from MetaMask extension source
  metamask: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 318.6 318.6" className="w-8 h-8">
      <style>{`.st1,.st6{fill:#e4761b;stroke:#e4761b;stroke-linecap:round;stroke-linejoin:round}.st6{fill:#f6851b;stroke:#f6851b}`}</style>
      <path fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round" d="m274.1 35.5-99.5 73.9L193 65.8z"/>
      <path d="m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z" className="st1"/>
      <path d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z" className="st1"/>
      <path fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z"/>
      <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z"/>
      <path fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
      <path fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" d="m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9-4.3 16.7 1.9-27.6zm-11.3 33.1 4.3 11.1 6.4-17.5-1.9-27.6zm27.9-27.6 6.8 17.5 4.5-11.1-2.4-28.8z" className="st1"/>
      <path fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" d="m170.2 246.6-10 7.9 26.5 7.4 2.4-9.3z"/>
      <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="m176.5 244.1 4.5 15.3 2.3-18.1z"/>
      <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="M198.4 219.7 174.7 218l2.5 23.1 3.6-22.2z"/>
    </svg>
  ),

  // Official Rabby icon - from @web3icons/react [citation:7][citation:12]
  rabby: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="96" fill="#8285EB"/>
      <path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm0 208c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z" fill="white"/>
      <circle cx="256" cy="256" r="40" fill="#8285EB"/>
    </svg>
  ),

  // Official Coinbase icon - from Coinbase Wallet SDK [citation:3][citation:13]
  coinbase: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#0052FF"/>
      <path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm64 144h-128v-32h128v32z" fill="white"/>
    </svg>
  ),

  // Official Trust Wallet icon [citation:4][citation:9]
  trust: (
    <svg viewBox="0 0 444 501" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.710022 72.41L222.16 0.109985V500.63C63.98 433.89 0.710022 305.98 0.710022 233.69V72.41Z" fill="#0500FF"/>
      <path d="M443.62 72.41L222.17 0.109985V500.63C380.35 433.89 443.62 305.98 443.62 233.69V72.41Z" fill="url(#trustGradient)"/>
      <defs>
        <linearGradient id="trustGradient" x1="385.26" y1="-34.78" x2="216.61" y2="493.5" gradientUnits="userSpaceOnUse">
          <stop offset="0.02" stopColor="#0000FF"/>
          <stop offset="0.08" stopColor="#0094FF"/>
          <stop offset="0.16" stopColor="#48FF91"/>
          <stop offset="0.42" stopColor="#0094FF"/>
          <stop offset="0.68" stopColor="#0038FF"/>
          <stop offset="0.9" stopColor="#0500FF"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // Official OKX icon [citation:5]
  okx: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="96" fill="#000000"/>
      <path d="M160 160h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M288 160h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M160 288h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M288 288h64v64h-64v-64z" fill="#FFFFFF"/>
    </svg>
  ),
};

const wallets: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: WalletIcons.metamask,
    check: () => {
      const w = window as any;
      return w.ethereum?.isMetaMask && !w.ethereum?.isRabby;
    },
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: WalletIcons.rabby,
    check: () => {
      const w = window as any;
      return w.ethereum?.isRabby || w.rabby;
    },
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: WalletIcons.coinbase,
    check: () => {
      const w = window as any;
      return w.ethereum?.isCoinbaseWallet || w.coinbaseWalletExtension;
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: WalletIcons.trust,
    check: () => {
      const w = window as any;
      return w.ethereum?.isTrust || w.trustwallet;
    },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: WalletIcons.okx,
    check: () => {
      const w = window as any;
      return w.okxwallet || w.okxchain;
    },
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: Props) {
  const { connect } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (wallet: WalletOption) => {
    setConnecting(wallet.id);
    setError(null);
    try {
      const w = window as any;
      let rawProvider: any;

      switch (wallet.id) {
        case "coinbase":
          rawProvider = w.coinbaseWalletExtension || w.coinbaseWallet;
          break;
        case "okx":
          rawProvider = w.okxwallet || w.okxchain;
          break;
        case "trust":
          rawProvider = w.trustwallet || w.trust;
          break;
        case "rabby":
          rawProvider = w.rabby;
          break;
        default:
          rawProvider = w.ethereum;
      }

      if (!rawProvider) {
        const installLinks: Record<string, string> = {
          metamask: "https://metamask.io/download/",
          rabby: "https://rabby.io/",
          coinbase: "https://www.coinbase.com/wallet/download",
          trust: "https://trustwallet.com/download",
          okx: "https://www.okx.com/web3",
        };
        
        const link = installLinks[wallet.id];
        setError(
          `${wallet.name} not detected. ${link ? `Please install: ${link}` : "Please install the extension."}`
        );
        return;
      }

      const ethersProvider = new ethers.BrowserProvider(rawProvider);
      await ethersProvider.send("eth_requestAccounts", []);
      await connect(ethersProvider);
      onClose();
    } catch (e: any) {
      console.error("Connection error:", e);
      setError(e.message || "Connection failed");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-sm mx-4 p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <h3 className="text-xl font-bold text-white mb-1 relative z-10">Connect Wallet</h3>
        <p className="text-white/40 text-sm mb-5 relative z-10">Choose your wallet to continue</p>

        <div className="space-y-2 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar">
          {wallets.map((w) => {
            const detected = w.check();
            return (
              <button
                key={w.id}
                onClick={() => handleConnect(w)}
                disabled={connecting === w.id || !detected}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                  ${detected 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30" 
                    : "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {w.icon}
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium block">{w.name}</span>
                  {!detected && (
                    <span className="text-white/30 text-xs">Not installed</span>
                  )}
                </div>
                {connecting === w.id && (
                  <span className="text-amber-400 text-xs font-medium animate-pulse">
                    Connecting...
                  </span>
                )}
                {detected && connecting !== w.id && (
                  <span className="text-green-400 text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center relative z-10 bg-red-500/10 py-2 rounded-lg border border-red-500/20 break-all">
            {error}
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 text-white/40 hover:text-white text-sm font-medium transition-colors relative z-10 rounded-lg hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
