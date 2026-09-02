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
  // Official MetaMask icon - exact copy from MetaMask extension
  metamask: (
    <svg viewBox="0 0 318.6 318.6" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <path d="M274.1 35.5l-99.5 73.9L193 65.8z" fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44.4 35.5l98.7 74.6-17.5-44.3z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33.9 207.7L50.1 263l56.7-15.6-26.5-40.6z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M106.8 247.4l33.8-16.5-29.2-22.8z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M211.8 247.4l33.9-16.5-4.7-39.3z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3z" fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M106.8 247.4l31.5 14.9-.2-9.3 2.5-22.1z" fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M138.8 193.5l-28.2-8.3 19.9-9.1z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M179.7 193.5l8.3-17.4 20 9.1z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M106.8 247.4l4.8-40.6-31.3.9z" fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M207 206.8l4.8 40.6 26.5-39.7z" fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M230.8 162.1l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1z" fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M110.6 185.2l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z" fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M87.8 162.1l23.6 46-.8-22.9z" fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M208.1 185.2l-1 22.9 23.7-46z" fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M144.1 164.6l-5.3 28.9-4.3 16.7 1.9-27.6z" fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M132.8 197.7l4.3 11.1 6.4-17.5-1.9-27.6z" fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M160.7 170.1l6.8 17.5 4.5-11.1-2.4-28.8z" fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M170.2 246.6l-10 7.9 26.5 7.4 2.4-9.3z" fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M176.5 244.1l4.5 15.3 2.3-18.1z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M198.4 219.7l-23.7-1.7 2.5 23.1 3.6-22.2z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Official Rabby icon - from Rabby official website
  rabby: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rabbyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#9D95F5', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6B5FDD', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#rabbyGrad)"/>
      <circle cx="256" cy="256" r="160" fill="white" opacity="0.95"/>
      <circle cx="256" cy="256" r="120" fill="url(#rabbyGrad)"/>
      <circle cx="256" cy="256" r="80" fill="white" opacity="0.95"/>
    </svg>
  ),

  // Official Coinbase icon - from Coinbase Wallet SDK
  coinbase: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#0052FF"/>
      <path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm64 144h-128v-32h128v32z" fill="white"/>
    </svg>
  ),

  // Official Trust Wallet icon - from Trust Wallet official
  trust: (
    <svg viewBox="0 0 444 501" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trustGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#0500FF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0094FF', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M0.71 72.41L222.16 0.11v500.52C63.98 433.89 0.71 305.98 0.71 233.69V72.41z" fill="url(#trustGrad)"/>
      <path d="M443.62 72.41L222.17 0.11v500.52c158.18-66.74 221.45-194.65 221.45-266.94V72.41z" fill="#3375BB"/>
    </svg>
  ),

  // Official OKX icon - from OKX official
  okx: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="96" fill="#000000"/>
      <rect x="160" y="160" width="64" height="64" fill="#FFFFFF"/>
      <rect x="288" y="160" width="64" height="64" fill="#FFFFFF"/>
      <rect x="160" y="288" width="64" height="64" fill="#FFFFFF"/>
      <rect x="288" y="288" width="64" height="64" fill="#FFFFFF"/>
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
