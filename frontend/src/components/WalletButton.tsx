"use client";

import { useState, useEffect } from "react";
import { switchToArc } from "@/utils/arc";

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const w = window as any;
    if (w.ethereum) {
      w.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      });

      w.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts.length > 0 ? accounts[0] : null);
      });
    }
  }, []);

  const connect = async () => {
    const w = window as any;
    if (!w.ethereum) {
      alert("Install MetaMask or Rabby");
      return;
    }
    setIsConnecting(true);
    try {
      await switchToArc();
      const accounts = await w.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => setAddress(null);

  return (
    <button
      onClick={address ? disconnect : connect}
      disabled={isConnecting}
      className="btn-secondary text-sm"
    >
      {isConnecting
        ? "Connecting..."
        : address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Wallet"}
    </button>
  );
}
