"use client";

// MFW 2026 event page: a paid, time-gated commit-reveal mint made to feel like an occasion.
// Needs: components/genesis/{GenesisSupply,useMfwMint,mfwChain}, components/wallet-scent/{MintProgress,Confetti}, MintReveal.

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount, useChainId } from "wagmi";
import MintReveal from "@/components/MintReveal";
import MintProgress from "@/components/wallet-scent/MintProgress";
import Confetti from "@/components/wallet-scent/Confetti";
import GenesisSupply from "@/components/genesis/GenesisSupply";
import { DEADLINE, MAX_PER_WALLET, MAX_SUPPLY, MFW_ADDRESS, MIN_WAIT, useMfwMint } from "@/components/genesis/useMfwMint";

const ARC_CHAIN_ID = 5042;
const ACCENT = "#c084fc";
const RARITY = ["Common", "Rare", "Epic", "Legendary"];
const CONFETTI = [60, 100, 150, 210];

const fmtUsdc = (v: bigint) => ethers.formatUnits(v, 6);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

export default function MFW2026Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onArc = chainId === ARC_CHAIN_ID;
  const m = useMfwMint(address, onArc);
  const [badgeNote, setBadgeNote] = useState(false);

  const soldOut = m.supplyLoaded && m.minted >= MAX_SUPPLY;
  const maxed = m.walletMinted >= MAX_PER_WALLET && !m.pending;
  const waiting = m.pending && !m.canReveal && !m.expired;
  const left = m.pending ? Math.max(0, DEADLINE - m.secondsSinceRequest) : 0;
  const urgent = m.canReveal && left < 120;

  const share = () => {
    if (!m.result) return;
    const text = `I just minted a ${RARITY[m.result.perfume.rarity] ?? "Common"} fragrance in the ScentProtocol MFW 2026 collection on Arc.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/events" className="mb-12 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-purple-300">
          Back to Events
        </Link>

        <header className="mb-14 text-center">
          <span className="mb-6 inline-block rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
            Milan Fashion Week 2026
          </span>
          <h1 className="mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text pb-2 text-4xl font-bold leading-[1.15] text-transparent md:text-6xl">
            Runway Edition
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/60">
            {MAX_SUPPLY} fragrances inspired by the runway. Up to {MAX_PER_WALLET} per wallet. Pay 5 USDC, or just 1 USDC if you hold a Genesis NFT. Everyone who mints earns the exclusive MFW badge.
          </p>
        </header>

        <GenesisSupply
          minted={m.minted}
          total={MAX_SUPPLY}
          loaded={m.supplyLoaded}
          barClass="bg-gradient-to-r from-purple-500 via-pink-400 to-amber-300"
          numberClass="text-purple-300"
        />

        {m.claimable > 0n && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-200">You have <b>{fmtUsdc(m.claimable)} USDC</b> waiting from a cancelled mint.</p>
            <button onClick={m.claim} disabled={m.busy === "claim"} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {m.busy === "claim" ? "Claiming..." : "Claim to my wallet"}
            </button>
          </div>
        )}

        <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl md:p-8">
          {m.result ? (
            <>
              <Confetti count={CONFETTI[m.result.perfume.rarity] ?? 60} colors={["#c084fc", "#f472b6", "#fbbf24", "#a78bfa", "#ffffff"]} />
              <MintReveal
                tokenId={m.result.tokenId}
                perfume={{ ...m.result.perfume }}
                description="From the Milan Fashion Week 2026 collection on Arc."
                collection="mfw"
                cardHref={`/nft/${m.result.tokenId}?contract=${MFW_ADDRESS}`}
                onShare={share}
                onMintAnother={m.walletMinted < MAX_PER_WALLET ? () => { setBadgeNote(m.result?.firstBadge ?? false); m.clearResult(); } : undefined}
                onComplete={() => { setBadgeNote(m.result?.firstBadge ?? false); m.clearResult(); }}
              />
            </>
          ) : m.pending ? (
            <div className="space-y-6">
              <MintProgress
                stage={waiting ? 2 : 3}
                blocksDone={Math.min(m.secondsSinceRequest, MIN_WAIT)}
                blocksTotal={MIN_WAIT}
                unit="second"
                accent={ACCENT}
              />
              {waiting && <p className="text-center text-sm text-white/60">Your scent is maturing. The reveal opens in {Math.max(0, MIN_WAIT - m.secondsSinceRequest + 1)} seconds.</p>}
              {m.canReveal && (
                <>
                  <p className={`text-center text-sm ${urgent ? "text-amber-300" : "text-white/60"}`}>
                    Open the bottle within <b>{clock(left)}</b>. If the window closes, only 50% of your payment can be recovered.
                  </p>
                  <button onClick={m.reveal} disabled={m.busy === "reveal"} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] disabled:opacity-60">
                    {m.busy === "reveal" ? "Opening..." : "Open the bottle"}
                  </button>
                </>
              )}
              {m.expired && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  The 10 minute reveal window closed. You can recover 50% of your payment (the other 50% is kept by the contract).
                </div>
              )}
              {(m.canReveal || m.expired) && (
                <button onClick={m.recover} disabled={m.busy === "recover"} className="w-full text-center text-xs text-white/40 underline hover:text-white/70 disabled:opacity-50">
                  {m.busy === "recover" ? "Recovering..." : "Cancel this mint and recover 50%"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-white/40">Your price</p>
                  <p className="text-4xl font-bold text-white">{m.price > 0n ? `${fmtUsdc(m.price)} USDC` : "..."}</p>
                  <p className="mt-1 text-sm text-purple-200/80">
                    {m.isGenesis ? "Genesis holder price applied" : "Hold a Genesis NFT to pay 1 USDC"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Minted by you</p>
                  <div className="flex justify-end gap-2">
                    {Array.from({ length: MAX_PER_WALLET }).map((_, i) => (
                      <span key={i} className="h-3 w-3 rounded-full border border-purple-300/60" style={{ background: i < m.walletMinted ? ACCENT : "transparent" }} />
                    ))}
                  </div>
                  {(m.hasBadge || badgeNote) && <p className="mt-2 text-xs text-amber-300">MFW badge earned</p>}
                </div>
              </div>

              {m.busy === "mint" && <MintProgress stage={1} blocksDone={0} blocksTotal={MIN_WAIT} unit="second" accent={ACCENT} />}
              {!isConnected && <p className="text-center text-sm text-white/50">Connect your wallet in the header to mint.</p>}
              {isConnected && !onArc && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-center text-sm text-amber-200">Switch to Arc Network to mint.</p>}
              {soldOut && <p className="text-center font-semibold text-amber-300">Sold out. Find them on the Marketplace.</p>}
              {maxed && <p className="text-center font-semibold text-emerald-300">You minted the maximum of {MAX_PER_WALLET}. Find them in your Collection.</p>}

              {isConnected && onArc && !soldOut && !maxed && (
                m.needsApproval ? (
                  <button onClick={m.approve} disabled={m.busy === "approve"} className="w-full rounded-xl border border-purple-300/40 bg-purple-500/20 py-4 font-semibold text-white disabled:opacity-60">
                    {m.busy === "approve" ? "Approving..." : "Step 1: allow USDC for this mint"}
                  </button>
                ) : (
                  <button onClick={m.mint} disabled={m.busy === "mint" || m.price === 0n} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] disabled:opacity-60">
                    {m.busy === "mint" ? "Sealing your scent..." : `Mint for ${m.price > 0n ? fmtUsdc(m.price) : "..."} USDC`}
                  </button>
                )
              )}
              <p className="text-center text-xs text-white/40">
                Three steps: seal (pay), a 30 second wait, then open the bottle. A free signature creates your private reveal key.
              </p>
            </div>
          )}

          {m.error && (
            <p role="alert" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              <span>{m.error}</span>
              <button onClick={m.dismissError} className="text-xs underline">Dismiss</button>
            </p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">What you get</h3>
            <p className="text-base leading-relaxed text-white/60">A runway-inspired AI fragrance with on-chain notes, the exclusive MFW badge, and a card that plays its own sound.</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="mb-3 text-lg font-semibold text-white">Where to view</h3>
            <p className="text-base leading-relaxed text-white/60">
              Your scents appear in your <Link href="/collection" className="text-purple-300 hover:underline">Collection</Link> and can be traded on the{" "}
              <Link href="/marketplace" className="text-purple-300 hover:underline">Marketplace</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
