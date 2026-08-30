"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  check: () => boolean;
}

const wallets: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    check: () => {
      const e = (window as any).ethereum;
      return e && e.isMetaMask && !e.isCoinbaseWallet && !e.isRabby;
    },
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: "🦝",
    check: () => {
      const e = (window as any).ethereum;
      return e && e.isRabby;
    },
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🅒",
    check: () => {
      const e = (window as any).ethereum;
      return (e && e.isCoinbaseWallet) || !!(window as any).coinbaseWalletExtension;
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🔵",
    check: () => {
      const e = (window as any).ethereum;
      return e && e.isTrust;
    },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "🅞",
    check: () => !!(window as any).okxwallet,
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
      let rawProvider: any;

      if (wallet.id === "coinbase" && (window as any).coinbaseWalletExtension) {
        rawProvider = (window as any).coinbaseWalletExtension;
      } else if (wallet.id === "okx" && (window as any).okxwallet) {
        rawProvider = (window as any).okxwallet;
      } else {
        rawProvider = (window as any).ethereum;
      }

      if (!rawProvider) {
        setError(`${wallet.name} not detected. Install the extension.`);
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
        {/* Shine */}
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
                <span className="text-2xl">{w.icon}</span>
                <div className="flex-1">
                  <span className="text-white font-medium block">{w.name}</span>
                  {!detected && <span className="text-white/30 text-xs">Not installed</span>}
                </div>
                {connecting === w.id && (
                  <span className="text-amber-400 text-xs">Connecting...</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-3 text-red-400 text-sm text-center relative z-10">{error}</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-white/40 hover:text-white text-sm transition-colors relative z-10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
