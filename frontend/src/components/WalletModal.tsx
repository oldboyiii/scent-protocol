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

// Official wallet icons as inline SVG
const WalletIcons = {
  // MetaMask
  metamask: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.5 4L17 10.5L18.5 7L29.5 4Z" fill="#E2761B"/>
      <path d="M2.5 4L14.8 10.8L13.5 7L2.5 4Z" fill="#E4761B"/>
      <path d="M25.5 23L23 27.5L28.5 29L30 23.5L25.5 23Z" fill="#E4761B"/>
      <path d="M4 23.5L5.5 29L11 27.5L8.5 23L4 23.5Z" fill="#E4761B"/>
      <path d="M10.5 20L9 23.5L14.5 23.5L14 18.5L10.5 20Z" fill="#D7C1B3"/>
      <path d="M21.5 20L18 18.5L17.5 23.5L23 23.5L21.5 20Z" fill="#D7C1B3"/>
      <path d="M11 27.5L14.5 25.5L12.5 24L11 27.5Z" fill="#233447"/>
      <path d="M21 27.5L19.5 24L17.5 25.5L21 27.5Z" fill="#233447"/>
      <path d="M23 27.5L21 23.5L19.5 25L19.5 27.5L23 27.5Z" fill="#CD6116"/>
      <path d="M9 27.5L12.5 27.5L12.5 25L11 23.5L9 27.5Z" fill="#CD6116"/>
      <path d="M15 19.5L14 22L17.5 20.5L18 19.5L15 19.5Z" fill="#E4751F"/>
      <path d="M17 19.5L17.5 20.5L21 22L20.5 19.5L17 19.5Z" fill="#E4751F"/>
      <path d="M20.5 22L17.5 20.5L18.5 23L18 25.5L20.5 22Z" fill="#F6851B"/>
      <path d="M11.5 22L14 25.5L13.5 23L14.5 20.5L11.5 22Z" fill="#F6851B"/>
      <path d="M17.5 25.5L18.5 23L13.5 23L14.5 25.5L17.5 25.5Z" fill="#C0AD9E"/>
      <path d="M21 25.5L18.5 23L17.5 25.5L21 25.5Z" fill="#C0AD9E"/>
      <path d="M21 25.5L22.5 27.5L24 25.5L21 25.5Z" fill="#161616"/>
      <path d="M11 25.5L12.5 27.5L14 25.5L11 25.5Z" fill="#161616"/>
    </svg>
  ),

  // Rabby
  rabby: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#8285EB"/>
      <path d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16C24 11.582 20.418 8 16 8ZM16 21C13.239 21 11 18.761 11 16C11 13.239 13.239 11 16 11C18.761 11 21 13.239 21 16C21 18.761 18.761 21 16 21Z" fill="white"/>
      <circle cx="16" cy="16" r="2.5" fill="white"/>
    </svg>
  ),

  // Coinbase
  coinbase: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <path d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16C24 11.582 20.418 8 16 8ZM19 17H13V15H19V17Z" fill="white"/>
    </svg>
  ),

  // Trust Wallet
  trust: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#3375BB"/>
      <path d="M16 3L4 9V16C4 22.5 8.5 27.5 16 29C23.5 27.5 28 22.5 28 16V9L16 3Z" fill="white" fillOpacity="0.2"/>
      <path d="M16 6L7 10.5V16C7 20.5 10.5 25 16 26.5C21.5 25 25 20.5 25 16V10.5L16 6Z" fill="white" fillOpacity="0.3"/>
      <path d="M16 9L10 12.5V16C10 19 12.5 22 16 23C19.5 22 22 19 22 16V12.5L16 9Z" fill="white"/>
    </svg>
  ),

  // OKX
  okx: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#000000"/>
      <rect x="10" y="10" width="4" height="4" fill="#FFFFFF"/>
      <rect x="18" y="10" width="4" height="4" fill="#FFFFFF"/>
      <rect x="10" y="18" width="4" height="4" fill="#FFFFFF"/>
      <rect x="18" y="18" width="4" height="4" fill="#FFFFFF"/>
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
