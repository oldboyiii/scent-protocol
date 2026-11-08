"use client";

// Falling confetti for the celebration screen. Pure CSS, no packages.
// The pieces are generated from a fixed seed, so a re-render never reshuffles them.
// Skipped completely when the visitor prefers reduced motion.

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface ConfettiProps {
  /** How many pieces. Scale it with rarity. */
  count?: number;
  colors?: string[];
  /** Milliseconds before the pieces are removed from the page. */
  lifetime?: number;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEFAULT_COLORS = ["#f472b6", "#c084fc", "#fbbf24", "#60a5fa", "#34d399"];

export default function Confetti({ count = 70, colors = DEFAULT_COLORS, lifetime = 7000 }: ConfettiProps) {
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const t = setTimeout(() => setVisible(false), lifetime);
    return () => clearTimeout(t);
  }, [lifetime]);

  const pieces = useMemo(() => {
    const r = rng(count * 7919 + colors.length);
    return Array.from({ length: count }, (_, i) => ({
      left: r() * 100,
      delay: r() * 1.6,
      duration: 3.2 + r() * 2.6,
      size: 6 + r() * 7,
      color: colors[i % colors.length],
      drift: (r() - 0.5) * 160,
      round: r() > 0.6,
    }));
  }, [count, colors]);

  if (!visible || reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[150] overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="ws-confetti absolute top-0 block"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              background: p.color,
              borderRadius: p.round ? "50%" : "2px",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes ws-fall {
          0% { transform: translate3d(0, -8vh, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--drift), 108vh, 0) rotate(720deg); opacity: 0.85; }
        }
        .ws-confetti { animation-name: ws-fall; animation-timing-function: cubic-bezier(0.25, 0.6, 0.4, 1); animation-fill-mode: both; }
      `}</style>
    </div>
  );
}
