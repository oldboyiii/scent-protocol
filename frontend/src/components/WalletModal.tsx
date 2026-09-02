"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

interface WalletOption {
  id: string;
  name: string;
  icon: string; // URL вместо SVG
  check: () => boolean;
}

const wallets: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
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
    icon: "https://raw.githubusercontent.com/RabbyHub/Rabby/develop/src/assets/logo.png",
    check: () => {
      const w = window as any;
      return w.ethereum?.isRabby || w.rabby;
    },
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "https://www.coinbase.com/img/favicon-32x32.png",
    check: () => {
      const w = window as any;
      return w.ethereum?.isCoinbaseWallet || w.coinbaseWalletExtension || w.coinbaseWallet;
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "https://trustwallet.com/assets/images/favicon-32x32.png",
    check: () => {
      const w = window as any;
      return w.ethereum?.isTrust || w.trustwallet || w.trust;
    },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "https://static.okx.com/cdn/assets/imgs/221/5B8C23A8EFC3B2A6.png",
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
                  <img 
                    src={w.icon} 
                    alt={w.name}
                    className="w-8 h-8 object-contain"
                  />
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
