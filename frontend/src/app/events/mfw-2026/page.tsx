"use client";

import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import MintReveal from "@/components/MintReveal";
import PerfumeCard from "@/components/PerfumeCard";
import MintProgress from "@/components/wallet-scent/MintProgress";
import Confetti from "@/components/wallet-scent/Confetti";
import GenesisSupply from "@/components/genesis/GenesisSupply";
import { useMfwMint } from "@/components/mfw/useMfwMint";
import { MFW_ADDRESS, MAX_SUPPLY } from "@/components/mfw/mfwChain";

const ARC_CHAIN_ID = 5042;
const MFW_COLORS = ["#a855f7", "#d946ef", "#fbbf24", "#f472b6", "#ffffff"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

export default function MfwEventPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // NOTE: Replace `false` with an actual check for Genesis NFT ownership 
  // if you want to automatically apply the discount.
  const g = useMfwMint(address, false);

  const onArc = chainId === ARC_CHAIN_ID;
  const busy = g.stage >= 1 && g.stage <= 3;
  const soldOut = g.supplyLoaded && g.minted >= MAX_SUPPLY;
  const hasMinted = g.userMinted > 0 || !!g.myToken;
  const detailHref = (id: number) => `/nft/${id}?contract=${MFW_ADDRESS}`;

  const share = () => {
    if (!g.result) return;
    const text = `I just minted ScentProtocol MFW 2026 #${g.result.id}, a ${RARITY[g.result.perfume.rarity]} fragrance, on Arc.`;
    const url = `${window.location.origin}/events/mfw-2026`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="relative min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/events" className="mb-12 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-purple-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        <header className="mb-14 text-center">
          <span className="mb-6 inline-block rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400">
            {soldOut ? "Sold out" : "Live now"}
          </span>
          <svg viewBox="0 0 120 60" className="mx-auto mb-4 h-16 w-32" aria-hidden="true">
             <path d="M10 50 Q60 -20 110 50" stroke="#a855f7" strokeWidth="4" fill="none" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </svg>
          <h1 className="mb-4 bg-gradient-to-r from-purple-300 via-fuchsia-400 to-amber-400 bg-clip-text pb-2 text-4xl font-bold leading-[1.2] text-transparent md:text-5xl">
            MFW 2026 Collection
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/60">
            Exclusive Milan Fashion Week drop. <span className="font-medium text-purple-400">500 supply</span> with unique on-chain formulas and a 10-minute reveal window.
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
              <MintProgress stage={g.stage as 1 | 2 | 3} blocksDone={g.blocksDone} blocksTotal={g.blocksTotal} accent="#a855f7" />
              <p className="text-center text-xs text-white/40">
                Keep this tab open. If you close it, come back here and press Finish reveal.
              </p>
            </div>
          )}

          {!busy && g.pendingId === null && !hasMinted && (
  <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
    <div className="text-center md:text-left">
      <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Mint price</p>
      <p className="text-3xl font-bold text-emerald-400">
        {g.prices.genesis} {parseFloat(g.prices.regular) > 1 ? 'USDC' : 'ETH'}
      </p>
      {parseFloat(g.prices.regular) !== parseFloat(g.prices.genesis) && (
        <p className="mt-2 text-sm text-white/50">
          Genesis holders: <span className="text-white/40 line-through">{g.prices.regular}</span>{' '}
          <span className="text-emerald-400 font-bold">{g.prices.genesis}</span>
        </p>
      )}
      <p className="mt-1 text-xs text-white/40">Max 3 per wallet. Two confirmations and one free signature.</p>
    </div>
{/* ... the rest of the code ... */}
  </div>
)}

          {!busy && g.pendingId === null && !hasMinted && (
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Mint price</p>
                <p className="text-3xl font-bold text-emerald-400">{g.prices.genesis} ETH</p>
                <p className="mt-2 text-sm text-white/50">
                  Genesis holders: <span className="text-white/40 line-through">{g.prices.regular} ETH</span> <span className="text-emerald-400 font-bold">{g.prices.genesis} ETH</span>
                </p>
                <p className="mt-1 text-xs text-white/40">Max 3 per wallet. Two confirmations and one free signature.</p>
              </div>
              {!isConnected ? (
                <p className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white/60">Connect your wallet in the header</p>
              ) : !onArc ? (
                <p className="rounded-xl border border-purple-500/30 bg-purple-500/15 px-6 py-3 text-sm font-semibold text-purple-300">Switch to Arc Network</p>
              ) : (
                <button onClick={() => void g.mint()} disabled={soldOut} className="rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 px-10 py-4 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:scale-105 hover:shadow-purple-500/40 disabled:opacity-50 disabled:hover:scale-100">
                  {soldOut ? "Sold out" : "Mint MFW 2026"}
                </button>
              )}
            </div>
          )}

          {!busy && g.pendingId === null && hasMinted && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">You hold an MFW 2026</p>
                <p className="mt-1 text-sm text-white/50">The limit is 3 per wallet.</p>
              </div>
              {g.myToken && (
                <div className="mx-auto max-w-sm">
                  <PerfumeCard tokenId={g.myToken.id} perfume={g.myToken.perfume} isMFW href={detailHref(g.myToken.id)} />
                </div>
              )}
              <Link href="/collection" className="block text-center text-sm text-purple-400 hover:underline">View in your Collection</Link>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/5 pt-6 sm:grid-cols-3">
            {[["Exclusive Drop", "Milan Fashion Week"], ["10-min Reveal", "Fast commitment"], ["Premium Formula", "Enhanced rarity"]].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-1 font-bold text-purple-400">{t}</p>
                <p className="text-sm text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">What is MFW 2026?</h3>
            <p className="leading-relaxed text-white/60">A limited 500-supply collection celebrating the intersection of high fashion and digital perfumery. Each scent is a unique, AI-generated formula.</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">Where to view?</h3>
            <p className="leading-relaxed text-white/60">
              All NFTs appear in your <Link href="/collection" className="text-purple-400 hover:underline">Collection</Link> and can be traded on the{" "}
              <Link href="/marketplace" className="text-purple-400 hover:underline">Marketplace</Link>.
            </p>
          </div>
        </div>
      </div>

      {g.result && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Your MFW 2026 scent">
          <Confetti count={[60, 90, 130, 190][g.result.perfume.rarity] ?? 60} colors={MFW_COLORS} />
          <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center px-4 py-10">
            <div className="w-full">
              <MintReveal
                tokenId={g.result.id}
                perfume={g.result.perfume}
                description="An exclusive Milan Fashion Week 2026 digital fragrance."
                collection="mfw"
                cardHref={detailHref(g.result.id)}
                onShare={share}
                onComplete={g.clearResult}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
