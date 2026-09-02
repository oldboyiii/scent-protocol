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

// Clean, high-contrast SVG icons optimized for 32x32px display
const WalletIcons = {
  metamask: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      {/* Main head shape */}
      <path d="M27 6L24.5 4L16 9L7.5 4L5 6L2 11L6.5 15L4.5 22L9 27L16 30L23 27L27.5 22L25.5 15L30 11L27 6Z" fill="#E17726"/>
      {/* Inner face details (lighter for contrast) */}
      <path d="M16 11L14 14L16 15L18 14L16 11Z" fill="#F5A623"/>
      <path d="M11.5 14L9 20L16 22L16 17L11.5 14Z" fill="#F5A623"/>
      <path d="M20.5 14L16 17L16 22L23 20L20.5 14Z" fill="#F5A623"/>
      {/* Eyes (larger, clearly visible) */}
      <circle cx="13" cy="16" r="1.5" fill="#1A1A1A"/>
      <circle cx="19" cy="16" r="1.5" fill="#1A1A1A"/>
      {/* Nose */}
      <path d="M15 19L16 20L17 19L16 21L15 19Z" fill="#1A1A1A"/>
    </svg>
  ),
  
  rabby: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="16" cy="16" r="16" fill="#8697FF"/>
      {/* Rabbit face (solid white) */}
      <path d="M16 9C11.5 9 8 12.5 8 17C8 21.5 11.5 25 16 25C20.5 25 24 21.5 24 17C24 12.5 20.5 9 16 9Z" fill="white"/>
      {/* Ears (solid white) */}
      <ellipse cx="12" cy="10" rx="2.5" ry="4" fill="white" transform="rotate(-15 12 10)"/>
      <ellipse cx="20" cy="10" rx="2.5" ry="4" fill="white" transform="rotate(15 20 10)"/>
      {/* Eyes */}
      <circle cx="13.5" cy="16" r="1.5" fill="#8697FF"/>
      <circle cx="18.5" cy="16" r="1.5" fill="#8697FF"/>
      {/* Nose */}
      <path d="M15 19L16 20L17 19Z" fill="#8697FF"/>
    </svg>
  ),

  coinbase: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <path d="M16 8C11.58 8 8 11.58 8 16C8 20.42 11.58 24 16 24C20.42 24 24 20.42 24 16C24 11.58 20.42 8 16 8ZM16 21C13.24 21 11 18.76 11 16C11 13.24 13.24 11 16 11C18.76 11 21 13.24 21 16C21 18.76 18.76 21 16 21Z" fill="white"/>
    </svg>
  ),

  trust: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L4 7V15C4 22.18 9.12 28.86 16 30C22.88 28.86 28 22.18 28 15V7L16 2Z" fill="#3375BB"/>
      <path d="M16 9L9 12V17C9 21 11.5 24 16 25C20.5 24 23 21 23 17V12L16 9Z" fill="white"/>
    </svg>
  ),

  okx: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#000000"/>
      <rect x="8" y="8" width="6" height="6" fill="#FFFFFF"/>
      <rect x="18" y="8" width="6" height="6" fill="#FFFFFF"/>
      <rect x="8" y="18" width="6" height="6" fill="#FFFFFF"/>
      <rect x="18" y="18" width="6" height="6" fill="#FFFFFF"/>
    </svg>
  )
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

        <div className="space-y-2 relative z-10">
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
