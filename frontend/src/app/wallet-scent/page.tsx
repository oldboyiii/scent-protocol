"use client";

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount, useChainId } from "wagmi";

// ============================================================
// VIRAL CONTRACT CONFIGURATION
// Free mint contract deployed specifically for this campaign
// ============================================================
const VIRAL_CONTRACT_ADDRESS = "0x4CC0b84b75C5C61BE51C68bC4f27058023aAc4FC";
const ARC_CHAIN_ID = 5042;

// Minimal ABI for the viral contract (no USDC functions needed)
const VIRAL_ABI = [
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator))",
  "function getNextTokenId() external view returns (uint256)",
  "function getPendingMint(uint256 tokenId) external view returns (tuple(address minter, uint256 blockNumber))",
  "function walletMintCount(address) external view returns (uint256)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
];

// ============================================================
// WALLET ARCHETYPES
// Each archetype has a unique scent profile and viral tweet text
// ============================================================
interface WalletArchetype {
  id: string;
  name: string;
  description: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  dnaColors: string[];
  twitterText: string;
}

const ARCHETYPES: WalletArchetype[] = [
  {
    id: "degen",
    name: "The Degen",
    description: "Chaotic energy with notes of cheap energy drinks, burnt rubber, and desperate hope. You trade memes at 3 AM and call it strategy.",
    topNotes: ["Energy Drink", "Burnt Rubber", "Chaos"],
    heartNotes: ["Desperation", "Meme Magic", "FOMO"],
    baseNotes: ["Hope", "Regret", "Moon Dust"],
    dnaColors: ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
    twitterText: "ScentProtocol analyzed my wallet and said I smell like 'cheap energy drinks, burnt rubber, and desperate hope'. Honestly? Accurate. 😂 What's your wallet's scent?",
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    description: "Aged oak, cold steel, and absolute calm. You've held through every crash since 2017. Your portfolio is a museum of patience.",
    topNotes: ["Aged Oak", "Cold Steel", "Old Paper"],
    heartNotes: ["Patience", "Wisdom", "Conviction"],
    baseNotes: ["Diamond Dust", "Time", "Silence"],
    dnaColors: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"],
    twitterText: "My wallet smells like 'aged oak, cold steel, and absolute calm' according to ScentProtocol. 7 years of holding will do that. 🙌 What's yours?",
  },
  {
    id: "nft-collector",
    name: "The Collector",
    description: "Digital canvas, absinthe, and ozone. You see art where others see pixels. Your gallery is a curated chaos of culture.",
    topNotes: ["Digital Canvas", "Absinthe", "Ozone"],
    heartNotes: ["Culture", "Vision", "Rarity"],
    baseNotes: ["Pixels", "Dreams", "Legacy"],
    dnaColors: ["#7209b7", "#560bad", "#480ca8", "#3a0ca3", "#3f37c9"],
    twitterText: "ScentProtocol says my wallet smells like 'digital canvas, absinthe, and ozone'. I collect NFTs, what did you expect? 🎨✨ Check your wallet's scent:",
  },
  {
    id: "whale",
    name: "The Whale",
    description: "Champagne, gold bullion, and quiet power. You move markets with a single transaction. Your scent is expensive silence.",
    topNotes: ["Champagne", "Gold Bullion", "Caviar"],
    heartNotes: ["Power", "Influence", "Mystery"],
    baseNotes: ["Silence", "Wealth", "Legacy"],
    dnaColors: ["#ffd700", "#ffb700", "#ff8c00", "#ff6b00", "#ff4500"],
    twitterText: "My wallet smells like 'champagne, gold bullion, and quiet power' according to ScentProtocol. Whale life. 🐋 What does yours smell like?",
  },
  {
    id: "newbie",
    name: "The Newbie",
    description: "Fresh apple, morning breeze, and innocent curiosity. You just entered crypto and everything is new and exciting.",
    topNotes: ["Fresh Apple", "Morning Breeze", "Dew"],
    heartNotes: ["Curiosity", "Wonder", "Hope"],
    baseNotes: ["Innocence", "Discovery", "Future"],
    dnaColors: ["#90e0ef", "#00b4d8", "#0096c7", "#0077b6", "#023e8a"],
    twitterText: "Just got my wallet analyzed by ScentProtocol - I smell like 'fresh apple and innocent curiosity'. Welcome to crypto! 🍎✨ What's your wallet's scent?",
  },
  {
    id: "defi-degen",
    name: "DeFi Degen",
    description: "Complex algorithms, yield farms, and calculated risk. You're farming liquidity pools at 4 AM. Your scent is pure alpha.",
    topNotes: ["Algorithms", "Yield", "Liquidity"],
    heartNotes: ["Risk", "Reward", "Math"],
    baseNotes: ["Alpha", "Gamma", "Sigma"],
    dnaColors: ["#06ffa5", "#00d9ff", "#00a8ff", "#0077ff", "#0044ff"],
    twitterText: "ScentProtocol says my wallet smells like 'algorithms, yield farms, and calculated risk'. DeFi life chose me. 💸 What's your wallet's scent?",
  },
];

// ============================================================
// ARCHETYPE DETERMINATION LOGIC
// Analyzes transaction count and balance to assign archetype
// ============================================================
function getWalletArchetype(txCount: number, balance: bigint): WalletArchetype {
  const balanceInETH = Number(balance) / 1e18;

  // Whale: massive balance
  if (balanceInETH > 100) return ARCHETYPES[3];
  
  // NFT Collector: high activity with significant holdings
  if (txCount > 200 && balanceInETH > 5) return ARCHETYPES[2];
  
  // DeFi Degen: extremely high transaction count
  if (txCount > 500) return ARCHETYPES[5];
  
  // Diamond Hands: low activity but meaningful holdings (long-term holder)
  if (txCount < 50 && balanceInETH > 1) return ARCHETYPES[1];
  
  // Degen: medium-high activity
  if (txCount > 100) return ARCHETYPES[0];
  
  // Default: Newbie
  return ARCHETYPES[4];
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function WalletScentPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [archetype, setArchetype] = useState<WalletArchetype | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [minting, setMinting] = useState(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [step, setStep] = useState<"idle" | "analyzing" | "result" | "minting" | "success">("idle");
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user is on the correct network for minting
  const isOnArcNetwork = chainId === ARC_CHAIN_ID;

  // ============================================================
  // STEP 1: ANALYZE WALLET ON ETHEREUM MAINNET
  // We always scan Ethereum Mainnet to get the real on-chain history,
  // regardless of which network the user currently has selected.
  // ============================================================
    const analyzeWallet = async () => {
    if (!address) return;

    setAnalyzing(true);
    setStep("analyzing");
    setErrorMessage(null);

    try {
      // Use viem's publicClient for Ethereum Mainnet (CORS-safe, no RPC URL issues)
      // This leverages the already-installed viem library via wagmi
      const { createPublicClient, http } = await import("viem");
      const { mainnet } = await import("viem/chains");

      const ethMainnetClient = createPublicClient({
        chain: mainnet,
        transport: http(),
      });

      // Fetch real transaction count and balance from Ethereum Mainnet
      const txCount = await ethMainnetClient.getTransactionCount({
        address: address as `0x${string}`,
      });
      const balance = await ethMainnetClient.getBalance({
        address: address as `0x${string}`,
      });

      // Dramatic delay for the "scanning" animation effect
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Determine archetype based on real Ethereum metrics
      const walletArchetype = getWalletArchetype(txCount, balance);
      setArchetype(walletArchetype);
      setStep("result");
    } catch (error) {
      console.error("Wallet analysis failed:", error);
      setErrorMessage("Failed to analyze wallet. Please try again.");
      setStep("idle");
    } finally {
      setAnalyzing(false);
    }
  };

  // ============================================================
  // STEP 2: MINT (TWO-STEP COMMIT-REVEAL)
  // Uses the current network provider (must be Arc Mainnet)
  // ============================================================
  const handleMint = async () => {
    if (!address || !archetype) return;

    // Safety check: user must be on Arc Mainnet to mint
    if (!isOnArcNetwork) {
      setErrorMessage("Please switch your wallet to Arc Network to mint.");
      return;
    }

    setMinting(true);
    setStep("minting");
    setErrorMessage(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, signer);

      // Step 2a: Request mint (commits to minting, reserves tokenId)
      const tx = await contract.requestMint();
      const receipt = await tx.wait();

      // Parse the new tokenId from the MintRequested event
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

      // Step 2b: Generate deterministic seed based on address + archetype
      // This ensures the same wallet always gets the same scent
      const seedString = `${address.toLowerCase()}-${archetype.id}`;
      const userSeedHex = ethers.id(seedString);

      // Countdown for the commit-reveal delay
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait for the reveal window to open
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Step 2c: Reveal and mint (generates the perfume on-chain)
      const revealTx = await contract.revealAndMint(newTokenId, userSeedHex);
      await revealTx.wait();

      setStep("success");
    } catch (error: any) {
      console.error("Mint failed:", error);

      // Handle specific error cases
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        setErrorMessage("Transaction rejected by user.");
      } else if (error.message?.includes("Max 1 per wallet")) {
        setErrorMessage("You've already minted your wallet's scent! Check your collection.");
      } else if (error.message?.includes("Max supply reached")) {
        setErrorMessage("All viral scents have been claimed!");
      } else {
        setErrorMessage(error.reason || error.shortMessage || error.message || "Mint failed");
      }
      setStep("result");
    } finally {
      setMinting(false);
    }
  };

  // ============================================================
  // SHARE ON TWITTER / X
  // Opens a pre-filled tweet with the archetype description
  // ============================================================
  const shareOnTwitter = () => {
    if (!archetype) return;
    const text = encodeURIComponent(archetype.twitterText);
    const url = encodeURIComponent("https://scentprotocol.io/wallet-scent");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  // ============================================================
  // UI RENDERING
  // ============================================================
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 mb-12 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider border border-purple-500/30 mb-6">
            🔮 Viral Experiment
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mb-4">
            What's Your Wallet's Scent?
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            We analyze your real Ethereum history to create a unique fragrance profile for your wallet.
            Discover your crypto archetype and mint it as a free NFT.
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card p-8 rounded-2xl border border-white/10 mb-12">
          {/* IDLE STATE */}
          {step === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Discover Your Scent?</h3>
                <p className="text-white/60">Connect your wallet and let our AI analyze your on-chain behavior</p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}

              {!isConnected ? (
                <div className="px-8 py-4 rounded-xl bg-white/10 text-white/50 font-semibold cursor-not-allowed">
                  Connect Wallet First
                </div>
              ) : !isOnArcNetwork ? (
                <div className="px-8 py-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold">
                  ⚠️ Please switch to Arc Network to mint
                </div>
              ) : (
                <button
                  onClick={analyzeWallet}
                  disabled={analyzing}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {analyzing ? "Analyzing..." : "Analyze My Wallet"}
                </button>
              )}
            </div>
          )}

          {/* ANALYZING STATE */}
          {step === "analyzing" && (
            <div className="text-center space-y-6 py-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Scanning the Blockchain...</h3>
                <p className="text-white/60">Analyzing your transaction patterns and behavior</p>
              </div>
              <div className="space-y-2 text-sm text-white/40">
                <p className="animate-pulse">→ Checking transaction history...</p>
                <p className="animate-pulse" style={{ animationDelay: "0.5s" }}>→ Identifying wallet archetype...</p>
                <p className="animate-pulse" style={{ animationDelay: "1s" }}>→ Generating unique scent profile...</p>
              </div>
            </div>
          )}

          {/* RESULT STATE */}
          {step === "result" && archetype && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs text-purple-300 font-medium mb-1 uppercase tracking-wider">Your Wallet Archetype</p>
                <h3 className="text-3xl font-bold text-white mb-2">{archetype.name}</h3>
              </div>

              {/* Scent DNA Visualization */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Scent DNA</p>
                <div className="h-3 rounded-full overflow-hidden flex">
                  {archetype.dnaColors.map((color, i) => (
                    <div
                      key={i}
                      className="h-full transition-all duration-500"
                      style={{ backgroundColor: color, width: `${100 / archetype.dnaColors.length}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Archetype Description */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/80 italic text-center">"{archetype.description}"</p>
              </div>

              {/* Fragrance Notes Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Top</span>
                  <div className="flex flex-wrap gap-1.5">
                    {archetype.topNotes.map((note) => (
                      <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Heart</span>
                  <div className="flex flex-wrap gap-1.5">
                    {archetype.heartNotes.map((note) => (
                      <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Base</span>
                  <div className="flex flex-wrap gap-1.5">
                    {archetype.baseNotes.map((note) => (
                      <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Message (if any) */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                {!isOnArcNetwork ? (
                  <div className="w-full px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-center">
                    ️ Switch to Arc Network to mint
                  </div>
                ) : (
                  <button
                    onClick={handleMint}
                    disabled={minting}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {minting ? "Minting..." : "✨ Mint This Scent (Free)"}
                  </button>
                )}
                <button
                  onClick={shareOnTwitter}
                  className="w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </button>
              </div>
            </div>
          )}

          {/* MINTING STATE */}
          {step === "minting" && (
            <div className="text-center space-y-6 py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Minting Your Scent...</h3>
                <p className="text-white/60">Please confirm the transaction in your wallet</p>
              </div>
              {countdown > 0 && (
                <p className="text-white/40 text-sm">Waiting for reveal window: {countdown}s</p>
              )}
            </div>
          )}

          {/* SUCCESS STATE */}
          {step === "success" && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center">
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Scent Minted Successfully!</h3>
                <p className="text-white/60">Token ID: #{tokenId}</p>
                <p className="text-white/40 text-sm mt-2">Your wallet's unique aroma is now immortalized on-chain</p>
              </div>
              <button
                onClick={shareOnTwitter}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on Twitter 🚀
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-white mb-2"> How It Works</h4>
            <p className="text-sm text-white/60">
              We analyze your real Ethereum transaction count and balance to determine your unique crypto archetype.
            </p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-white mb-2"> Unique Scent</h4>
            <p className="text-sm text-white/60">
              Each archetype has a carefully crafted fragrance profile with top, heart, and base notes that match your wallet's personality.
            </p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-white mb-2">🔗 Free On-Chain NFT</h4>
            <p className="text-sm text-white/60">
              Mint your wallet's scent as a unique NFT on Arc Network. Your digital aroma, forever preserved in the blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
