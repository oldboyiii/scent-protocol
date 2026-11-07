"use client";

// Drop-in replacement for frontend/src/app/alchemy/page.tsx.
// Works with the two-step ScentAlchemy contract (requestBlend, then revealBlend).
// Needs docs/alchemy/AlchemyParts.tsx (put it at src/components/AlchemyParts.tsx)
// and the new AlchemyReveal.tsx.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import {
  ALCHEMY_ABI,
  ALCHEMY_ADDRESS,
  CONTRACT_ADDRESS,
  SCENT_PROTOCOL_ABI,
  USDC_ABI,
  USDC_ADDRESS,
  getProvider,
} from "@/utils/contract";
import AlchemyReveal from "@/components/AlchemyReveal";
import type { AlchemyStatus, HybridInfo, ParentInfo } from "@/components/AlchemyReveal";
import { AlchemySlot, NFTCard } from "@/components/AlchemyParts";
import type { SelectedNFT } from "@/components/AlchemyParts";

// Functions the page needs that the shared ABI may not list yet. Duplicates are ignored by ethers.
const ALCHEMY_EXTRA_ABI = [
  "function REVEAL_BLOCKS() view returns (uint256)",
  "function REVEAL_WINDOW() view returns (uint256)",
  "function cancelExpiredBlend(uint256 blendId)",
];
const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.io";

interface PendingState {
  blendId: number;
  blockNumber: number;
  parent1: ParentInfo;
  parent2: ParentInfo;
}
interface ResultState {
  parent1: ParentInfo;
  parent2: ParentInfo;
  hybrid: HybridInfo;
}

const alchemyAt = (runner: ethers.ContractRunner) =>
  new ethers.Contract(ALCHEMY_ADDRESS, [...ALCHEMY_ABI, ...ALCHEMY_EXTRA_ABI], runner);
const mainAt = (runner: ethers.ContractRunner) => new ethers.Contract(CONTRACT_ADDRESS, SCENT_PROTOCOL_ABI, runner);
const storageKey = (user: string) => `scent-alchemy-pending:${user.toLowerCase()}`;

async function getSigner() {
  const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
  if (!eth) throw new Error("No wallet found. Connect a wallet first.");
  return new ethers.BrowserProvider(eth).getSigner();
}

function explain(err: unknown): string {
  const e = err as { code?: string | number; shortMessage?: string; reason?: string; message?: string };
  if (e.code === 4001 || e.code === "ACTION_REJECTED") return "Transaction rejected in your wallet.";
  const text = e.reason || e.shortMessage || e.message || "";
  if (/TooLate/i.test(text)) return "The reveal window closed. Recover your fragrances instead.";
  if (/TooEarly/i.test(text)) return "Reveal is not open yet. Wait a few more blocks.";
  if (/Paused/i.test(text)) return "Alchemy is paused right now.";
  if (/FeeExceedsMax/i.test(text)) return "The fee changed. Refresh the page and try again.";
  return text.slice(0, 220) || "Something went wrong. Check the console.";
}

function toNFT(id: bigint | number, p: any): SelectedNFT {
  return {
    tokenId: Number(id),
    contractAddress: CONTRACT_ADDRESS,
    name: p.name,
    rarity: Number(p.rarity),
    gender: Number(p.gender),
    pType: Number(p.pType),
    concentration: Number(p.concentration),
    topNotes: Array.from(p.topNotes || []).map(String),
    heartNotes: Array.from(p.heartNotes || []).map(String),
    baseNotes: Array.from(p.baseNotes || []).map(String),
    creator: p.creator,
  };
}

export default function AlchemyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [slot1, setSlot1] = useState<SelectedNFT | null>(null);
  const [slot2, setSlot2] = useState<SelectedNFT | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const [userNFTs, setUserNFTs] = useState<SelectedNFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [busy, setBusy] = useState<null | "request" | "reveal" | "recover">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fee, setFee] = useState<bigint | null>(null);
  const [paused, setPaused] = useState(false);
  const [timing, setTiming] = useState({ revealBlocks: 5, window: 250 });
  const [pending, setPending] = useState<PendingState | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Contract settings: read on-chain instead of hard-coding the fee or timing.
  useEffect(() => {
    const read = alchemyAt(getProvider());
    Promise.all([read.blendFee(), read.isPaused(), read.REVEAL_BLOCKS(), read.REVEAL_WINDOW()])
      .then(([f, p, rb, w]) => {
        setFee(f as bigint);
        setPaused(Boolean(p));
        setTiming({ revealBlocks: Number(rb), window: Number(w) });
      })
      .catch((e) => console.error("Failed to read Alchemy settings:", e));
  }, []);

  // A refresh must not lose a blend that is already locked on-chain.
  const restorePending = useCallback(async (user: string) => {
    const read = alchemyAt(getProvider());
    const main = mainAt(getProvider());
    const mine = async (blendId: number) => {
      const p = await read.pendingBlends(blendId);
      return String(p.blender).toLowerCase() === user.toLowerCase();
    };
    try {
      const raw = localStorage.getItem(storageKey(user));
      if (raw) {
        const saved = JSON.parse(raw) as PendingState;
        if (await mine(saved.blendId)) {
          setPending(saved);
          return;
        }
        localStorage.removeItem(storageKey(user));
      }
    } catch {
      /* fall through to the event scan */
    }
    try {
      const latest = await getProvider().getBlockNumber();
      let logs: ethers.Log[] = [];
      for (const span of [20000, 2000]) {
        try {
          logs = await read.queryFilter(read.filters.BlendRequested(null, user), Math.max(0, latest - span), latest);
          break;
        } catch {
          /* RPC range limit, try a smaller span */
        }
      }
      for (const log of logs.reverse()) {
        const args = (log as ethers.EventLog).args;
        const blendId = Number(args.blendId);
        if (!(await mine(blendId))) continue;
        const [pa, pb] = await Promise.all([main.getPerfume(args.tokenId1), main.getPerfume(args.tokenId2)]);
        const state: PendingState = {
          blendId,
          blockNumber: Number(args.blockNumber),
          parent1: { tokenId: Number(args.tokenId1), name: pa.name, rarity: Number(pa.rarity) },
          parent2: { tokenId: Number(args.tokenId2), name: pb.name, rarity: Number(pb.rarity) },
        };
        localStorage.setItem(storageKey(user), JSON.stringify(state));
        setPending(state);
        return;
      }
    } catch (e) {
      console.error("Could not look for an open blend:", e);
    }
  }, []);

  useEffect(() => {
    if (address) void restorePending(address);
    else setPending(null);
  }, [address, restorePending]);

  // Track the real block number while a blend is open.
  useEffect(() => {
    if (!pending) return;
    let live = true;
    const tick = () => {
      getProvider()
        .getBlockNumber()
        .then((n) => live && setCurrentBlock(n))
        .catch(() => undefined);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [pending]);

  const loadUserNFTs = async () => {
    if (!address) return;
    setIsLoadingNFTs(true);
    try {
      const main = mainAt(getProvider());
      const ids: bigint[] = await main.getOwnerTokens(address);
      const rows = await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await main.getPerfume(id);
            return p?.name ? toNFT(id, p) : null;
          } catch {
            return null;
          }
        })
      );
      setUserNFTs(rows.filter((r): r is SelectedNFT => r !== null));
    } catch (err) {
      console.error("Failed to load user NFTs:", err);
      setError("Failed to load your NFTs. Please try again.");
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const openSelector = (slot: 1 | 2) => {
    setActiveSlot(slot);
    setShowSelector(true);
    void loadUserNFTs();
  };

  const selectNFT = (nft: SelectedNFT) => {
    const other = activeSlot === 1 ? slot2 : slot1;
    if (other && other.tokenId === nft.tokenId) {
      setError("Cannot use the same NFT in both slots.");
      return;
    }
    if (activeSlot === 1) setSlot1(nft);
    else setSlot2(nft);
    setShowSelector(false);
    setError(null);
  };

  // STEP 1: lock both fragrances and the fee. Nothing is burned yet.
  const handleRequest = async () => {
    if (!address || !slot1 || !slot2) return;
    setBusy("request");
    setError(null);
    setNotice(null);
    try {
      const signer = await getSigner();
      const alchemy = alchemyAt(signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const main = mainAt(signer);

      const feeNow = (await alchemy.blendFee()) as bigint;
      if ((await alchemy.isPaused()) as boolean) throw new Error("Alchemy is paused right now.");
      if ((await usdc.balanceOf(address)) < feeNow) {
        throw new Error(`Insufficient USDC. You need at least ${ethers.formatUnits(feeNow, 6)} USDC.`);
      }
      // Exact-amount approvals only: the fee for USDC, one token at a time for the NFTs.
      if ((await usdc.allowance(address, ALCHEMY_ADDRESS)) < feeNow) {
        await (await usdc.approve(ALCHEMY_ADDRESS, feeNow)).wait();
      }
      if (!(await main.isApprovedForAll(address, ALCHEMY_ADDRESS))) {
        for (const id of [slot1.tokenId, slot2.tokenId]) {
          const approved = String(await main.getApproved(id));
          if (approved.toLowerCase() !== ALCHEMY_ADDRESS.toLowerCase()) {
            await (await main.approve(ALCHEMY_ADDRESS, id)).wait();
          }
        }
      }

      // Simulate first so a doomed request fails with a reason instead of costing gas.
      await alchemy.requestBlend.staticCall(slot1.tokenId, slot2.tokenId, address, feeNow);
      const tx = await alchemy.requestBlend(slot1.tokenId, slot2.tokenId, address, feeNow);
      setTxHash(tx.hash);
      const receipt = await tx.wait();

      let state: PendingState | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = alchemy.interface.parseLog(log);
          if (parsed?.name === "BlendRequested") {
            state = {
              blendId: Number(parsed.args.blendId),
              blockNumber: Number(parsed.args.blockNumber),
              parent1: { tokenId: slot1.tokenId, name: slot1.name, rarity: slot1.rarity },
              parent2: { tokenId: slot2.tokenId, name: slot2.name, rarity: slot2.rarity },
            };
          }
        } catch {
          /* log from another contract */
        }
      }
      if (!state) throw new Error("The blend was sent but its ID could not be read. Refresh the page to find it.");
      localStorage.setItem(storageKey(address), JSON.stringify(state));
      setCurrentBlock(receipt.blockNumber);
      setPending(state);
    } catch (err) {
      console.error("Request blend failed:", err);
      setError(explain(err));
    } finally {
      setBusy(null);
    }
  };

  // STEP 2: burn the parents and mint the hybrid.
  const handleReveal = async () => {
    if (!pending || !address) return;
    setBusy("reveal");
    setError(null);
    try {
      const signer = await getSigner();
      const alchemy = alchemyAt(signer);
      await alchemy.revealBlend.staticCall(pending.blendId);
      const tx = await alchemy.revealBlend(pending.blendId);
      setTxHash(tx.hash);
      const receipt = await tx.wait();

      let hybridId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = alchemy.interface.parseLog(log);
          if (parsed?.name === "ScentBlended") hybridId = Number(parsed.args.hybridId);
        } catch {
          /* log from another contract */
        }
      }
      if (hybridId === null) throw new Error("Revealed, but the new hybrid could not be found. Check your collection.");
      const h = await alchemyAt(getProvider()).getHybridPerfume(hybridId);
      localStorage.removeItem(storageKey(address));
      setResult({
        parent1: pending.parent1,
        parent2: pending.parent2,
        hybrid: {
          hybridId,
          name: h.name,
          rarity: Number(h.rarity),
          gender: Number(h.gender),
          pType: Number(h.pType),
          concentration: Number(h.concentration),
          topNotes: Array.from(h.topNotes as string[]).map(String),
          heartNotes: Array.from(h.heartNotes as string[]).map(String),
          baseNotes: Array.from(h.baseNotes as string[]).map(String),
        },
      });
      setPending(null);
    } catch (err) {
      console.error("Reveal failed:", err);
      setError(explain(err));
    } finally {
      setBusy(null);
    }
  };

  // After the window closes, only the blender can take the fragrances back (the fee is kept).
  const handleRecover = async () => {
    if (!pending || !address) return;
    setBusy("recover");
    setError(null);
    try {
      const alchemy = alchemyAt(await getSigner());
      await alchemy.cancelExpiredBlend.staticCall(pending.blendId);
      await (await alchemy.cancelExpiredBlend(pending.blendId)).wait();
      localStorage.removeItem(storageKey(address));
      setPending(null);
      setSlot1(null);
      setSlot2(null);
      setNotice("Your two fragrances are back in your wallet. The alchemy fee was kept.");
    } catch (err) {
      console.error("Recover failed:", err);
      setError(explain(err));
    } finally {
      setBusy(null);
    }
  };

  const revealAt = pending ? pending.blockNumber + timing.revealBlocks + 1 : 0;
  const expiresAt = pending ? pending.blockNumber + timing.window : 0;
  let status: AlchemyStatus = "waiting";
  if (busy === "reveal") status = "revealing";
  else if (currentBlock > 0 && currentBlock > expiresAt) status = "expired";
  else if (currentBlock >= revealAt) status = "ready";

  const feeLabel = fee !== null ? `${ethers.formatUnits(fee, 6)} USDC` : "the alchemy fee";
  const canStart = isConnected && !!slot1 && !!slot2 && !busy && !paused && fee !== null && !pending;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <Link href="/collection" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-colors">
        ← Back to Collection
      </Link>

      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-500 bg-clip-text text-transparent">
          Scent Alchemy Lab
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Fuse two fragrance NFTs into a new <span className="text-cyan-400 font-semibold">Hybrid</span>. The two parents
          are burned for good when the hybrid is revealed.
        </p>
      </div>

      {paused && <Banner tone="amber">Alchemy is paused right now. Existing blends can still be revealed or recovered.</Banner>}
      {notice && <Banner tone="cyan">{notice}</Banner>}
      {error && !pending && <Banner tone="red">{error}</Banner>}

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 my-12">
        <AlchemySlot nft={slot1} onClick={() => openSelector(1)} />
        <div className="text-sm font-semibold uppercase tracking-widest text-cyan-400">fuse</div>
        <AlchemySlot nft={slot2} onClick={() => openSelector(2)} />
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
          <p className="text-sm text-white/60">Alchemy Fee</p>
          <p className="text-2xl font-bold text-cyan-400">{feeLabel}</p>
        </div>
        <ol className="space-y-1 text-xs text-white/50 list-decimal list-inside">
          <li>Lock: your two fragrances and the fee are held by the lab. Nothing is burned yet.</li>
          <li>Wait a few seconds for the reveal to open.</li>
          <li>Reveal within about two minutes. This burns the parents and mints your hybrid. If you miss the window you can take your fragrances back, but the fee is kept.</li>
        </ol>
        <button
          onClick={handleRequest}
          disabled={!canStart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {busy === "request" ? "Locking your fragrances..." : "Start fusion"}
        </button>
        {!isConnected && <p className="text-center text-sm text-white/40">Connect your wallet to begin.</p>}
      </div>

      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowSelector(false)}>
          <div className="relative w-full max-w-5xl bg-slate-900/95 border border-white/10 rounded-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Select an NFT from your Wallet</h3>
              <button onClick={() => setShowSelector(false)} aria-label="Close" className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            {isLoadingNFTs ? (
              <div className="text-center py-12 text-white/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                Loading your NFTs...
              </div>
            ) : userNFTs.length === 0 ? (
              <div className="text-center py-12 text-white/50">No NFTs found in your wallet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                  <button key={nft.tokenId} onClick={() => selectNFT(nft)} className="text-left group">
                    <NFTCard nft={nft} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(pending || result) && (
        <AlchemyReveal
          parent1={(result ?? pending)!.parent1}
          parent2={(result ?? pending)!.parent2}
          status={result ? "done" : status}
          blocksUntilReveal={Math.max(0, revealAt - currentBlock)}
          blocksUntilExpiry={Math.max(0, expiresAt - currentBlock)}
          hybrid={result?.hybrid ?? null}
          feeLabel={feeLabel}
          txUrl={txHash ? `${EXPLORER}/tx/${txHash}` : undefined}
          error={error}
          onReveal={handleReveal}
          onRecover={handleRecover}
          onComplete={() => {
            setResult(null);
            setSlot1(null);
            setSlot2(null);
            router.push("/collection");
          }}
        />
      )}
    </div>
  );
}

function Banner({ tone, children }: { tone: "red" | "amber" | "cyan"; children: React.ReactNode }) {
  const tones = {
    red: "bg-red-500/10 border-red-500/30 text-red-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
  };
  return <div className={`p-4 rounded-xl border text-sm text-center ${tones[tone]}`}>{children}</div>;
}

