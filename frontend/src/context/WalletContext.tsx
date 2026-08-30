"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: (provider: ethers.BrowserProvider) => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async (newProvider: ethers.BrowserProvider) => {
    setIsConnecting(true);
    try {
      const newSigner = await newProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      localStorage.setItem("scent_wallet", newAddress);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    localStorage.removeItem("scent_wallet");
  };

  useEffect(() => {
    const saved = localStorage.getItem("scent_wallet");
    if (!saved) return;

    const autoConnect = async () => {
      try {
        const w = (window as any).ethereum;
        if (!w) return;
        const p = new ethers.BrowserProvider(w);
        const accounts = await p.listAccounts();
        if (accounts.length > 0 && accounts[0].address.toLowerCase() === saved.toLowerCase()) {
          await connect(p);
        } else {
          localStorage.removeItem("scent_wallet");
        }
      } catch {
        localStorage.removeItem("scent_wallet");
      }
    };
    autoConnect();
  }, []);

  return (
    <WalletContext.Provider value={{ address, provider, signer, connect, disconnect, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
