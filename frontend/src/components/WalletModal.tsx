"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  check: () => boolean;
}

// Correct Official SVG Icons
const WalletIcons = {
  metamask: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.062 5.5L24.5 3.5L16 8.5L7.5 3.5L4.938 5.5L2 10.5L6.5 14.5L4.5 21.5L9 26.5L16 29.5L23 26.5L27.5 21.5L25.5 14.5L30 10.5L27.062 5.5Z" fill="#E17726"/>
      <path d="M22.5 19.5L24 24L16 27L8 24L9.5 19.5L16 22L22.5 19.5Z" fill="#E27625"/>
      <path d="M11.5 13L9 19L16 21L16 16L11.5 13Z" fill="#E27625"/>
      <path d="M20.5 13L16 16L16 21L23 19L20.5 13Z" fill="#E27625"/>
      <path d="M16 10L14 13L16 14L18 13L16 10Z" fill="#E27625"/>
    </svg>
  ),
  rabby: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#8285EB"/>
      <path d="M16 10C12.686 10 10 12.686 10 16C10 19.314 12.686 22 16 22C19.314 22 22 19.314 22 16C22 12.686 19.314 10 16 10ZM16 20C13.791 20 12 18.209 12 16C12 13.791 13.791 12 16 12C18.209 12 20 13.791 20 16C20 18.209 18.209 20 16 20Z" fill="white"/>
      <circle cx="16" cy="16" r="2" fill="white"/>
    </svg>
  ),
  coinbase: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <path d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16C24 11.582 20.418 8 16 8ZM16 21C13.239 21 11 18.761 11 16C11 13.239 13.239 11 16 11C18.761 11 21 13.239 21 16C21 18.761 18.761 21 16 21Z" fill="white"/>
    </svg>
  ),
  trust: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L4 7V15C4 22.18 9.12 28.86 16 30C22.88 28.86 28 22.18 28 15V7L16 2Z" fill="#3375BB"/>
      <path d="M16 6L7 10V15C7 20.38 10.84 25.38 16 26.25C21.16 25.38 25 20.38 25 15V10L16 6Z" fill="white" fillOpacity="0.2"/>
      <path d="M16 9L9 12V15C9 19.03 11.88 22.78 16 23.43C20.12 22.78 23 19.03 23 15V12L16 9Z" fill="white"/>
    </svg>
  ),
  okx: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="black"/>
      <path d="M10 10H14V14H10V10Z" fill="white"/>
      <path d="M18 10H22V14H18V10Z" fill="white"/>
      <path d="M10 18H14V22H10V18Z" fill="white"/>
      <path d="M18 18H22V22H18V18Z" fill="white"/>
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
      return (
        w.ethereum?.isMetaMask ||
        (w.ethereum && !w.ethereum.isRabby && !w.ethereum.isCoinbaseWallet && !w.ethereum.isTrust)
      );
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
      return w.ethereum?.isCoinbaseWallet || w.coinbaseWalletExtension || w.coinbaseWallet;
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: WalletIcons.trust,
    check: () => {
      const w = window as any;
      return w.ethereum?.isTrust || w.trustwallet || w.trust;
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

      if (wallet.id === "coinbase" && (w.coinbaseWalletExtension || w.coinbaseWallet)) {
        rawProvider = w.coinbaseWalletExtension || w.coinbaseWallet;
      } else if (wallet.id === "okx" && (w.okxwallet || w.okxchain)) {
        rawProvider = w.okxwallet || w.okxchain;
      } else if (wallet.id === "trust" && (w.trustwallet || w.trust)) {
        rawProvider = w.trustwallet || w.trust;
      } else if (wallet.id === "rabby" && w.rabby) {
        rawProvider = w.rabby;
      } else {
        rawProvider = w.ethereum;
      }

      if (!rawProvider) {
        setError(`${wallet.name} not detected. Please install the extension.`);
        return;
      }

      const ethersProvider = new ethers.BrowserProvider(rawProvider);
      await ethersProvider.send("eth_requestAccounts", []);
      await connect(ethersProvider);
      onClose();
    } catch (e: any) {
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
                disabled={connecting === w.id}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                  ${detected 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30" 
                    : "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                  }
                  disabled:opacity-50
                `}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {w.icon}
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium block">{w.name}</span>
                  {!detected && <span className="text-white/30 text-xs">Not installed</span>}
                </div>
                {connecting === w.id && (
                  <span className="text-amber-400 text-xs font-medium">Connecting...</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center relative z-10 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
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
