"use client";

import { useState, useEffect } from "react";
import { switchToArc } from "@/utils/arc";

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts.length > 0 ? accounts[0] : null);
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Установите MetaMask или Rabby");
      return;
    }
    setIsConnecting(true);
    try {
      await switchToArc();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
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
        ? "Подключение..."
        : address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Подключить кошелёк"}
    </button>
  );
}
