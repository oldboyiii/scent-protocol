"use client";

import { useEffect, useState } from "react";

interface ScentScanProps {
  address: string;
  onScanComplete: (data: {
    transactions: number;
    ethBalance: number;
    yearsOnChain: number;
  }) => void;
}

interface ScanStep {
  label: string;
  value: number;
  color: string;
  ready: boolean;
}

export default function ScentScan({ address, onScanComplete }: ScentScanProps) {
  const [steps, setSteps] = useState<ScanStep[]>([
    { label: "Transactions", value: 0, color: "#60a5fa", ready: false },
    { label: "ETH Balance", value: 0, color: "#a78bfa", ready: false },
    { label: "Years on Chain", value: 0, color: "#fbbf24", ready: false },
  ]);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    async function scan() {
      try {
        // Fetch transaction count
        const txRes = await fetch(
          `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`
        );
        const txData = await txRes.json();
        if (cancelled) return;
        const txCount = parseInt(txData.result || "0", 16);

        setSteps((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], value: txCount, ready: true };
          return next;
        });

        // Fetch ETH balance
        const balRes = await fetch(
          `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`
        );
        const balData = await balRes.json();
        if (cancelled) return;
        const ethBalance = parseFloat(balData.result || "0") / 1e18;

        setSteps((prev) => {
          const next = [...prev];
          next[1] = { ...next[1], value: ethBalance, ready: true };
          return next;
        });

        // Fetch wallet age from Blockscout (no API key needed)
        const blockRes = await fetch(
          `https://eth.blockscout.com/api/v2/addresses/${address}`
        );
        const blockData = await blockRes.json();
        if (cancelled) return;
        
        let yearsOnChain = 0;
        if (blockData.creation_tx_hash) {
          const creationDate = new Date(blockData.creation_tx_timestamp || blockData.created_at);
          const now = new Date();
          yearsOnChain = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        }

        setSteps((prev) => {
          const next = [...prev];
          next[2] = { ...next[2], value: Math.max(0, yearsOnChain), ready: true };
          return next;
        });

        if (!cancelled) {
          setScanning(false);
          onScanComplete({
            transactions: txCount,
            ethBalance,
            yearsOnChain,
          });
        }
      } catch (error) {
        console.error("Scan failed:", error);
        if (!cancelled) setScanning(false);
      }
    }

    scan();

    return () => {
      cancelled = true;
    };
  }, [address, onScanComplete]);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-500"
          style={{
            borderColor: step.ready ? `${step.color}88` : "rgba(255,255,255,0.1)",
            background: step.ready ? `${step.color}14` : "rgba(255,255,255,0.03)",
          }}
        >
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500"
            style={{
              background: step.ready ? `${step.color}33` : "rgba(255,255,255,0.05)",
              color: step.ready ? step.color : "rgba(255,255,255,0.3)",
              boxShadow: step.ready ? `0 0 20px ${step.color}44` : "none",
            }}
          >
            {step.ready ? "✓" : scanning ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "○"
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/50 uppercase tracking-wider">{step.label}</p>
            <p
              className="text-2xl font-bold tabular-nums transition-all duration-500"
              style={{ color: step.ready ? step.color : "rgba(255,255,255,0.3)" }}
            >
              {step.label === "Transactions"
                ? step.value.toLocaleString()
                : step.label === "ETH Balance"
                ? step.value.toFixed(4)
                : step.value.toFixed(1)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
