"use client";

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

const GENESIS_CONTRACT_ADDRESS = "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf";

// Correct ABI for the Genesis contract
const GENESIS_ABI = [
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
];

export default function GenesisEventPage() {
  const { address } = useWallet();
  const [minting, setMinting] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [step, setStep] = useState<"idle" | "requested" | "revealed">("idle");
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  
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

      // Step 1: Request Mint
      console.log("Calling requestMint...");
      const tx = await contract.requestMint();
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Extract tokenId from the event log
      const mintEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === "MintRequested");

      const newTokenId = mintEvent ? Number(mintEvent.args[0]) : 1;
      setTokenId(newTokenId);
      setStep("requested");
      setCountdown(60); // Wait 60 seconds (approx. 5 blocks)

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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

  const handleReveal = async () => {
    if (!address || tokenId === null) return;

    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);

      console.log("Calling revealAndMint...");
      const userSeed = Math.floor(Math.random() * 1e18);
      const tx = await contract.revealAndMint(tokenId, userSeed);
      await tx.wait();

      setStep("revealed");
      setUserMinted(1);
      setTotalMinted((prev) => prev + 1);
      
      alert("NFT successfully minted! Check your Collection.");

    } catch (error: any) {
      console.error("Reveal failed:", error);
      alert(error.message || "Reveal failed");
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
            The first 100 AI-generated fragrances on Arc Mainnet. 
            <span className="text-amber-400 font-medium"> Free mint </span> 
            with an enhanced 15% Legendary drop rate.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/30" />
            <svg viewBox="0 0 24 16" className="w-12 h-8 mx-4 text-amber-500/40">
              <path d="M2 14 Q12 2 22 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/30" />
          </div>

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
          {step === "idle" && (
            <div className="flex items-center justify-between">
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
          )}

          {step === "requested" && tokenId !== null && (
            <div className="space-y-6">
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
                <p className="text-emerald-400 font-semibold mb-2">✅ Step 1 Complete!</p>
                <p className="text-white/80">
                  Your tokenId: <span className="font-mono text-amber-400">{tokenId}</span>
                </p>
                <p className="text-white/50 text-sm mt-2">
                  {countdown > 0 
                    ? `⏳ Wait ${countdown} seconds before reveal...`
                    : "✅ Ready for reveal!"}
                </p>
              </div>

              <button
                onClick={handleReveal}
                disabled={countdown > 0 || minting}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {minting ? "Revealing..." : "Reveal & Mint NFT"}
              </button>
            </div>
          )}

          {step === "revealed" && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 text-center">
              <p className="text-emerald-400 text-xl font-bold mb-2">🎉 NFT Minted!</p>
              <p className="text-white/80">Token ID: {tokenId}</p>
            </div>
          )}

          <div className="pt-6 border-t border-white/5 mt-6">
            <p className="text-base text-white/50 mb-4">
              You minted: <span className="text-amber-400 font-medium">{userMinted}</span>/{maxPerWallet}
            </p>
            
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

        {/* Info blocks */}
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
