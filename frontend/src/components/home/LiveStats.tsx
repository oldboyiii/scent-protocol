"use client";

import { useEffect, useRef, useState } from "react";
import { loadHomeStats, type HomeStats } from "@/utils/homeStats";

/** Counts up from 0 to `value` once, unless the person prefers reduced motion. */
function useCountUp(value: number | null, ms = 900): number | null {
  const [shown, setShown] = useState<number | null>(null);
  const raf = useRef<number>();
  
  useEffect(() => {
    if (value === null) return;
    
    // Instantly show value for users who prefer reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      // Cubic ease-out for a premium feel
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, ms]);
  
  return shown;
}

function Stat({ label, value, loading }: { label: string; value: number | null; loading: boolean }) {
  const shown = useCountUp(value);
  
  return (
    <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
      {loading ? (
        <div className="h-9 w-14 rounded-lg bg-white/10 animate-pulse" aria-hidden />
      ) : (
        <p className="font-display text-4xl font-semibold leading-none tabular-nums text-amber-200 sm:text-5xl">
          {shown ?? value ?? "-"}
        </p>
      )}
      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/50">{label}</p>
    </div>
  );
}

/** Three numbers read from the contracts. If nothing can be read, the strip does not appear. */
export default function LiveStats() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    loadHomeStats()
      .then((s) => live && setStats(s))
      .finally(() => live && setLoading(false));
      
    return () => {
      live = false;
    };
  }, []);

  // Hide the entire strip if we couldn't fetch any meaningful data
  if (!loading && stats && stats.created === null && stats.listed === null) return null;

  return (
    <section aria-label="Live from Arc" className="w-full max-w-3xl px-4">
      <div className="glass-card grid grid-cols-3 divide-x divide-white/10 overflow-hidden">
        <Stat label="Fragrances created" value={stats?.created ?? null} loading={loading} />
        <Stat label="For sale now" value={stats?.listed ?? null} loading={loading} />
        <Stat label="Collections" value={stats?.collections ?? null} loading={loading} />
      </div>
      <p className="mt-2 text-center text-[11px] text-white/30">Read live from the contracts on Arc</p>
    </section>
  );
}
