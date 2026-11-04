"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: (provider?: any) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Updates the wallet state from the provided Ethereum provider
  const updateState = async (rawProvider: any) => {
    try {
      const provider = new ethers.BrowserProvider(rawProvider);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      setIsConnected(true);
    } catch (e) {
      console.error("Failed to get signer:", e);
    }
  };

  // AUTO-CONNECT ON MOUNT
  useEffect(() => {
    const checkConnection = async () => {
      const rawProvider = (window as any).ethereum;
      if (rawProvider) {
        try {
          // eth_accounts returns connected accounts WITHOUT triggering a popup
          const accounts = await rawProvider.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            await updateState(rawProvider);
          }
        } catch (e) {
          console.warn("Auto-connect check failed:", e);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
      } else {
        updateState((window as any).ethereum);
      }
    };

    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if ((window as any).ethereum) {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  // Manual connection via modal or direct provider
  const connect = async (provider?: any) => {
    const rawProvider = provider || (window as any).ethereum;
    if (!rawProvider) return;

    try {
      // eth_requestAccounts requests connection (shows popup if needed)
      await rawProvider.request({ method: "eth_requestAccounts" });
      await updateState(rawProvider);
    } catch (e) {
      console.error("Connection failed:", e);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    // Note: Web3 wallets cannot be programmatically disconnected from the website side;
    // we only clear the local application state.
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
