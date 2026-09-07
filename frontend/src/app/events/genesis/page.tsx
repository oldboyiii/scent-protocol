"use client";

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

const GENESIS_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

const GENESIS_ABI = [
  "function mint() external payable",
  "function totalMinted() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function mintedPerWallet(address) view returns (uint256)",
  "function maxPerWallet() view returns (uint256)",
];

export default function GenesisEventPage() {
  const { address } = useWallet();
  const [minting, setMinting] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  
  const maxSupply = 100;
  const maxPerWallet = 1;

  const handleMint = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);

      const tx = await contract.mint({ value: 0 });
      await tx.wait();

      alert("Mint successful! Check your Collection.");
      setTotalMinted((prev) => prev + 1);
      setUserMinted((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mint failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(error.message || "Mint failed");
      }
    } finally {
      setMinting(false);
    }
  };

  const progress = (totalMinted / maxSupply) * 100;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link href="/events" className="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 mb-12 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider border border-amber-500/20 mb-6">
            Live Now
          </span>
          
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 mb-4">
            Genesis Collection
          </h1>
          
          <p className="text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            The first 1000 AI-generated fragrances on Arc Mainnet. 
            <span className="text-amber-400 font-medium"> Free mint </span> 
            with an enhanced 15% Legendary drop rate.
          </p>
        </div>

        {/* Stats with Arc divider */}
        <div className="mb-16">
          {/* Thin Arc divider */}
          <div className="flex items-center justify-center mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/30" />
            <svg viewBox="0 0 24 16" className="w-12 h-8 mx-4 text-amber-500/40">
              <path d="M2 14 Q12 2 22 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/30" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">{totalMinted}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Minted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400 mb-1">{maxSupply}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">{maxSupply - totalMinted}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Remaining</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/40 mt-3">
            {progress.toFixed(1)}% claimed
          </p>
        </div>

        {/* Mint Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Mint Price</p>
              <p className="text-3xl font-bold text-emerald-400">Free</p>
              <p className="text-sm text-white/50 mt-2">
                Max {maxPerWallet} per wallet
              </p>
            </div>

            <button
              onClick={handleMint}
              disabled={minting || userMinted >= maxPerWallet}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {minting ? "Minting..." : userMinted >= maxPerWallet ? "Max Reached" : "Mint Now"}
            </button>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-base text-white/50 mb-4">
              You minted: <span className="text-amber-400 font-medium">{userMinted}</span>/{maxPerWallet}
            </p>
            
            {/* Features - ENLARGED */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-base font-bold text-amber-400 mb-1">15% Legendary</p>
                <p className="text-base text-white/60">Enhanced rate</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-base font-bold text-amber-400 mb-1">Genesis Badge</p>
                <p className="text-base text-white/60">Exclusive marker</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-base font-bold text-amber-400 mb-1">Priority Access</p>
                <p className="text-base text-white/60">Future drops</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info blocks - ENLARGED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-3">What is Genesis?</h3>
            <p className="text-base text-white/60 leading-relaxed">
              The official launch collection of ScentProtocol on Arc Mainnet. 
              Holders receive lifetime priority access to future events.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-3">Where to view?</h3>
            <p className="text-base text-white/60 leading-relaxed">
              All NFTs appear in your{" "}
              <Link href="/collection" className="text-amber-400 hover:underline">Collection</Link>{" "}
              and can be traded on the{" "}
              <Link href="/marketplace" className="text-amber-400 hover:underline">Marketplace</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
