"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount, useChainId } from "wagmi";
import ScentCrest from "@/components/ScentCrest";
import MintReveal from "@/components/MintReveal";
import Confetti from "@/components/wallet-scent/Confetti";
import MintProgress from "@/components/wallet-scent/MintProgress";
import ScentBottle from "@/components/wallet-scent/ScentBottle";
import ScentScan from "@/components/wallet-scent/ScentScan";
import type { ScanMetrics } from "@/components/wallet-scent/ScentScan";

// ============================================================
// CONTRACT CONFIGURATION
// ============================================================
const VIRAL_CONTRACT_ADDRESS = "0x55A3527C87190fa8456De46247b52214287e8688";
const ARC_CHAIN_ID = 5042;
const ARC_RPC = "https://rpc.mainnet.arc.io";
// The contract needs more than 5 blocks between commit and reveal, so wait for 6.
const BLOCKS_TO_MATURE = 6;

const VIRAL_ABI = [
  "function requestMint(bytes32 seedCommitment) external returns (uint256)",
  "function revealAndMint(uint256 tokenId, bytes32 seedPreimage) external",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator))",
  "function walletMintCount(address) external view returns (uint256)",
  "function pendingTokenId(address) external view returns (uint256)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)"
];

// ============================================================
// WALLET ARCHETYPES (public data, decided by on-chain metrics)
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

type Step = "idle" | "scanning" | "result" | "minting" | "celebrate" | "success";

// ============================================================
// HELPERS
// ============================================================
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"];
const CONFETTI_BY_RARITY = [40, 70, 110, 170];

function getReadProvider(): ethers.Provider {
  const eth = typeof window !== "undefined" ? (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum : undefined;
  return eth ? new ethers.BrowserProvider(eth) : new ethers.JsonRpcProvider(ARC_RPC);
}

/**
 * Age of the wallet in years, from its first Ethereum transaction (Blockscout, no key needed).
 * Returns 0 for a wallet with no transactions and -1 when the lookup failed.
 * The Etherscan V1 endpoint this page used before has been shut down, so age was always missing.
 */
async function getWalletAgeYears(address: string): Promise<number> {
  try {
    const url = `https://eth.blockscout.com/api?module=account&action=txlist&address=${address}&sort=asc&page=1&offset=1`;
    const res = await fetch(url);
    const data = await res.json();
    const first = Array.isArray(data.result) ? data.result[0] : null;
    if (!first) return 0;
    return Math.max(0, (Date.now() / 1000 - Number(first.timeStamp)) / 31557600);
  } catch (error) {
    console.error("Failed to get wallet age:", error);
    return -1;
  }
}

/** Same rules as before. The archetype is deterministic for a given wallet. */
function getWalletArchetype(txCount: number, balanceEth: number, ageYears: number): WalletArchetype {
  const age = Math.max(0, ageYears);
  if (balanceEth > 100) return ARCHETYPES[3];
  if (age >= 1 && txCount < 100 && balanceEth >= 0.01) return ARCHETYPES[1];
  if (txCount > 200 && balanceEth > 5) return ARCHETYPES[2];
  if (txCount > 500) return ARCHETYPES[5];
  if (txCount > 100) return ARCHETYPES[0];
  return ARCHETYPES[4];
}

async function waitForBlocks(provider: ethers.Provider, from: number, count: number, onProgress: (done: number) => void, cancelled: () => boolean) {
  for (;;) {
    if (cancelled()) throw new Error("cancelled");
    const done = Math.max(0, (await provider.getBlockNumber()) - from);
    onProgress(Math.min(done, count));
    if (done >= count) return;
    await sleep(600);
  }
}

function explainError(e: unknown): string {
  const err = e as { code?: number | string; reason?: string; shortMessage?: string; message?: string };
  if (err.code === 4001 || err.code === "ACTION_REJECTED") return "Transaction rejected. Your scent is still waiting for you.";
  if (err.message === "cancelled") return "";
  if (err.reason?.includes("MaxPerWalletReached") || err.message?.includes("already")) return "You have already minted your wallet's scent.";
  return err.reason || err.shortMessage || err.message || "Something went wrong. Please try again.";
}

function toPerfume(p: ethers.Result): PerfumeData {
  return {
    tokenId: Number(p.tokenId),
    name: p.name,
    gender: Number(p.gender),
    pType: Number(p.pType),
    topNotes: Array.from(p.topNotes || []) as string[],
    heartNotes: Array.from(p.heartNotes || []) as string[],
    baseNotes: Array.from(p.baseNotes || []) as string[],
    concentration: Number(p.concentration),
    rarity: Number(p.rarity),
    createdAt: Number(p.createdAt),
    creator: p.creator,
  };
}

/** Simulate first so a failed reveal costs no gas, then send it and read the new scent. */
async function revealAndFetch(contract: ethers.Contract, tokenId: number, preimage: string): Promise<PerfumeData> {
  await contract.revealAndMint.staticCall(tokenId, preimage);
  const tx = await contract.revealAndMint(tokenId, preimage);
  await tx.wait();
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return toPerfume(await contract.getPerfume(tokenId));
    } catch (e) {
      if (attempt === 5) throw e;
      await sleep(1500);
    }
  }
  throw new Error("Could not read your new scent.");
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function WalletScentPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isOnArcNetwork = chainId === ARC_CHAIN_ID;

  const [step, setStep] = useState<Step>("idle");
  const [metrics, setMetrics] = useState<ScanMetrics>({ txCount: null, balanceEth: null, ageYears: null });
  const [archetype, setArchetype] = useState<WalletArchetype | null>(null);
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [blocksDone, setBlocksDone] = useState(0);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [mintedPerfume, setMintedPerfume] = useState<PerfumeData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyMinted, setAlreadyMinted] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Restore the saved archetype and look for a mint that was started but not revealed.
  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`scent_archetype_${address}`);
    const found = ARCHETYPES.find((a) => a.id === saved);
    if (found) setArchetype(found);
    (async () => {
      try {
        const contract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, getReadProvider());
        setAlreadyMinted(Number(await contract.walletMintCount(address)) > 0);
        const pending = Number(await contract.pendingTokenId(address));
        setPendingId(pending > 0 ? pending : null);
      } catch (e) {
        console.warn("Status check error:", e);
      }
    })();
  }, [address]);

  const analyzeWallet = async () => {
    if (!address) return;
    setErrorMessage(null);
    setMetrics({ txCount: null, balanceEth: null, ageYears: null });
    setStep("scanning");
    try {
      const { createPublicClient, http } = await import("viem");
      const { mainnet } = await import("viem/chains");
      const client = createPublicClient({ chain: mainnet, transport: http() });
      const account = address as `0x${string}`;
      // Start all three lookups together, then show each reading as it lands.
      const txP = client.getTransactionCount({ address: account });
      const balP = client.getBalance({ address: account });
      const ageP = getWalletAgeYears(address);

      const txCount = await txP;
      setMetrics((m) => ({ ...m, txCount }));
      await sleep(900);
      const balanceEth = Number(await balP) / 1e18;
      setMetrics((m) => ({ ...m, balanceEth }));
      await sleep(900);
      const ageYears = await ageP;
      setMetrics((m) => ({ ...m, ageYears }));
      await sleep(1100);

      const result = getWalletArchetype(txCount, balanceEth, ageYears);
      localStorage.setItem(`scent_archetype_${address}`, result.id);
      if (!alive.current) return;
      setArchetype(result);
      setStep("result");
    } catch (error) {
      console.error("Wallet analysis failed:", error);
      setErrorMessage("Could not read your wallet right now. Please try again.");
      setStep("idle");
    }
  };

  const finish = (perfume: PerfumeData, id: number) => {
    if (!alive.current) return;
    localStorage.removeItem(`scent_archetype_${address}`);
    localStorage.removeItem(`scent_pending_${address}`);
    setTokenId(id);
    setMintedPerfume(perfume);
    setPendingId(null);
    setAlreadyMinted(true);
    setStage(4);
    setStep("celebrate");
  };

  /** Seal (commit), let it mature for a few blocks, then open (reveal). */
  const handleMint = async () => {
    if (!address || !archetype) return setErrorMessage("Please read your wallet first.");
    if (!isOnArcNetwork) return setErrorMessage("Please switch to Arc Network (Chain ID 5042).");
    const lockedId = localStorage.getItem(`scent_archetype_${address}`);
    if (!lockedId) return setErrorMessage("Session lost. Please read your wallet again.");

    setErrorMessage(null);
    setStage(1);
    setBlocksDone(0);
    setStep("minting");
    try {
      const provider = new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
      const contract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, await provider.getSigner());
      const seedPreimage = ethers.id(`${address.toLowerCase()}-${lockedId}`);
      const seedCommitment = ethers.keccak256(seedPreimage);

      await contract.requestMint.staticCall(seedCommitment);
      const receipt = await (await contract.requestMint(seedCommitment)).wait();
      const event = receipt.logs
        .map((log: ethers.Log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "MintRequested");
      const newTokenId = event ? Number(event.args.tokenId) : 0;
      if (!newTokenId) throw new Error("Could not find your token ID. Reload and use Finish your reveal.");
      localStorage.setItem(`scent_pending_${address}`, JSON.stringify({ tokenId: newTokenId, archetypeId: lockedId }));

      setStage(2);
      await waitForBlocks(provider, receipt.blockNumber, BLOCKS_TO_MATURE, setBlocksDone, () => !alive.current);
      setStage(3);
      finish(await revealAndFetch(contract, newTokenId, seedPreimage), newTokenId);
    } catch (e) {
      const message = explainError(e);
      if (message) setErrorMessage(message);
      if (alive.current) setStep("result");
    }
  };

  /** Finish a mint that was committed but never revealed (closed tab, refresh). */
  const handleResume = async () => {
    if (!address || pendingId === null) return;
    setErrorMessage(null);
    setStage(3);
    setBlocksDone(BLOCKS_TO_MATURE);
    setStep("minting");
    try {
      const provider = new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
      const contract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, await provider.getSigner());
      const savedPending = JSON.parse(localStorage.getItem(`scent_pending_${address}`) || "null") as { archetypeId?: string } | null;
      const savedId = localStorage.getItem(`scent_archetype_${address}`);
      // The seed is address + archetype, so at most six candidates exist. Try the likely ones first.
      const ids = Array.from(new Set([savedPending?.archetypeId, savedId, ...ARCHETYPES.map((a) => a.id)].filter(Boolean))) as string[];
      let match: { id: string; preimage: string } | null = null;
      for (let pass = 0; pass < 10 && !match; pass++) {
        for (const id of ids) {
          const preimage = ethers.id(`${address.toLowerCase()}-${id}`);
          try {
            await contract.revealAndMint.staticCall(pendingId, preimage);
            match = { id, preimage };
            break;
          } catch {
            /* wrong seed or still too early, try the next one */
          }
        }
        if (!match) await sleep(1000);
      }
      if (!match) throw new Error("Could not finish the reveal. The reveal window may have closed.");
      setArchetype(ARCHETYPES.find((a) => a.id === match!.id) ?? null);
      finish(await revealAndFetch(contract, pendingId, match.preimage), pendingId);
    } catch (e) {
      const message = explainError(e);
      if (message) setErrorMessage(message);
      if (alive.current) setStep("idle");
    }
  };

  const shareOnX = () => {
    const rarity = mintedPerfume ? ` I got a ${RARITY_NAMES[mintedPerfume.rarity] ?? "Common"} one.` : "";
    const text = encodeURIComponent(`${archetype?.twitterText ?? "Find out what your wallet smells like."}${rarity}`);
    const url = encodeURIComponent("https://scentprotocol.io/wallet-scent");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const mintButtonLabel = "Mint This Scent (Free)";

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-amber-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </Link>

        <div className="mb-12 text-center">
          <span className="mb-6 inline-block rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">Viral Experiment</span>
          <h1 className="mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">What&apos;s Your Wallet&apos;s Scent?</h1>
          <p className="mx-auto max-w-2xl text-xl text-white/60">We read your real Ethereum history to blend a fragrance that is yours alone.</p>
        </div>

        <div className="glass-card mb-12 rounded-2xl border border-white/10 p-8">
          {errorMessage && step !== "success" && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400" role="alert">{errorMessage}</div>
          )}

          {step === "idle" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <svg className="h-16 w-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">Ready to Discover Your Scent?</h3>
                <p className="text-white/60">Connect your wallet and we will read your on-chain story.</p>
              </div>
              {pendingId !== null && isConnected && isOnArcNetwork && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
                  <p className="mb-3 text-sm text-amber-200">You have a scent that was sealed but not opened yet.</p>
                  <button onClick={handleResume} className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400">Finish your reveal</button>
                </div>
              )}
              {!isConnected ? (
                <div className="rounded-xl bg-white/10 px-8 py-4 font-semibold text-white/50">Connect Wallet First</div>
              ) : !isOnArcNetwork ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/20 px-8 py-4 font-semibold text-amber-300">Switch to Arc Network</div>
              ) : (
                <button onClick={analyzeWallet} className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105">Read My Wallet</button>
              )}
            </div>
          )}

          {step === "scanning" && <ScentScan metrics={metrics} />}

          {step === "result" && archetype && (
            <div className="space-y-8">
              <ScentBottle name={archetype.name} description={archetype.description} colors={archetype.dnaColors} topNotes={archetype.topNotes} heartNotes={archetype.heartNotes} baseNotes={archetype.baseNotes} />
              <div className="flex flex-col gap-3 pt-2">
                {!isOnArcNetwork ? (
                  <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/20 px-6 py-3 text-center font-semibold text-amber-300">Switch to Arc Network</div>
                ) : alreadyMinted ? (
                  <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-6 py-3 text-center font-semibold text-emerald-300">You have already minted your Viral Scent.</div>
                ) : (
                  <button onClick={handleMint} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105">{mintButtonLabel}</button>
                )}
                <button onClick={shareOnX} className="w-full rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20">Share on X</button>
              </div>
            </div>
          )}

          {step === "minting" && (
            <div className="space-y-6 py-4">
              <h3 className="text-center text-2xl font-bold text-white">Bottling your scent</h3>
              <MintProgress stage={stage} blocksDone={blocksDone} blocksTotal={BLOCKS_TO_MATURE} />
              <p className="text-center text-xs text-white/40">Keep this tab open. If you close it, come back to this page and press Finish your reveal.</p>
            </div>
          )}

          {step === "celebrate" && mintedPerfume && tokenId !== null && (
            <>
              <Confetti count={CONFETTI_BY_RARITY[mintedPerfume.rarity] ?? 40} colors={archetype?.dnaColors} />
              <MintReveal tokenId={tokenId} perfume={mintedPerfume} description={archetype?.description ?? ""} onComplete={() => setStep("success")} />
            </>
          )}

          {step === "success" && mintedPerfume && tokenId !== null && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="mb-1 text-2xl font-bold text-emerald-400">Your scent is minted</h3>
                <p className="text-white/60">Viral Scent #{tokenId} is in your wallet.</p>
              </div>
              <div className="rounded-2xl border p-6" style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.15), rgba(236,72,153,0.1) 50%, #0f172a)", borderColor: "rgba(217,70,239,0.5)" }}>
                <div className="mb-4 flex items-center gap-4">
                  <ScentCrest seed={`${mintedPerfume.creator}-${mintedPerfume.name}`} name={mintedPerfume.name} rarity={mintedPerfume.rarity} size={70} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-fuchsia-300/80">Viral Scent #{tokenId}</p>
                    <h4 className="text-xl font-bold text-white">{mintedPerfume.name}</h4>
                    <p className="mt-1 text-sm text-white/50">{RARITY_NAMES[mintedPerfume.rarity] ?? "Common"} &bull; {mintedPerfume.concentration}%</p>
                  </div>
                </div>
                <p className="text-xs text-white/70">{[...mintedPerfume.topNotes, ...mintedPerfume.heartNotes, ...mintedPerfume.baseNotes].join(", ")}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={shareOnX} className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105">Share on X</button>
                <Link href={`/nft/${tokenId}?contract=${VIRAL_CONTRACT_ADDRESS}`} className="rounded-xl bg-white/10 px-6 py-3 text-center font-semibold text-white transition-all hover:bg-white/20">View details and hear it</Link>
              </div>
              <Link href="/collection" className="block text-center text-sm text-white/50 underline hover:text-white">Go to my collection</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
