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

// Правильные SVG иконки для всех кошельков
const WalletIcons = {
  // Официальная иконка MetaMask
  metamask: (
    <svg viewBox="0 0 318.6 318.6" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <polygon fill="#E2761B" stroke="#E2761B" strokeWidth="1" points="274.1,35.5 174.6,109.4 193,65.8"/>
      <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="44.4,35.5 143.1,110.1 125.6,65.8"/>
      <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="233.8,254 209.4,288.9 265.3,299.1 281.5,244.8"/>
      <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="37.1,244.8 53.3,299.1 109.2,288.9 84.8,254"/>
      <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="1" points="105.9,192.1 90.7,215.4 145.8,218.3 143.4,159.4"/>
      <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="1" points="212.7,192.1 175.2,158.9 172.8,218.3 227.9,215.4"/>
      <polygon fill="#233447" stroke="#233447" strokeWidth="1" points="109.2,288.9 138.2,267.9 114.7,249.2"/>
      <polygon fill="#233447" stroke="#233447" strokeWidth="1" points="180.4,267.9 209.4,288.9 203.9,249.2"/>
      <polygon fill="#CD6116" stroke="#CD6116" strokeWidth="1" points="209.4,288.9 180.4,267.9 182.6,295.2 182.3,310.6"/>
      <polygon fill="#CD6116" stroke="#CD6116" strokeWidth="1" points="109.2,288.9 135.6,310.6 136.1,295.2 138.2,267.9"/>
      <polygon fill="#E4751F" stroke="#E4751F" strokeWidth="1" points="144.2,206.1 141.2,238.4 161.7,229.2 165.2,205.9"/>
      <polygon fill="#E4751F" stroke="#E4751F" strokeWidth="1" points="174.4,206.1 153.4,206.1 157.5,229.2 177.3,238.4"/>
      <polygon fill="#F6851B" stroke="#F6851B" strokeWidth="1" points="177.3,238.4 157.5,229.2 161.3,248.5 160,267.9 180.4,267.9"/>
      <polygon fill="#F6851B" stroke="#F6851B" strokeWidth="1" points="141.2,238.4 138.2,267.9 158.6,267.9 157.3,248.5"/>
      <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="1" points="158.6,267.9 160,267.9 161.3,248.5 157.3,248.5"/>
      <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="1" points="180.4,267.9 204.4,248.5 182.6,248.5"/>
      <polygon fill="#161616" stroke="#161616" strokeWidth="1" points="204.4,248.5 180.4,267.9 182.6,295.2 182.3,310.6 209.4,288.9"/>
      <polygon fill="#161616" stroke="#161616" strokeWidth="1" points="138.2,267.9 109.2,288.9 135.6,310.6 136.1,295.2"/>
    </svg>
  ),
  
  // Официальная иконка Rabby
  rabby: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="100" fill="#8285EB"/>
      <path d="M256 92.7C162.5 92.7 92.7 162.5 92.7 256S162.5 419.3 256 419.3 419.3 349.5 419.3 256 349.5 92.7 256 92.7zM256 373.3c-64.8 0-117.3-52.5-117.3-117.3S191.2 138.7 256 138.7 373.3 191.2 373.3 256 320.8 373.3 256 373.3z"/>
      <circle cx="256" cy="256" r="52.3" fill="white"/>
    </svg>
  ),
  
  // Официальная иконка Coinbase
  coinbase: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#0052FF"/>
      <path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm64 144h-128v-32h128v32z" fill="white"/>
    </svg>
  ),
  
  // Официальная иконка Trust Wallet
  trust: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#3375BB"/>
      <path d="M256 64L64 128v128c0 128 80 224 192 256 112-32 192-128 192-256V128L256 64z" fill="white" fillOpacity="0.3"/>
      <path d="M256 96L96 144v128c0 96 64 176 160 200 96-24 160-104 160-200V144L256 96z" fill="white" fillOpacity="0.5"/>
      <path d="M256 128L128 160v128c0 64 48 128 128 144 80-16 128-80 128-144V160L256 128z" fill="white"/>
    </svg>
  ),
  
  // Официальная иконка OKX
  okx: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="96" fill="#000000"/>
      <path d="M160 160h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M288 160h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M160 288h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M288 288h64v64h-64v-64z" fill="#FFFFFF"/>
    </svg>
  ),
  
  // Иконка Phantom
  phantom: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#AB9FF2"/>
      <path d="M256 128c-70.7 0-128 57.3-128 128 0 70.7 57.3 128 128 128s128-57.3 128-128c0-70.7-57.3-128-128-128z" fill="white"/>
      <circle cx="256" cy="256" r="32" fill="#AB9FF2"/>
    </svg>
  ),
  
  // Иконка Ledger
  ledger: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="96" fill="#0F0F0F"/>
      <path d="M144 144h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M304 144h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M144 304h64v64h-64v-64z" fill="#FFFFFF"/>
      <path d="M304 304h64v64h-64v-64z" fill="#FFFFFF"/>
    </svg>
  ),
  
  // Иконка WalletConnect
  walletconnect: (
    <svg viewBox="0 0 512 512" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#3B99FC"/>
      <path d="M168 200c52-52 124-52 176 0l-16 16c-40-40-104-40-144 0l-16-16z" fill="white"/>
      <path d="M136 232l24-24c64-64 168-64 232 0l24 24-24 24c-56-56-152-56-208 0l-24-24z" fill="white"/>
      <path d="M168 264l16-16c40-40 104-40 144 0l16 16-16 16c-32-32-96-32-128 0l-16-16z" fill="white"/>
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
          `${wallet.name} не обнаружен. ${link ? `Установите расширение: ${link}` : "Пожалуйста, установите расширение."}`
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

        <h3 className="text-xl font-bold text-white mb-1 relative z-10">Подключить кошелек</h3>
        <p className="text-white/40 text-sm mb-5 relative z-10">Выберите кошелек для продолжения</p>

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
                    <span className="text-white/30 text-xs">Не установлен</span>
                  )}
                  {w.id === "walletconnect" && (
                    <span className="text-white/30 text-xs">Подключение через QR</span>
                  )}
                </div>
                {connecting === w.id && (
                  <span className="text-amber-400 text-xs font-medium animate-pulse">
                    Подключение...
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
          Отмена
        </button>
      </div>
    </div>
  );
}
