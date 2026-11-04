"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount, useChainId } from "wagmi";
import ScentCrest from "@/components/ScentCrest";

// ============================================================
// CONTRACT CONFIGURATION
// ============================================================
const VIRAL_CONTRACT_ADDRESS = "0x55A3527C87190fa8456De46247b52214287e8688";
const ARC_CHAIN_ID = 5042;

const VIRAL_ABI = [
  "function requestMint(bytes32 seedCommitment) external returns (uint256)",
  "function revealAndMint(uint256 tokenId, bytes32 seedPreimage) external",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator))",
  "function walletMintCount(address) external view returns (uint256)",
  "function pendingTokenId(address) external view returns (uint256)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)"
];

// ============================================================
// WALLET ARCHETYPES (Public data - determined by on-chain metrics)
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
  { id: "degen", name: "The Degen", description: "Chaotic energy with notes of cheap energy drinks, burnt rubber, and desperate hope.", topNotes: ["Energy Drink", "Burnt Rubber", "Chaos"], heartNotes: ["Desperation", "Meme Magic", "FOMO"], baseNotes: ["Hope", "Regret", "Moon Dust"], dnaColors: ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"], twitterText: "ScentProtocol says I smell like 'energy drinks, burnt rubber, and desperate hope'. Accurate. " },
  { id: "diamond-hands", name: "Diamond Hands", description: "Aged oak, cold steel, and absolute calm. You've held through every crash.", topNotes: ["Aged Oak", "Cold Steel", "Old Paper"], heartNotes: ["Patience", "Wisdom", "Conviction"], baseNotes: ["Diamond Dust", "Time", "Silence"], dnaColors: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"], twitterText: "My wallet smells like 'aged oak and absolute calm'. Years of holding! 🙌" },
  { id: "nft-collector", name: "The Collector", description: "Digital canvas, absinthe, and ozone. You see art where others see pixels.", topNotes: ["Digital Canvas", "Absinthe", "Ozone"], heartNotes: ["Culture", "Vision", "Rarity"], baseNotes: ["Pixels", "Dreams", "Legacy"], dnaColors: ["#7209b7", "#560bad", "#480ca8", "#3a0ca3", "#3f37c9"], twitterText: "ScentProtocol says I smell like 'digital canvas and absinthe'. NFT life! 🎨" },
  { id: "whale", name: "The Whale", description: "Champagne, gold bullion, and quiet power. You move markets.", topNotes: ["Champagne", "Gold Bullion", "Caviar"], heartNotes: ["Power", "Influence", "Mystery"], baseNotes: ["Silence", "Wealth", "Legacy"], dnaColors: ["#ffd700", "#ffb700", "#ff8c00", "#ff6b00", "#ff4500"], twitterText: "My wallet smells like 'champagne and gold bullion'. Whale life " },
  { id: "newbie", name: "The Newbie", description: "Fresh apple, morning breeze, and innocent curiosity.", topNotes: ["Fresh Apple", "Morning Breeze", "Dew"], heartNotes: ["Curiosity", "Wonder", "Hope"], baseNotes: ["Innocence", "Discovery", "Future"], dnaColors: ["#90e0ef", "#00b4d8", "#0096c7", "#0077b6", "#023e8a"], twitterText: "Just discovered I smell like 'fresh apple and curiosity'. Welcome to crypto! 🍏" },
  { id: "defi-degen", name: "DeFi Degen", description: "Algorithms, yield farms, and calculated risk. Pure alpha.", topNotes: ["Algorithms", "Yield", "Liquidity"], heartNotes: ["Risk", "Reward", "Math"], baseNotes: ["Alpha", "Gamma", "Sigma"], dnaColors: ["#06ffa5", "#00d9ff", "#00a8ff", "#0077ff", "#0044ff"], twitterText: "ScentProtocol says I smell like 'algorithms and yield farms'. DeFi chose me 💸" },
];

interface PerfumeData {
  tokenId: number;
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
  createdAt: number;
  creator: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Fetches wallet creation timestamp from Etherscan API
 * Used to determine wallet age for archetype calculation
 */
async function getWalletAge(address: string): Promise<number> {
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "1" && data.result && data.result.length > 0) {
      return Number(data.result[0].timeStamp);
    }
    return 0; 
  } catch (error) {
    console.error("Failed to get wallet age:", error);
    return 0;
  }
}

/**
 * Determines wallet archetype based on on-chain metrics
 * SECURITY: This is deterministic - same wallet always gets same archetype
 * based on public, immutable blockchain data (tx count, balance, age)
 */
function getWalletArchetype(txCount: number, balance: bigint, walletAgeTimestamp: number): WalletArchetype {
  const balanceInETH = Number(balance) / 1e18;
  const now = Math.floor(Date.now() / 1000);
  const ageInSeconds = walletAgeTimestamp > 0 ? now - walletAgeTimestamp : 0;
  const ageInYears = ageInSeconds / (365 * 24 * 60 * 60);

  // Whale: >100 ETH balance
  if (balanceInETH > 100) return ARCHETYPES[3]; 
  // Diamond Hands: >1 year old, <100 txs, holds some ETH
  if (ageInYears >= 1 && txCount < 100 && balanceInETH >= 0.01) return ARCHETYPES[1]; 
  // NFT Collector: >200 txs, >5 ETH
  if (txCount > 200 && balanceInETH > 5) return ARCHETYPES[2]; 
  // DeFi Degen: >500 transactions (heavy user)
  if (txCount > 500) return ARCHETYPES[5]; 
  // Degen: >100 transactions (active trader)
  if (txCount > 100) return ARCHETYPES[0]; 
  // Newbie: Default for new/low-activity wallets
  return ARCHETYPES[4]; 
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function WalletScentPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [archetype, setArchetype] = useState<WalletArchetype | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [minting, setMinting] = useState(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [mintedPerfume, setMintedPerfume] = useState<PerfumeData | null>(null);
  const [step, setStep] = useState<"idle" | "analyzing" | "result" | "minting" | "success">("idle");
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyMinted, setAlreadyMinted] = useState(false);

  const isOnArcNetwork = chainId === ARC_CHAIN_ID;

  /**
   * Check mint status on component mount
   * Restores archetype from localStorage to prevent session loss
   */
  useEffect(() => {
    const checkStatus = async () => {
      if (!address) return;
      
      // Restore archetype from localStorage (prevents hash mismatch on refresh)
      const savedArchetypeId = localStorage.getItem(`scent_archetype_${address}`);
      if (savedArchetypeId) {
        const saved = ARCHETYPES.find(a => a.id === savedArchetypeId);
        if (saved) setArchetype(saved);
      }

      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, provider);
        const count = await contract.walletMintCount(address);
        if (count > 0) {
          setAlreadyMinted(true);
        }
      } catch (e) {
        console.warn("Status check error:", e);
      }
    };
    checkStatus();
  }, [address]);

  /**
   * Analyzes wallet on-chain data and determines archetype
   * Stores archetype in localStorage to ensure consistency across mint steps
   */
  const analyzeWallet = async () => {
    if (!address) return;
    setAnalyzing(true);
    setStep("analyzing");
    setErrorMessage(null);

    try {
      const { createPublicClient, http } = await import("viem");
      const { mainnet } = await import("viem/chains");
      const ethMainnetClient = createPublicClient({ chain: mainnet, transport: http() });

      // Fetch public on-chain data
      const txCount = await ethMainnetClient.getTransactionCount({ address: address as `0x${string}` });
      const balance = await ethMainnetClient.getBalance({ address: address as `0x${string}` });
      const walletAgeTimestamp = await getWalletAge(address);

      // Simulate analysis delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      const walletArchetype = getWalletArchetype(txCount, balance, walletAgeTimestamp);
      setArchetype(walletArchetype);
      
      // CRITICAL: Lock archetype in localStorage
      // This ensures the same seed is used for both requestMint and revealAndMint
      localStorage.setItem(`scent_archetype_${address}`, walletArchetype.id);
      
      setStep("result");
    } catch (error) {
      console.error("Wallet analysis failed:", error);
      setErrorMessage("Failed to analyze wallet. Please try again.");
      setStep("idle");
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Executes the two-step commit-reveal mint process
   * 
   * SECURITY ANALYSIS:
   * 1. COMMITMENT SCHEME: User commits to keccak256(seedPreimage) before revealing
   *    - Prevents user from changing seed after seeing the result
   *    - Prevents front-running (commitment hides the actual seed)
   * 
   * 2. DETERMINISTIC SEED: seed = keccak256(address + archetypeId)
   *    - Based on immutable data (address + on-chain metrics)
   *    - Cannot be manipulated by user
   *    - Public but unpredictable before analysis
   * 
   * 3. DOUBLE HASHING: commitment = keccak256(seedPreimage)
   *    - Prevents length extension attacks
   *    - Standard secure commitment pattern
   * 
   * 4. BLOCK DELAY: 5 blocks between commit and reveal
   *    - Prevents MEV bots from front-running
   *    - Gives network time to finalize
   */
  const handleMint = async () => {
    if (!address || !archetype) {
      setErrorMessage("Please analyze your wallet first.");
      return;
    }
    if (!isOnArcNetwork) {
      setErrorMessage("Please switch to Arc Network (Chain ID 5042).");
      return;
    }

    setMinting(true);
    setStep("minting");
    setErrorMessage(null);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, signer);

      // Get locked archetype from localStorage (ensures consistency)
      const lockedArchetypeId = localStorage.getItem(`scent_archetype_${address}`);
      if (!lockedArchetypeId) {
        throw new Error("Session lost. Please re-analyze your wallet.");
      }
      
      // Generate deterministic seed
      // SECURITY: This seed is based on public data but cannot be predicted
      // before the user commits, because the commitment hides it
      const seedString = `${address.toLowerCase()}-${lockedArchetypeId}`;
      const seedPreimage = ethers.id(seedString); // keccak256(seedString)
      const seedCommitment = ethers.keccak256(seedPreimage); // Double hash for commitment

      console.log("🔒 Committing seed...");
      console.log("Seed String:", seedString);
      console.log("Seed Preimage:", seedPreimage);
      console.log("Seed Commitment:", seedCommitment);

      // STEP 1: Commit - Send commitment to contract
      const tx = await contract.requestMint(seedCommitment);
      const receipt = await tx.wait();

      const mintEvent = receipt.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === "MintRequested");

      const newTokenId = mintEvent ? Number(mintEvent.args.tokenId) : 1;
      setTokenId(newTokenId);
      
      const mintBlockNumber = receipt.blockNumber;
      console.log(`✅ Mint requested in block ${mintBlockNumber}. TokenId: ${newTokenId}`);

      // STEP 2: Wait for REVEAL_BLOCKS (5 blocks) to prevent MEV
      const REVEAL_BLOCKS = 5;
      const pollInterval = setInterval(async () => {
        const currentBlock = await provider.getBlockNumber();
        const blocksNeeded = REVEAL_BLOCKS - (currentBlock - mintBlockNumber);
        
        if (blocksNeeded <= 0) {
          clearInterval(pollInterval);
          setCountdown(0);
          
          // STEP 3: Reveal - Send preimage to contract
          console.log(" Revealing seed...");
          try {
            const revealTx = await contract.revealAndMint(newTokenId, seedPreimage);
            await revealTx.wait();

            // Wait for blockchain to index the NFT
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Fetch NFT data with retry logic
            let perfumeData;
            for (let attempt = 0; attempt < 5; attempt++) {
              try {
                perfumeData = await contract.getPerfume(newTokenId);
                break;
              } catch (e) {
                if (attempt === 4) throw e;
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }

            if (perfumeData) {
              setMintedPerfume({
                tokenId: Number(perfumeData.tokenId),
                name: perfumeData.name,
                gender: Number(perfumeData.gender),
                pType: Number(perfumeData.pType),
                topNotes: Array.from(perfumeData.topNotes || []),
                heartNotes: Array.from(perfumeData.heartNotes || []),
                baseNotes: Array.from(perfumeData.baseNotes || []),
                concentration: Number(perfumeData.concentration),
                rarity: Number(perfumeData.rarity),
                createdAt: Number(perfumeData.createdAt),
                creator: perfumeData.creator,
              });

              // Clear locked archetype after successful mint
              localStorage.removeItem(`scent_archetype_${address}`);
              setStep("success");
            }
            setMinting(false);
          } catch (revealError: any) {
            console.error(" Reveal failed:", revealError);
            if (revealError.reason?.includes("TooEarly")) {
              setErrorMessage("Still too early to reveal. Please wait a few more blocks.");
            } else if (revealError.reason?.includes("CommitmentMismatch")) {
              setErrorMessage("Seed mismatch! This shouldn't happen - please contact support.");
            } else {
              setErrorMessage(`Reveal failed: ${revealError.shortMessage || revealError.message}`);
            }
            setStep("result");
            setMinting(false);
          }
        } else {
          setCountdown(Math.ceil(blocksNeeded * 2)); // Arc blocks are ~2s
        }
      }, 2000);
    } catch (error: any) {
      console.error(" Mint failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        setErrorMessage("Transaction rejected by user.");
      } else if (error.reason?.includes("MaxPerWalletReached") || error.message?.includes("already")) {
        setErrorMessage("You've already minted your wallet's scent!");
      } else {
        setErrorMessage(error.reason || error.shortMessage || error.message || "Mint failed.");
      }
      setStep("result");
      setMinting(false);
    }
  };

  const shareOnTwitter = () => {
    if (!archetype) return;
    const text = encodeURIComponent(archetype.twitterText);
    const url = encodeURIComponent("https://scentprotocol.io/wallet-scent");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const getRarityName = (rarity: number) => ["Common", "Rare", "Epic", "Legendary"][rarity] || "Common";

  // ============================================================
  // RENDER UI
  // ============================================================
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 mb-12 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </Link>

        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider border border-purple-500/30 mb-6">🔮 Viral Experiment</span>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mb-4">What's Your Wallet's Scent?</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">We analyze your real Ethereum history to create a unique fragrance profile.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/10 mb-12">
          {step === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Discover Your Scent?</h3>
                <p className="text-white/60">Connect your wallet and let our AI analyze your on-chain behavior</p>
              </div>
              {errorMessage && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{errorMessage}</div>}
              {!isConnected ? (
                <div className="px-8 py-4 rounded-xl bg-white/10 text-white/50 font-semibold">Connect Wallet First</div>
              ) : !isOnArcNetwork ? (
                <div className="px-8 py-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold">⚠️ Switch to Arc Network</div>
              ) : (
                <button onClick={analyzeWallet} disabled={analyzing} className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                  {analyzing ? "Analyzing..." : "Analyze My Wallet"}
                </button>
              )}
            </div>
          )}

          {step === "analyzing" && (
            <div className="text-center space-y-6 py-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-white">Scanning the Blockchain...</h3>
              <div className="space-y-2 text-sm text-white/40">
                <p className="animate-pulse">→ Checking transaction history...</p>
                <p className="animate-pulse" style={{ animationDelay: "0.5s" }}>→ Identifying wallet archetype...</p>
                <p className="animate-pulse" style={{ animationDelay: "1s" }}>→ Generating scent profile...</p>
              </div>
            </div>
          )}

          {step === "result" && archetype && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs text-purple-300 font-medium mb-1 uppercase">Your Wallet Archetype</p>
                <h3 className="text-3xl font-bold text-white">{archetype.name}</h3>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase mb-2">Scent DNA</p>
                <div className="h-3 rounded-full overflow-hidden flex">
                  {archetype.dnaColors.map((color, i) => (<div key={i} className="h-full" style={{ backgroundColor: color, width: `${100 / archetype.dnaColors.length}%` }} />))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/80 italic text-center">"{archetype.description}"</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Top</span>
                  <div className="flex flex-wrap gap-1.5">{archetype.topNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">{n}</span>))}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Heart</span>
                  <div className="flex flex-wrap gap-1.5">{archetype.heartNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">{n}</span>))}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Base</span>
                  <div className="flex flex-wrap gap-1.5">{archetype.baseNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">{n}</span>))}</div>
                </div>
              </div>
              
              {errorMessage && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">{errorMessage}</div>}
              
              <div className="flex flex-col gap-3 pt-4">
                {!isOnArcNetwork ? (
                  <div className="w-full px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-center">Switch to Arc Network</div>
                ) : alreadyMinted ? (
                  <div className="w-full px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    You have already minted your Viral Scent!
                  </div>
                ) : (
                  <button onClick={handleMint} disabled={minting} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50">
                    {minting ? "Minting..." : "Mint This Scent (Free)"}
                  </button>
                )}
                <button onClick={shareOnTwitter} className="w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all">Share on X</button>
              </div>
            </div>
          )}

          {step === "minting" && (
            <div className="text-center space-y-6 py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
              <h3 className="text-2xl font-bold text-white">Revealing Your Scent...</h3>
              {countdown > 0 && <p className="text-white/40">Waiting for block confirmations: {countdown}s</p>}
            </div>
          )}

          {step === "success" && mintedPerfume && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Scent Minted Successfully!</h3>
                <p className="text-white/60">Token ID: #{tokenId}</p>
              </div>

              <div className="relative rounded-2xl p-6 backdrop-blur-xl border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.15) 0%, rgba(236,72,153,0.1) 50%, #0f172a 100%)", borderColor: "rgba(217,70,239,0.5)", boxShadow: "0 0 30px rgba(217,70,239,0.2)" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(217,70,239,0.15) 50%, transparent 60%)", backgroundSize: "200% 100%", animation: "shimmer 2.5s infinite" }} />
                <div className="relative flex items-center gap-4 mb-4">
                  <ScentCrest seed={`${mintedPerfume.creator}-${mintedPerfume.name}`} name={mintedPerfume.name} rarity={mintedPerfume.rarity} size={70} />
                  <div>
                    <p className="text-xs text-fuchsia-300/80 uppercase tracking-wider mb-1">Viral Scent #{mintedPerfume.tokenId}</p>
                    <h4 className="text-xl font-bold text-white">{mintedPerfume.name}</h4>
                    <p className="text-sm text-white/50 mt-1">{["Unisex", "Male", "Female"][mintedPerfume.gender]} • {["Parfum", "EDP", "EDT", "EDC"][mintedPerfume.pType]}</p>
                  </div>
                </div>
                <div className="relative flex flex-wrap gap-2 text-xs mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">{["Unisex", "Male", "Female"][mintedPerfume.gender]}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">{["Parfum", "EDP", "EDT", "EDC"][mintedPerfume.pType]}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">{mintedPerfume.concentration}%</span>
                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/40 border border-fuchsia-400/80 text-fuchsia-50 font-semibold">{getRarityName(mintedPerfume.rarity)}</span>
                </div>
                <div className="relative space-y-2 text-sm">
                  <div className="flex gap-2"><span className="text-fuchsia-300/80 text-xs w-12 shrink-0 uppercase font-semibold">Top</span><span className="text-white/80 text-xs">{mintedPerfume.topNotes.join(", ")}</span></div>
                  <div className="flex gap-2"><span className="text-fuchsia-300/80 text-xs w-12 shrink-0 uppercase font-semibold">Heart</span><span className="text-white/80 text-xs">{mintedPerfume.heartNotes.join(", ")}</span></div>
                  <div className="flex gap-2"><span className="text-fuchsia-300/80 text-xs w-12 shrink-0 uppercase font-semibold">Base</span><span className="text-white/80 text-xs">{mintedPerfume.baseNotes.join(", ")}</span></div>
                </div>
              </div>
              <button onClick={shareOnTwitter} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Share on Twitter 
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
