"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { useScentSound } from "./useScentSound";

export interface PlayerPerfume {
  name: string;
  rarity: number;
  creator?: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}

interface ScentPlayerProps {
  perfume: PlayerPerfume;
  tokenId?: number | string;
  variant?: "compact" | "full";
  className?: string;
  hideNotes?: boolean; // ✅ Added to prevent duplication on detail page
}

const RARITY_HEX = ["#94a3b8", "#60a5fa", "#c084fc", "#fbbf24"];
const BAR_COUNT = 5;

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export default function ScentPlayer({ perfume, tokenId, variant = "compact", className = "", hideNotes = false }: ScentPlayerProps) {
  const hex = RARITY_HEX[perfume.rarity] ?? RARITY_HEX[0];
  const { state, error, toggle, setVolume, getLevel } = useScentSound({
    seed: `${perfume.creator ?? ""}-${perfume.name}-${tokenId ?? ""}`,
    rarity: perfume.rarity,
    topNotes: perfume.topNotes,
    heartNotes: perfume.heartNotes,
    baseNotes: perfume.baseNotes,
  });
  const playing = state === "playing";
  const ringRef = useRef<HTMLSpanElement>(null);
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let smooth = 0;
    const loop = (t: number) => {
      smooth += (getLevel() - smooth) * 0.2;
      if (!reduced) {
        if (ringRef.current) {
          ringRef.current.style.transform = `scale(${1 + smooth * 0.6})`;
          ringRef.current.style.opacity = String(0.25 + smooth * 0.75);
        }
        barRefs.current.forEach((bar, i) => {
          if (!bar) return;
          const wobble = 0.55 + 0.45 * Math.sin(t / 220 + i * 1.7);
          bar.style.height = `${18 + smooth * 82 * wobble}%`;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, getLevel]);

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void toggle();
  };

  const button = (size: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={playing}
      aria-label={playing ? `Stop the sound of ${perfume.name}` : `Hear the sound of ${perfume.name}`}
      title={playing ? "Stop" : "Hear this scent"}
      className={`relative flex flex-shrink-0 items-center justify-center rounded-full border text-white backdrop-blur-md transition-colors hover:bg-white/15 ${size}`}
      style={{ borderColor: `${hex}99`, background: playing ? `${hex}33` : "rgba(0,0,0,0.35)" }}
    >
      <span
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: playing ? `0 0 18px 2px ${hex}` : "none", opacity: playing ? 0.4 : 0 }}
      />
      {state === "starting" ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : playing ? (
        <span className="relative flex h-4 w-4 items-end justify-between" aria-hidden="true">
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <span
              key={i}
              ref={(el) => { barRefs.current[i] = el; }}
              className="w-[2px] rounded-sm bg-white"
              style={{ height: "40%" }}
            />
          ))}
        </span>
      ) : (
        <SpeakerIcon />
      )}
    </button>
  );

  if (variant === "compact") {
    return <span className={`inline-flex ${className}`}>{button("h-9 w-9")}</span>;
  }

  const tiers: Array<[string, string, string[]]> = [
    ["Top", "the opening", perfume.topNotes],
    ["Heart", "the melody", perfume.heartNotes],
    ["Base", "the atmosphere", perfume.baseNotes],
  ];

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg ${className}`}
      aria-label="Hear this fragrance"
    >
      <div className="flex items-center gap-4">
        {button("h-14 w-14")}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: hex }}>
            {playing ? "Now playing" : "Hear this scent"}
          </p>
          <p className="truncate text-sm text-white/70">
            {playing ? perfume.name : "Built from this fragrance's notes. Headphones recommended."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/50">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            defaultValue={0.8}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-current"
            style={{ color: hex }}
          />
        </label>
      </div>
      
      {/* ✅ Conditionally render notes to avoid duplication on the detail page */}
      {!hideNotes && (
        <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
          {tiers.map(([label, role, notes]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-2.5">
              <dt className="font-semibold uppercase tracking-wider text-white/80">{label}</dt>
              <dd className="text-[10px] text-white/40">{role}</dd>
              <dd className="mt-1 text-white/60">{notes.join(", ")}</dd>
            </div>
          ))}
        </dl>
      )}
      
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </section>
  );
}
