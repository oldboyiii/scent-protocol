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

// Clean letter-based wallet icons (like most dApps use)
const WalletIcons = {
  metamask: (
    <svg viewBox="0 0 40 40" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#E2762B"/>
      <path d="M28 14 L24 12 L20 16 L16 12 L12 14 L10 18 L14 20 L12 26 L16 30 L20 32 L24 30 L28 26 L26 20 L30 18 Z" fill="white"/>
      <circle cx="17" cy="20" r="1.5" fill="#E2762B"/>
      <circle cx="23" cy="20" r="1.5" fill="#E2762B"/>
      <path d="M18 24 Q20 26 22 24" stroke="#E2762B" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  rabby: (
    <svg viewBox="0 0 40 40" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#8697FF"/>
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">R</text>
    </svg>
  ),
  coinbase: (
    <svg viewBox="0 0 40 40" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#0052FF"/>
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">C</text>
    </svg>
  ),
  trust: (
    <svg viewBox="0 0 40 40" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4 L6 10 L6 20 C6 28 12 34 20 36 C28 34 34 28 34 20 L34 10 Z" fill="#3375BB"/>
      <text x="20" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">T</text>
    </svg>
  ),
  okx: (
    <svg viewBox="0 0 40 40" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#000000"/>
      <text x="20" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">OKX</text>
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
