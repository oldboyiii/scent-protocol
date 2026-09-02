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

// Simple but recognizable wallet icons
const WalletIcons = {
  metamask: (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
      🦊
    </div>
  ),
  rabby: (
    <div className="w-8 h-8 rounded-full bg-[#8285EB] flex items-center justify-center text-white font-bold text-xs">
      R
    </div>
  ),
  coinbase: (
    <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-xs">
      C
    </div>
  ),
  trust: (
    <div className="w-8 h-8 rounded-full bg-[#3375BB] flex items-center justify-center text-white font-bold text-xs">
      T
    </div>
  ),
  okx: (
    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
      OKX
    </div>
  ),
  phantom: (
    <div className="w-8 h-8 rounded-full bg-[#AB9FF2] flex items-center justify-center text-white font-bold text-xs">
      P
    </div>
  ),
  ledger: (
    <div className="w-8 h-8 rounded-full bg-[#0F0F0F] flex items-center justify-center text-white font-bold text-xs">
      L
    </div>
  ),
  walletconnect: (
    <div className="w-8 h-8 rounded-full bg-[#3B99FC] flex items-center justify-center text-white font-bold text-xs">
      WC
    </div>
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
  {
    id: "phantom",
    name: "Phantom",
    icon: WalletIcons.phantom,
    check: () => {
      const w = window as any;
      return w.phantom?.ethereum || w.phantom;
    },
  },
  {
    id: "ledger",
    name: "Ledger",
    icon: WalletIcons.ledger,
    check: () => {
      const w = window as any;
      return w.ethereum?.isLedger;
    },
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: WalletIcons.walletconnect,
    check: () => {
      return true;
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
        case "phantom":
          rawProvider = w.phantom?.ethereum || w.phantom;
          break;
        case "ledger":
          rawProvider = w.ethereum;
          break;
        case "walletconnect":
          throw new Error("WalletConnect integration required");
        default:
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
                  {!detected && w.id !== "walletconnect" && (
                    <span className="text-white/30 text-xs">Not installed</span>
                  )}
                  {w.id === "walletconnect" && (
                    <span className="text-white/30 text-xs">Connect via QR</span>
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
