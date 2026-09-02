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

// Official wallet icons
const WalletIcons = {
  // Official MetaMask icon
  metamask: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.5 2L13.5 8.5L15 5L20.5 2Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5"/>
      <path d="M3.5 2L10.4 8.5L9 5L3.5 2Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M17.5 15.5L16 19L21 20.5L22.5 16L17.5 15.5Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M2.5 16L4 20.5L9 19L7.5 15.5L2.5 16Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M8.5 13.5L7.5 16.5L11.5 16.5L11.5 12L8.5 13.5Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
      <path d="M15.5 13.5L12.5 12L12.5 16.5L16.5 16.5L15.5 13.5Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
      <path d="M9 19L11.5 17.5L10 16.5L9 19Z" fill="#233447" stroke="#233447" strokeWidth="0.5"/>
      <path d="M15 19L14 16.5L12.5 17.5L15 19Z" fill="#233447" stroke="#233447" strokeWidth="0.5"/>
      <path d="M17.5 20.5L16 19L15 20L15 21.5L17.5 20.5Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.5"/>
      <path d="M6.5 20.5L9 21.5L9 20L8 19L6.5 20.5Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.5"/>
      <path d="M11 14L10.5 16.5L12.5 15.5L13 14L11 14Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
      <path d="M13 14L12.5 15.5L14.5 16.5L15.5 14L13 14Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5"/>
      <path d="M14.5 16.5L12.5 15.5L13 17L12.5 19L14.5 16.5Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5"/>
      <path d="M9.5 16.5L11.5 19L11 17L11.5 15.5L9.5 16.5Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5"/>
      <path d="M12.5 19L13 17L11 17L11.5 19L12.5 19Z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.5"/>
      <path d="M15 19L13 17L12.5 19L15 19Z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.5"/>
      <path d="M15 19L16 20.5L17.5 19L15 19Z" fill="#161616" stroke="#161616" strokeWidth="0.5"/>
      <path d="M9 19L10.5 20.5L12 19L9 19Z" fill="#161616" stroke="#161616" strokeWidth="0.5"/>
    </svg>
  ),

  // Official Rabby icon
  rabby: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#8285EB"/>
      <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6ZM12 15C10.343 15 9 13.657 9 12C9 10.343 10.343 9 12 9C13.657 9 15 10.343 15 12C15 13.657 13.657 15 12 15Z" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>
  ),

  // Official Coinbase icon
  coinbase: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0052FF"/>
      <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6ZM15 13H9V11H15V13Z" fill="white"/>
    </svg>
  ),

  // Official Trust Wallet icon
  trust: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#3375BB"/>
      <path d="M12 3L4 6V12C4 16.5 8 21 12 22C16 21 20 16.5 20 12V6L12 3Z" fill="white" fillOpacity="0.3"/>
      <path d="M12 5L5.5 8V12C5.5 15.5 8.5 19 12 20C15.5 19 18.5 15.5 18.5 12V8L12 5Z" fill="white" fillOpacity="0.5"/>
      <path d="M12 7L7 9.5V12C7 14.5 9.5 17 12 17.5C14.5 17 17 14.5 17 12V9.5L12 7Z" fill="white"/>
    </svg>
  ),

  // Official OKX icon
  okx: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#000000"/>
      <path d="M7 7H10V10H7V7Z" fill="white"/>
      <path d="M14 7H17V10H14V7Z" fill="white"/>
      <path d="M7 14H10V17H7V14Z" fill="white"/>
      <path d="M14 14H17V17H14V14Z" fill="white"/>
    </svg>
  ),

  // Phantom icon
  phantom: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#AB9FF2"/>
      <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6Z" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="#AB9FF2"/>
    </svg>
  ),

  // Ledger icon
  ledger: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#0F0F0F"/>
      <path d="M6 6H9V9H6V6Z" fill="white"/>
      <path d="M15 6H18V9H15V6Z" fill="white"/>
      <path d="M6 15H9V18H6V15Z" fill="white"/>
      <path d="M15 15H18V18H15V15Z" fill="white"/>
    </svg>
  ),

  // WalletConnect icon
  walletconnect: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#3B99FC"/>
      <path d="M8 9.5C10.5 7 13.5 7 16 9.5L16.5 10L15.5 11C13.5 9.5 10.5 9.5 8.5 11L7.5 10L8 9.5Z" fill="white"/>
      <path d="M6.5 12L8 10.5C10.5 8 13.5 8 16 10.5L17.5 12L16.5 13C14.5 11 9.5 11 7.5 13L6.5 12Z" fill="white"/>
      <path d="M9 13.5L10.5 12C12.5 10.5 15.5 10.5 17.5 12L19 13.5L17.5 15C16 14 14 14 12 14C10 14 8 14 6.5 15L5 13.5L6.5 12L9 13.5Z" fill="white"/>
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
        const installLinks: Record<string, string> = {
          metamask: "https://metamask.io/download/",
          rabby: "https://rabby.io/",
          coinbase: "https://www.coinbase.com/wallet/download",
          trust: "https://trustwallet.com/download",
          okx: "https://www.okx.com/web3",
          phantom: "https://phantom.app/download",
          ledger: "https://www.ledger.com/ledger-live",
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
