"use client";

// Drop-in replacement for frontend/src/components/AlchemyReveal.tsx.
// No new dependencies. Progress is driven by real chain state passed in as props,
// not by timers: the page tells this component what the blend is doing.
//
// Blend lifecycle (matches the new ScentAlchemy contract):
//   waiting   - parents and fee are escrowed, waiting for block +6 after the request
//   ready     - reveal is open: show the Reveal button (or let a keeper finalize)
//   revealing - the reveal transaction is pending
//   done      - hybrid exists: play the ceremony and show the real result
//   expired   - the reveal window closed: offer to recover the parents

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

export interface ParentInfo {
  tokenId: number;
  name: string;
  rarity: number;
}

export interface HybridInfo {
  hybridId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}

export type AlchemyStatus = "waiting" | "ready" | "revealing" | "done" | "expired";

interface AlchemyRevealProps {
  parent1: ParentInfo;
  parent2: ParentInfo;
  status: AlchemyStatus;
  /** Blocks left until the reveal opens (waiting state). */
  blocksUntilReveal?: number;
  /** Blocks left before the reveal window closes (waiting/ready states). */
  blocksUntilExpiry?: number;
  hybrid?: HybridInfo | null;
  /** Shown when a blend expires, e.g. "0.1 USDC". */
  feeLabel?: string;
  txUrl?: string;
  error?: string | null;
  /** A soft, non-error message, for example "not ready yet". Shown in amber. */
  notice?: string | null;
  /** True while the reveal block has passed but the network has not yet confirmed it can be revealed. */
  syncing?: boolean;
  onReveal?: () => void;
  onRecover?: () => void;
  /** Called only when the person taps the final button. Never on a timer. */
  onComplete: () => void;
}

const REVEAL_DELAY_BLOCKS = 6;
const SECONDS_PER_BLOCK = 0.45; // estimate for display only
const RARITY_LABEL = ["Common", "Rare", "Epic", "Legendary"];
const RARITY_HEX = ["#94a3b8", "#60a5fa", "#c084fc", "#fbbf24"];
const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const SPARKS = [0, 14, 26, 46];

const NOTE_COLORS: Array<[RegExp, string]> = [
  [/bergamot|lemon|orange|grapefruit|lime|mandarin/i, "#facc15"],
  [/mint|basil|rosemary|thyme|eucalyptus|vetiver/i, "#4ade80"],
  [/lavender|violet|iris/i, "#a78bfa"],
  [/rose|peony|geranium|ylang/i, "#f472b6"],
  [/jasmine|lily|neroli|gardenia|tuberose|freesia|heliotrope|chamomile|petitgrain|fig/i, "#fcd9b6"],
  [/sandalwood|cedar|patchouli|oud/i, "#b45309"],
  [/vanilla|tonka|benzoin|amber/i, "#f59e0b"],
  [/musk/i, "#d6d3d1"],
];

function noteColor(note: string): string {
  for (const [re, color] of NOTE_COLORS) if (re.test(note)) return color;
  return "#94a3b8";
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seconds(blocks: number): number {
  return Math.max(0, Math.round(blocks * SECONDS_PER_BLOCK));
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const h = () => setReduced(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return reduced;
}

function Flask({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v6.2L4.6 18.4A2 2 0 006.3 21h11.4a2 2 0 001.7-2.6L14 9.2V3M7.5 15h9" />
    </svg>
  );
}

function Orb({ parent, style, fast }: { parent: ParentInfo; style: CSSProperties; fast: boolean }) {
  const hex = RARITY_HEX[parent.rarity] ?? RARITY_HEX[0];
  return (
    <div className="absolute left-1/2 top-1/2" style={style}>
      <div className={`absolute left-0 top-0 h-0 w-0 ${fast ? "ar-counter-fast" : "ar-counter"}`}>
        <div
          className={fast ? "ar-pulse-fast" : "ar-pulse"}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 96,
            height: 96,
            marginLeft: -48,
            marginTop: -48,
            borderRadius: 9999,
            background: `radial-gradient(circle at 35% 30%, ${hex}55, #0f172acc 70%)`,
            border: `2px solid ${hex}`,
            boxShadow: `0 0 28px ${hex}66`,
          }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center px-2 text-center">
            <span className="max-w-[80px] truncate text-xs font-semibold text-white">{parent.name}</span>
            <span className="text-[10px] text-white/50">#{parent.tokenId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlchemyReveal(props: AlchemyRevealProps) {
  const { parent1, parent2, status, blocksUntilReveal, blocksUntilExpiry, hybrid, feeLabel, txUrl, error, notice, syncing } = props;
  const { onReveal, onRecover, onComplete } = props;
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState<"flash" | "card">("flash");
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  // Stops rapid repeat clicks on the reveal button.
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => setLocked(false), 4000);
    return () => clearTimeout(t);
  }, [locked]);

  useEffect(() => {
    if (status !== "done") return;
    if (reduced) {
      setStage("card");
      return;
    }
    setStage("flash");
    const t = setTimeout(() => setStage("card"), 700);
    return () => clearTimeout(t);
  }, [status, reduced]);

  useEffect(() => {
    if (status === "ready" || status === "expired" || (status === "done" && stage === "card")) {
      primaryRef.current?.focus();
    }
  }, [status, stage]);

  const progress =
    status === "waiting"
      ? Math.min(1, Math.max(0, 1 - (blocksUntilReveal ?? REVEAL_DELAY_BLOCKS) / REVEAL_DELAY_BLOCKS))
      : status === "expired"
        ? 0
        : 1;
  const dist = 112 * (1 - progress) + 6;

  const hex = hybrid ? (RARITY_HEX[hybrid.rarity] ?? RARITY_HEX[0]) : "#22d3ee";
  const bestParent = Math.max(parent1.rarity, parent2.rarity);
  const upgraded = hybrid ? hybrid.rarity > bestParent : false;

  const sparks = useMemo(() => {
    if (!hybrid) return [];
    const r = rng(hybrid.hybridId * 7919 + hybrid.rarity);
    const palette = [hex, ...hybrid.topNotes, ...hybrid.heartNotes, ...hybrid.baseNotes].map((n) =>
      n.startsWith("#") ? n : noteColor(n)
    );
    return Array.from({ length: SPARKS[hybrid.rarity] ?? 0 }, (_, i) => {
      const angle = r() * Math.PI * 2;
      const d = 140 + r() * 260;
      return {
        id: i,
        tx: Math.cos(angle) * d,
        ty: Math.sin(angle) * d,
        size: 4 + r() * 6,
        delay: r() * 0.4,
        color: palette[Math.floor(r() * palette.length)] ?? hex,
      };
    });
  }, [hybrid, hex]);

  let title = "";
  let body = "";
  if (status === "waiting" && (syncing || blocksUntilReveal === 0)) {
    title = "Almost there";
    body = "The network is confirming your fusion can be revealed. This takes a few seconds and needs nothing from you.";
  } else if (status === "waiting") {
    title = "Fusing in progress";
    body = `Your two fragrances are sealed in the lab. The reveal opens in about ${seconds(blocksUntilReveal ?? REVEAL_DELAY_BLOCKS)} seconds.`;
  } else if (status === "ready") {
    title = "The fusion is ready";
    body = "Reveal your hybrid now. The reveal window is short, so do not wait.";
  } else if (status === "revealing") {
    title = "Forging your hybrid";
    body = "Confirm in your wallet if asked, then give it a moment.";
  } else if (status === "expired") {
    title = "The reveal window closed";
    body = `You can take your two fragrances back. The ${feeLabel ?? "blend"} fee is kept.`;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scent alchemy"
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-md"
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ background: `radial-gradient(circle at 50% 45%, ${hex}33, transparent 60%)` }}
      />
      <div className="sr-only" role="status" aria-live="polite">
        {status === "done" && hybrid ? `${RARITY_LABEL[hybrid.rarity]} hybrid ${hybrid.name} forged` : title}
      </div>

      {status !== "done" && (
        <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="relative h-[280px] w-[280px]">
            <div className={status === "revealing" ? "ar-orbit-fast absolute inset-0" : "ar-orbit absolute inset-0"}>
              <Orb parent={parent1} fast={status === "revealing"} style={{ transform: `translate(${-dist}px, 0)`, transition: "transform 500ms ease-out" }} />
              <Orb parent={parent2} fast={status === "revealing"} style={{ transform: `translate(${dist}px, 0)`, transition: "transform 500ms ease-out" }} />
            </div>
            <div
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-cyan-200"
              style={{
                background: "radial-gradient(circle, #22d3ee55, transparent 70%)",
                opacity: 0.25 + progress * 0.75,
                transform: `translate(-50%, -50%) scale(${0.7 + progress * 0.6})`,
                transition: "opacity 500ms, transform 500ms",
              }}
            >
              <Flask className="h-8 w-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
            <p className="mx-auto max-w-sm text-sm text-white/60">{body}</p>
            {blocksUntilExpiry !== undefined && (status === "waiting" || status === "ready") && (
              <p className="text-xs text-white/40">Window closes in about {seconds(blocksUntilExpiry)} seconds</p>
            )}
          </div>

          {notice && !error && (
            <p role="status" className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">{notice}</p>
          )}
          {error && (
            <p role="alert" className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
          )}

          {status === "ready" && onReveal && (
            <button
              ref={primaryRef}
              disabled={locked}
              onClick={() => {
                setLocked(true);
                onReveal();
              }}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
            >
              {locked ? "One moment..." : "Reveal the hybrid"}
            </button>
          )}
          {status === "expired" && onRecover && (
            <button
              ref={primaryRef}
              onClick={onRecover}
              className="w-full rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Recover my fragrances
            </button>
          )}
          {txUrl && (
            <a href={txUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300/80 underline">
              View transaction
            </a>
          )}
        </div>
      )}

      {status === "done" && hybrid && stage === "flash" && (
        <div className="ar-flash pointer-events-none absolute inset-0 z-[201]" style={{ background: hex }} />
      )}

      {status === "done" && hybrid && stage === "card" && (
        <div className="relative z-[202] w-full max-w-sm">
          {sparks.map((s) => (
            <span
              key={s.id}
              className="ar-spark pointer-events-none absolute left-1/2 top-1/3 rounded-full"
              style={{
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
                animationDelay: `${s.delay}s`,
                ["--tx" as string]: `${s.tx}px`,
                ["--ty" as string]: `${s.ty}px`,
              } as CSSProperties}
            />
          ))}
          <div
            className="ar-rise relative rounded-2xl border bg-slate-950/90 p-6 text-center backdrop-blur-xl"
            style={{ borderColor: `${hex}99`, boxShadow: `0 0 60px ${hex}44` }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: hex }}>
              {upgraded ? "Rarity upgraded" : "Hybrid forged"}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{hybrid.name}</h2>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
              <span className="rounded-full border px-3 py-1 font-bold" style={{ borderColor: hex, color: hex }}>
                {RARITY_LABEL[hybrid.rarity]}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">{GENDER[hybrid.gender] ?? "Unisex"}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">{TYPE[hybrid.pType] ?? "Parfum"}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">{hybrid.concentration}%</span>
            </div>
            {upgraded && (
              <p className="mt-3 text-sm text-white/70">
                Your best parent was {RARITY_LABEL[bestParent]}. The fusion lifted it to {RARITY_LABEL[hybrid.rarity]}.
              </p>
            )}
            <div className="mt-5 grid grid-cols-3 gap-3 text-left">
              {([["Top", hybrid.topNotes], ["Heart", hybrid.heartNotes], ["Base", hybrid.baseNotes]] as const).map(([label, notes]) => (
                <div key={label}>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40">{label}</p>
                  <ul className="space-y-1">
                    {notes.map((n, i) => (
                      <li key={`${n}-${i}`} className="flex items-center gap-1.5 text-xs text-white/80">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: noteColor(n), boxShadow: `0 0 6px ${noteColor(n)}` }} />
                        <span className="truncate">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-white/40">
              Forged from {parent1.name} and {parent2.name}. Both parents were burned.
            </p>
            <button
              ref={primaryRef}
              onClick={onComplete}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
            >
              View in collection
            </button>
            {txUrl && (
              <a href={txUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-cyan-300/80 underline">
                View transaction
              </a>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ar-orbit { to { transform: rotate(360deg); } }
        @keyframes ar-orbit-rev { to { transform: rotate(-360deg); } }
        @keyframes ar-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes ar-flash { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes ar-rise { from { opacity: 0; transform: translateY(32px) scale(.94); } to { opacity: 1; transform: none; } }
        @keyframes ar-spark {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(.2); }
        }
        .ar-orbit { animation: ar-orbit 14s linear infinite; }
        .ar-orbit-fast { animation: ar-orbit 1.6s linear infinite; }
        .ar-counter { animation: ar-orbit-rev 14s linear infinite; }
        .ar-counter-fast { animation: ar-orbit-rev 1.6s linear infinite; }
        .ar-pulse { animation: ar-pulse 2.4s ease-in-out infinite; }
        .ar-pulse-fast { animation: ar-pulse .8s ease-in-out infinite; }
        .ar-flash { animation: ar-flash 700ms ease-out forwards; opacity: 0; }
        .ar-rise { animation: ar-rise 600ms cubic-bezier(.2,.8,.2,1) both; }
        .ar-spark { animation: ar-spark 1800ms ease-out forwards; opacity: 0; }
        @media (prefers-reduced-motion: reduce) {
          .ar-orbit, .ar-orbit-fast, .ar-counter, .ar-counter-fast, .ar-pulse, .ar-pulse-fast, .ar-flash, .ar-rise, .ar-spark { animation: none !important; }
          .ar-spark { display: none; }
        }
      `}</style>
    </div>
  );
}

