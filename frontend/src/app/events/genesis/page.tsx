"use client";

// Genesis mint event page. Needs these files next to it in src/components:
//   genesis/GenesisSupply.tsx, genesis/useGenesisMint.ts, wallet-scent/MintProgress.tsx, wallet-scent/Confetti.tsx,
//   MintReveal.tsx and PerfumeCard.tsx (the updated versions).

import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import MintReveal from "@/components/MintReveal";
import PerfumeCard from "@/components/PerfumeCard";
import MintProgress from "@/components/wallet-scent/MintProgress";
import Confetti from "@/components/wallet-scent/Confetti";
import GenesisSupply from "@/components/genesis/GenesisSupply";
import { GENESIS_CONTRACT_ADDRESS, MAX_SUPPLY, useGenesisMint } from "@/components/genesis/useGenesisMint";

const ARC_CHAIN_ID = 5042;
const GOLD = ["#fbbf24", "#f59e0b", "#fde68a", "#fb923c", "#ffffff"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

export default function GenesisEventPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const g = useGenesisMint(address);

  const onArc = chainId === ARC_CHAIN_ID;
  const busy = g.stage >= 1 && g.stage <= 3;
  const soldOut = g.supplyLoaded && g.minted >= MAX_SUPPLY;
  const hasMinted = g.userMinted > 0 || !!g.myToken;
  const detailHref = (id: number) => `/nft/${id}?contract=${GENESIS_CONTRACT_ADDRESS}`;

  const share = () => {
    if (!g.result) return;
    const text = `I just minted ScentProtocol Genesis #${g.result.id}, a ${RARITY[g.result.perfume.rarity]} fragrance, on Arc.`;
    const url = `${window.location.origin}/events/genesis`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/events" className="mb-12 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-amber-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        <header className="mb-14 text-center">
          <span className="mb-6 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            {soldOut ? "Sold out" : "Live now"}
          </span>
          <svg viewBox="0 0 120 60" className="gn-arch mx-auto mb-4 h-16 w-32" aria-hidden="true">
            <path d="M10 54 Q60 -22 110 54" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
          <h1 className="mb-4 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text pb-2 text-4xl font-bold leading-[1.2] text-transparent md:text-5xl">
            Genesis Collection
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/60">
            The first 100 AI-generated fragrances on Arc Mainnet. <span className="font-medium text-amber-400">Free mint</span> with an enhanced 15% Legendary drop rate.
          </p>
        </header>

        <GenesisSupply minted={g.minted} total={MAX_SUPPLY} loaded={g.supplyLoaded} />

        <section className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          {g.error && (
            <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {g.error}
            </p>
          )}

          {busy && (
            <div className="space-y-5">
              <MintProgress stage={g.stage as 1 | 2 | 3} blocksDone={g.blocksDone} blocksTotal={g.blocksTotal} accent="#fbbf24" />
              <p className="text-center text-xs text-white/40">
                Keep this tab open. If you close it, come back here and press Finish reveal.
              </p>
            </div>
          )}

          {!busy && g.pendingId !== null && (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold text-amber-300">Your Genesis #{g.pendingId} is sealed and waiting</p>
              <p className="text-sm text-white/60">One more confirmation opens it. You may be asked to sign a free message first.</p>
              <button onClick={() => void g.resume()} disabled={!isConnected || !onArc} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-4 font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] disabled:opacity-50">
                Finish reveal
              </button>
            </div>
          )}

          {!busy && g.pendingId === null && !hasMinted && (
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Mint price</p>
                <p className="text-3xl font-bold text-emerald-400">Free</p>
                <p className="mt-2 text-sm text-white/50">1 per wallet. Two confirmations and one free signature.</p>
              </div>
              {!isConnected ? (
                <p className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white/60">Connect your wallet in the header</p>
              ) : !onArc ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-6 py-3 text-sm font-semibold text-amber-300">Switch to Arc Network</p>
              ) : (
                <button onClick={() => void g.mint()} disabled={soldOut} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-10 py-4 font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:scale-105 hover:shadow-amber-500/40 disabled:opacity-50 disabled:hover:scale-100">
                  {soldOut ? "Sold out" : "Mint my Genesis"}
                </button>
              )}
            </div>
          )}

          {!busy && g.pendingId === null && hasMinted && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">You hold a Genesis</p>
                <p className="mt-1 text-sm text-white/50">The limit is 1 per wallet.</p>
              </div>
              {g.myToken && (
                <div className="mx-auto max-w-sm">
                  <PerfumeCard tokenId={g.myToken.id} perfume={g.myToken.perfume} isGenesis href={detailHref(g.myToken.id)} />
                </div>
              )}
              <Link href="/collection" className="block text-center text-sm text-amber-400 hover:underline">View in your Collection</Link>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/5 pt-6 sm:grid-cols-3">
            {[["15% Legendary", "Enhanced rate"], ["Genesis Badge", "Exclusive marker"], ["Priority Access", "Future drops"]].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-1 font-bold text-amber-400">{t}</p>
                <p className="text-sm text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">What is Genesis?</h3>
            <p className="leading-relaxed text-white/60">The official launch collection of ScentProtocol on Arc Mainnet. Holders receive lifetime priority access to future events.</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">Where to view?</h3>
            <p className="leading-relaxed text-white/60">
              All NFTs appear in your <Link href="/collection" className="text-amber-400 hover:underline">Collection</Link> and can be traded on the{" "}
              <Link href="/marketplace" className="text-amber-400 hover:underline">Marketplace</Link>.
            </p>
          </div>
        </div>
      </div>

      {g.result && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Your Genesis scent">
          <Confetti count={[60, 90, 130, 190][g.result.perfume.rarity] ?? 60} colors={GOLD} />
          <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center px-4 py-10">
            <div className="w-full">
              <MintReveal
                tokenId={g.result.id}
                perfume={g.result.perfume}
                description="One of the first 100 fragrances ever minted on Arc. Welcome to Genesis."
                collection="genesis"
                cardHref={detailHref(g.result.id)}
                onShare={share}
                onComplete={g.clearResult}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gn-arch path { stroke-dasharray: 220; stroke-dashoffset: 220; animation: gnDraw 2.2s ease-out forwards; filter: drop-shadow(0 0 8px rgba(251,191,36,.7)); }
        @keyframes gnDraw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .gn-arch path { animation: none; stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
