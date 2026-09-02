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

// Official SVG Icons for Wallets
const WalletIcons = {
  metamask: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30.144 10.28l-2.816-8.384c-.32-.928-1.376-1.376-2.272-.992L16 4.896 6.944.904c-.896-.384-1.952.064-2.272.992L1.856 10.28c-.32.928.16 1.92 1.088 2.272l2.56 1.088L3.84 20.48c-.32.928.16 1.92 1.088 2.272l3.2 1.376L6.4 29.28c-.32.928.16 1.92 1.088 2.272l7.68 3.2c.512.224 1.088.224 1.6 0l7.68-3.2c.928-.384 1.408-1.344 1.088-2.272l-1.728-5.152 3.2-1.376c.928-.384 1.408-1.344 1.088-2.272l-1.664-6.848 2.56-1.088c.928-.352 1.408-1.344 1.088-2.272z" fill="#E17726"/>
      <path d="M23.36 24.128l-1.728-5.152L24.8 20.352l-1.44 3.776z" fill="#E27625"/>
      <path d="M8.64 24.128l1.728-5.152L7.2 20.352l1.44 3.776z" fill="#E27625"/>
      <path d="M13.76 13.44l-1.92 5.696 4.16.192.192-4.48-2.432-1.408z" fill="#E27625"/>
      <path d="M18.24 13.44l2.432-1.408-.192 4.48 4.16-.192-1.92-5.696-4.48 2.816z" fill="#E27625"/>
      <path d="M12.16 26.688l2.688-1.312-2.336-1.824-.352 3.136z" fill="#E27625"/>
      <path d="M19.84 26.688l-.352-3.136-2.336 1.824 2.688 1.312z" fill="#E27625"/>
    </svg>
  ),
  rabby: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#4E85F7"/>
      <path d="M16 8c-4.418 0-8 3.582-8 8 0 3.314 2.016 6.156 4.88 7.416.4.176.544-.176.544-.39 0-.192-.008-.832-.012-1.504-1.984.432-2.4-1.064-2.4-1.064-.324-.824-.788-1.044-.788-1.044-.644-.44.048-.432.048-.432.712.05 1.088.732 1.088.732.632 1.084 1.66.772 2.064.592.064-.46.248-.772.452-.948-1.584-.18-3.248-.792-3.248-3.528 0-.78.276-1.416.732-1.916-.076-.18-.32-.904.068-1.884 0 0 .6-.192 1.968.732.572-.16 1.184-.24 1.792-.244.608.004 1.22.084 1.792.244 1.368-.924 1.968-.732 1.968-.732.388.98.144 1.704.068 1.884.456.5.732 1.136.732 1.916 0 2.744-1.668 3.348-3.256 3.524.256.22.484.656.484 1.324 0 .956-.008 1.728-.008 1.964 0 .216.144.472.548.392C21.984 22.156 24 19.314 24 16c0-4.418-3.582-8-8-8z" fill="#FFFFFF"/>
    </svg>
  ),
  coinbase: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <path d="M16 8c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="#FFFFFF"/>
    </svg>
  ),
  trust: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L4 7v8c0 7.18 5.12 13.86 12 15 6.88-1.14 12-7.82 12-15V7L16 2z" fill="#3375BB"/>
      <path d="M16 6.5L7 10.5v6.5c0 5.38 3.84 10.38 9 11.25 5.16-.87 9-5.87 9-11.25v-6.5L16 6.5z" fill="#FFFFFF" fillOpacity="0.2"/>
      <path d="M16 9.5l-6 2.5v5c0 4.03 2.88 7.78 6 8.43 3.12-.65 6-4.4 6-8.43v-5L16 9.5z" fill="#FFFFFF"/>
    </svg>
  ),
  okx: (
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#000000"/>
      <path d="M8 12h4v8H8v-8zm6 0h4v8h-4v-8zm6 0h4v8h-4v-8z" fill="#FFFFFF"/>
    </svg>
  )
};

const wallets: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: WalletIcons.metamask,
    check: () => {
      const e = (window as any).ethereum;
      return e && e.isMetaMask && !e.isCoinbaseWallet && !e.isRabby;
    },
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: WalletIcons.rabby,
    check: () => {
      const e = (window as any).ethereum;
      return e && e.isRabby;
    },
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: WalletIcons.coinbase,
    check: () => {
      const e = (window as any).ethereum;
      return (e && e.isCoinbaseWallet) || !!(window as any).coinbaseWalletExtension;
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: WalletIcons.trust,
    check: () => {
      const e = (window as any).ethereum;
      return e && e.isTrust;
    },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: WalletIcons.okx,
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
                {/* Render SVG Icon */}
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
