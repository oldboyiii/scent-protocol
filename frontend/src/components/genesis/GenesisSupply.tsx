"use client";

// Live supply display for the Genesis drop: animated counters, a shimmering progress bar and milestone marks.

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, ms = 900): number {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const next = Math.round(start + (target - start) * eased);
      setValue(next);
      from.current = next;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

interface GenesisSupplyProps {
  minted: number;
  total: number;
  loaded: boolean;
}

export default function GenesisSupply({ minted, total, loaded }: GenesisSupplyProps) {
  const shownMinted = useCountUp(loaded ? minted : 0);
  const shownLeft = useCountUp(loaded ? total - minted : total);
  const pct = total > 0 ? Math.min(100, (minted / total) * 100) : 0;
  const almostGone = loaded && total - minted <= 10 && total - minted > 0;

  return (
    <section aria-label="Genesis supply" className="mb-14">
      <div className="mb-8 grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-4xl font-bold tabular-nums text-white">{shownMinted}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-white/40">Minted</p>
        </div>
        <div>
          <p className="text-4xl font-bold tabular-nums text-amber-400">{total}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-white/40">Total</p>
        </div>
        <div>
          <p className={`text-4xl font-bold tabular-nums ${almostGone ? "gn-pulse text-orange-400" : "text-white"}`}>{shownLeft}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{almostGone ? "Almost gone" : "Remaining"}</p>
        </div>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="gn-shimmer h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
        {[25, 50, 75].map((m) => (
          <span key={m} className="absolute top-0 h-full w-px bg-white/15" style={{ left: `${m}%` }} aria-hidden="true" />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-white/40">{loaded ? `${pct.toFixed(0)}% claimed` : "Loading supply..."}</p>

      <style>{`
        .gn-shimmer { background-size: 200% 100%; animation: gnShimmer 3s linear infinite; }
        .gn-pulse { animation: gnPulse 1.4s ease-in-out infinite; }
        @keyframes gnShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes gnPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @media (prefers-reduced-motion: reduce) { .gn-shimmer, .gn-pulse { animation: none; } }
      `}</style>
    </section>
  );
}

