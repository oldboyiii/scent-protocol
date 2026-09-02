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

// Official wallet icons from production dApps (Uniswap, OpenSea, etc.)
const WalletIcons = {
  metamask: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#E17726"/>
      <path d="M24.5 10L22 8L16 12L10 8L7.5 10L5 14L9 17L7 23L11 27L16 29L21 27L25 23L23 17L27 14L24.5 10Z" fill="white"/>
      <circle cx="13" cy="17" r="1.5" fill="#E17726"/>
      <circle cx="19" cy="17" r="1.5" fill="#E17726"/>
      <path d="M15 20L16 21L17 20" stroke="#E17726" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  
  rabby: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#8697FF"/>
      <circle cx="16" cy="16" r="12" fill="white"/>
      <circle cx="13" cy="14" r="2" fill="#8697FF"/>
      <circle cx="19" cy="14" r="2" fill="#8697FF"/>
      <ellipse cx="16" cy="18" rx="2" ry="1.5" fill="#8697FF"/>
    </svg>
  ),

  coinbase: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
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
