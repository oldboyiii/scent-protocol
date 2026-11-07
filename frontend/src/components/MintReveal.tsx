"use client";

// Drop-in replacement for frontend/src/components/MintReveal.tsx (Next.js 14, Tailwind 3).
// No new dependencies and no Tailwind config changes: all motion lives in the <style> block below.

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import PerfumeCard from "./PerfumeCard";
import { PerfumeData } from "@/utils/contract";

type Phase = "pending" | "sealed" | "breaking" | "notes" | "rarity" | "revealed";

interface MintRevealProps {
  tokenId: number;
  /** Pass null while the reveal transaction is still confirming; the seal stays closed until it arrives. */
  perfume: PerfumeData | null;
  description: string;
  /** Called only when the user taps Continue. The reveal never closes itself. */
  onComplete: () => void;
  onShare?: () => void;
  onBlend?: () => void;
  onMintAnother?: () => void;
  /** Real chain data only. Rendered when provided, hidden otherwise. */
  proof?: { requestBlock?: number; revealBlock?: number; txUrl?: string };
}

// hold = suspense before the rarity word appears. Rarer pulls get a longer drumroll.
const RARITY = [
  { label: "Common", hex: "#94a3b8", particles: 0, hold: 300, foil: false },
  { label: "Rare", hex: "#60a5fa", particles: 18, hold: 700, foil: false },
  { label: "Epic", hex: "#c084fc", particles: 32, hold: 1100, foil: true },
  { label: "Legendary", hex: "#fbbf24", particles: 56, hold: 1800, foil: true },
] as const;

const NOTE_COLORS: Array<[string[], string]> = [
  [["bergamot", "lemon", "orange", "grapefruit", "lime", "mandarin"], "#facc15"],
  [["mint", "basil", "rosemary", "thyme", "eucalyptus"], "#4ade80"],
  [["lavender", "violet", "iris"], "#a78bfa"],
  [["rose", "peony", "geranium"], "#f472b6"],
  [["jasmine", "lily", "neroli", "ylang", "gardenia", "tuberose", "freesia", "heliotrope", "chamomile", "petitgrain", "fig"], "#fde68a"],
  [["sandalwood", "cedar", "vetiver", "patchouli", "oud"], "#b45309"],
  [["vanilla", "tonka", "benzoin", "amber"], "#f59e0b"],
  [["musk"], "#d6d3d1"],
];

function noteColor(note: string): string {
  const n = note.toLowerCase();
  for (const [keys, color] of NOTE_COLORS) {
    if (keys.some((k) => n.includes(k))) return color;
  }
  return "#94a3b8";
}

// Deterministic PRNG so particle layout is stable across re-renders.
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

function usePrefersReducedMotion() {
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

export default function MintReveal({
  tokenId,
  perfume,
  description,
  onComplete,
  onShare,
  onBlend,
  onMintAnother,
  proof,
}: MintRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(perfume ? "sealed" : "pending");
  const tiltRef = useRef<HTMLDivElement>(null);

  const cfg = RARITY[Math.min(Math.max(perfume?.rarity ?? 0, 0), 3)];

  // The seal opens only once the reveal transaction has produced a perfume.
  useEffect(() => {
    if (perfume && phase === "pending") setPhase("sealed");
  }, [perfume, phase]);

  // Respect reduced motion: go straight to the finished card.
  useEffect(() => {
    if (reduced && perfume && phase !== "revealed") setPhase("revealed");
  }, [reduced, perfume, phase]);

  // Timed beats. They run only after the user breaks the seal, and never close the screen.
  useEffect(() => {
    const next: Partial<Record<Phase, [Phase, number]>> = {
      breaking: ["notes", 1300],
      notes: ["rarity", 2800],
      rarity: ["revealed", cfg.hold + 1700],
    };
    const step = next[phase];
    if (!step) return;
    const t = setTimeout(() => setPhase(step[0]), step[1]);
    return () => clearTimeout(t);
  }, [phase, cfg.hold]);

  const breakSeal = () => {
    if (phase !== "sealed") return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([30, 40, 70]);
    }
    setPhase("breaking");
  };

  const noteGroups = useMemo(() => {
    if (!perfume) return [];
    return [
      { title: "Top", notes: perfume.topNotes, anim: "mr-mist", delay: 0 },
      { title: "Heart", notes: perfume.heartNotes, anim: "mr-bloom", delay: 900 },
      { title: "Base", notes: perfume.baseNotes, anim: "mr-settle", delay: 1800 },
    ];
  }, [perfume]);

  const particles = useMemo(() => {
    if (!perfume) return [];
    const rand = rng(tokenId * 7919 + perfume.rarity);
    const palette = [
      cfg.hex,
      ...[...perfume.topNotes, ...perfume.heartNotes, ...perfume.baseNotes].map(noteColor),
    ];
    return Array.from({ length: cfg.particles }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 140 + rand() * 280;
      return {
        id: i,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size: 4 + rand() * 7,
        delay: rand() * 0.5,
        color: palette[Math.floor(rand() * palette.length)],
      };
    });
  }, [perfume, tokenId, cfg.hex, cfg.particles]);

  const onTilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 12}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };

  const resetTilt = () => {
    const el = tiltRef.current;
    if (!el) return;
    ["--rx", "--ry", "--mx", "--my"].forEach((p) => el.style.removeProperty(p));
  };

  const showEnvelope = phase === "pending" || phase === "sealed" || phase === "breaking";
  const lit = phase === "notes" || phase === "rarity" || phase === "revealed";
  const opening = phase === "breaking";

  return (
    <div className="relative w-full max-w-2xl mx-auto min-h-[680px] flex flex-col items-center justify-center overflow-hidden">
      <style>{STYLES}</style>

      {/* Atmosphere, tinted by the rarity once the seal is broken */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lit ? 1 : 0,
          transition: "opacity 1200ms ease",
          background: `radial-gradient(circle at 50% 45%, ${cfg.hex}33 0%, transparent 60%)`,
        }}
      />

      {/* Skip, for repeat minters */}
      {phase !== "pending" && phase !== "sealed" && phase !== "revealed" && (
        <button
          type="button"
          onClick={() => setPhase("revealed")}
          className="absolute top-4 right-4 z-50 text-xs text-white/50 hover:text-white px-3 py-2 min-h-[44px]"
        >
          Skip
        </button>
      )}

      {/* Envelope and wax seal */}
      {showEnvelope && (
        <div className="relative flex flex-col items-center" style={{ perspective: 900 }}>
          <div className="relative w-[340px] h-[240px] sm:w-[400px] sm:h-[280px]">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 border-4 border-amber-700/50 shadow-2xl">
              <div className="absolute inset-2 border-2 border-amber-700/20 rounded" />
            </div>
            <div
              className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-purple-800 to-indigo-900 border-b-4 border-amber-700/50"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transformOrigin: "top",
                transform: opening ? "rotateX(180deg)" : "rotateX(0deg)",
                opacity: opening ? 0.2 : 1,
                transition: "transform 1000ms cubic-bezier(.6,0,.2,1), opacity 1000ms ease",
                zIndex: 30,
              }}
            />
            <button
              type="button"
              onClick={breakSeal}
              disabled={phase !== "sealed"}
              aria-label={phase === "sealed" ? "Break the wax seal to reveal your fragrance" : "Sealing your fragrance"}
              className={`absolute left-1/2 top-[108px] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full z-40 min-h-[44px] ${
                phase === "sealed" ? "mr-seal-ready cursor-pointer" : ""
              } ${phase === "pending" ? "mr-seal-wait" : ""}`}
              style={{
                background: "radial-gradient(circle at 35% 30%, #b91c1c, #7f1d1d 55%, #450a0a)",
                border: "4px solid #450a0a",
                boxShadow: "0 6px 18px rgba(0,0,0,.5), inset 0 2px 6px rgba(255,200,150,.25)",
                transform: opening ? "translate(-50%, -50%) scale(0) rotate(-15deg)" : undefined,
                opacity: opening ? 0 : 1,
                transition: "transform 900ms ease-in, opacity 900ms ease-in",
              }}
            >
              <span className="absolute inset-3 rounded-full border-2 border-red-950/60" />
              <span className="absolute inset-5 rounded-full border border-red-900/40" />
            </button>
            {opening &&
              [[60, -100], [-50, 80], [-80, -50], [40, 70]].map(([sx, sy], i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-[108px] w-5 h-5 rounded-full bg-red-900 z-50 mr-shard"
                  style={{ "--sx": `${sx}px`, "--sy": `${sy}px`, animationDelay: `${i * 80}ms` } as CSSProperties}
                />
              ))}
          </div>
          <p className="mt-8 text-sm tracking-widest uppercase text-white/60" aria-live="polite">
            {phase === "pending" && "Sealing your fragrance on Arc"}
            {phase === "sealed" && "Tap the seal to open"}
            {phase === "breaking" && "\u00A0"}
          </p>
        </div>
      )}

      {/* Notes, in the order a real fragrance evolves */}
      {phase === "notes" && (
        <div className="relative z-20 w-full px-6 space-y-7 text-center">
          {noteGroups.map((g) => (
            <div key={g.title} className={g.anim} style={{ animationDelay: `${g.delay}ms` }}>
              <p className="text-[11px] tracking-[0.25em] uppercase text-white/40 mb-3">{g.title} notes</p>
              <div className="flex flex-wrap justify-center gap-2">
                {g.notes.map((n) => (
                  <span key={n} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/90">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: noteColor(n), boxShadow: `0 0 10px ${noteColor(n)}` }} />
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drumroll, then the rarity word */}
      {phase === "rarity" && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div
            className="absolute w-64 h-64 rounded-full mr-beat"
            style={{ background: `radial-gradient(circle, ${cfg.hex}66, transparent 70%)`, animationDuration: cfg.hold > 1000 ? "700ms" : "1000ms" }}
          />
          <div className="absolute w-40 h-40 rounded-full mr-flash" style={{ background: cfg.hex, animationDelay: `${cfg.hold}ms` }} />
          <h3
            className="mr-label relative text-4xl sm:text-5xl font-bold uppercase"
            style={{ color: cfg.hex, textShadow: `0 0 30px ${cfg.hex}`, animationDelay: `${cfg.hold}ms` }}
          >
            {cfg.label}
          </h3>
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full mr-burst"
              style={{
                width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                "--tx": `${p.tx}px`, "--ty": `${p.ty}px`, animationDelay: `${cfg.hold + p.delay * 1000}ms`,
              } as CSSProperties}
            />
          ))}
        </div>
      )}

      {/* The finished card */}
      {phase === "revealed" && perfume && (
        <div className="relative z-20 w-full flex flex-col items-center px-4 mr-rise">
          {cfg.foil && (
            <div
              className="absolute -z-10 w-[560px] h-[560px] rounded-full mr-spin opacity-30 pointer-events-none"
              style={{ 
                background: `repeating-conic-gradient(from 0deg, ${cfg.hex}55 0deg 8deg, transparent 8deg 24deg)`, 
                maskImage: "radial-gradient(circle, black 20%, transparent 70%)", 
                WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 70%)" 
              }}
            />
          )}
          <p className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: cfg.hex }}>{cfg.label}</p>
          <h3 className="text-3xl font-bold text-white mb-5 text-center">{perfume.name}</h3>

          <div
            ref={tiltRef}
            onPointerMove={onTilt}
            onPointerLeave={resetTilt}
            className="relative"
            style={{ transform: "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))", transition: "transform 120ms ease-out" }}
          >
            <PerfumeCard tokenId={tokenId} perfume={perfume} aiDescription={description} highlight />
            {cfg.foil && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-screen opacity-40"
                style={{
                  background: "linear-gradient(115deg, transparent 25%, rgba(255,255,255,.55) 42%, rgba(255,214,120,.45) 50%, rgba(160,200,255,.4) 58%, transparent 75%)",
                  backgroundSize: "220% 220%",
                  backgroundPosition: "var(--mx,50%) var(--my,50%)",
                }}
              />
            )}
          </div>

          {proof && (proof.requestBlock !== undefined || proof.revealBlock !== undefined) && (
            <p className="mt-5 text-xs text-white/45 text-center max-w-sm">
              Provably fair: seed committed
              {proof.requestBlock !== undefined && <> at block {proof.requestBlock}</>}
              {proof.revealBlock !== undefined && <>, revealed at block {proof.revealBlock}</>}.
              {proof.txUrl && (
                <> <a href={proof.txUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">View transaction</a></>
              )}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onComplete} className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors min-h-[44px]">Continue</button>
            {onShare && <button type="button" onClick={onShare} className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors min-h-[44px]">Share</button>}
            {onBlend && <button type="button" onClick={onBlend} className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors min-h-[44px]">Blend it</button>}
            {onMintAnother && <button type="button" onClick={onMintAnother} className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors min-h-[44px]">Mint another</button>}
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {phase === "revealed" && perfume ? `${cfg.label} fragrance revealed: ${perfume.name}` : ""}
      </div>
    </div>
  );
}

const STYLES = `
@keyframes mr-mist { from { opacity:0; transform:translateY(24px); filter:blur(12px); } to { opacity:1; transform:none; filter:blur(0); } }
@keyframes mr-bloom { from { opacity:0; transform:scale(.5); filter:blur(8px); } 60% { transform:scale(1.1); } to { opacity:1; transform:scale(1); filter:blur(0); } }
@keyframes mr-settle { from { opacity:0; transform:translateY(-26px); } to { opacity:1; transform:none; } }
@keyframes mr-label { from { opacity:0; transform:scale(.6); letter-spacing:.6em; filter:blur(10px); } to { opacity:1; transform:scale(1); letter-spacing:.18em; filter:blur(0); } }
@keyframes mr-beat { 0%,100% { transform:scale(.9); opacity:.25; } 50% { transform:scale(1.2); opacity:.8; } }
@keyframes mr-flash { from { opacity:.9; transform:scale(.2); } to { opacity:0; transform:scale(4); } }
@keyframes mr-burst { from { opacity:1; transform:translate(-50%,-50%) scale(1); } to { opacity:0; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(.2); } }
@keyframes mr-shard { from { opacity:1; transform:translate(0,0) scale(1); } to { opacity:0; transform:translate(var(--sx),var(--sy)) scale(.2) rotate(120deg); } }
@keyframes mr-ready { 0%,100% { box-shadow:0 6px 18px rgba(0,0,0,.5), 0 0 0 0 rgba(251,191,36,.5); } 50% { box-shadow:0 6px 18px rgba(0,0,0,.5), 0 0 0 20px rgba(251,191,36,0); } }
@keyframes mr-wait { 0%,100% { transform:translate(-50%,-50%) scale(1); } 50% { transform:translate(-50%,-50%) scale(.94); } }
@keyframes mr-rise { from { opacity:0; transform:translateY(40px) scale(.92); } to { opacity:1; transform:none; } }
@keyframes mr-spin { to { transform:rotate(360deg); } }
.mr-mist { animation: mr-mist 900ms ease-out both; }
.mr-bloom { animation: mr-bloom 900ms ease-out both; }
.mr-settle { animation: mr-settle 900ms ease-out both; }
.mr-label { animation: mr-label 1100ms cubic-bezier(.2,.8,.2,1) both; }
.mr-beat { animation: mr-beat 1000ms ease-in-out infinite; }
.mr-flash { animation: mr-flash 1200ms ease-out both; opacity: 0; }
.mr-burst { animation: mr-burst 1700ms ease-out both; opacity: 0; }
.mr-shard { animation: mr-shard 1100ms ease-out both; }
.mr-seal-ready { animation: mr-ready 1600ms ease-in-out infinite; }
.mr-seal-wait { animation: mr-wait 1400ms ease-in-out infinite; }
.mr-rise { animation: mr-rise 900ms cubic-bezier(.2,.8,.2,1) both; }
.mr-spin { animation: mr-spin 40s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .mr-mist, .mr-bloom, .mr-settle, .mr-label, .mr-beat, .mr-flash, .mr-burst, .mr-shard, .mr-seal-ready, .mr-seal-wait, .mr-rise, .mr-spin { animation: none !important; opacity: 1; }
  .mr-flash, .mr-burst { opacity: 0; }
}
`;
