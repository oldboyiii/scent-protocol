"use client";

// The wallet analysis screen. It shows the real readings as they arrive, so the wait feels
// like a scan instead of a spinner. A reading that is still null shows a pulsing placeholder.

import { useEffect, useState } from "react";

export interface ScanMetrics {
  txCount: number | null;
  balanceEth: number | null;
  /** null while reading, -1 when the wallet age could not be found. */
  ageYears: number | null;
}

function useCountUp(target: number | null, ms = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null || target <= 0) {
      setValue(target ?? 0);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      setValue(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

interface RowProps {
  label: string;
  caption: string;
  ready: boolean;
  text: string;
  color: string;
}

function Row({ label, caption, ready, text, color }: RowProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-500"
      style={{ borderColor: ready ? `${color}88` : "rgba(255,255,255,0.1)", background: ready ? `${color}14` : "rgba(255,255,255,0.03)" }}
    >
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: ready ? color : "rgba(255,255,255,0.08)", color: ready ? "#0b0b14" : "rgba(255,255,255,0.4)" }}
      >
        {ready ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
        )}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
        <p className="truncate text-sm text-white/70">{ready ? text : caption}</p>
      </div>
    </div>
  );
}

export default function ScentScan({ metrics }: { metrics: ScanMetrics }) {
  const tx = useCountUp(metrics.txCount);
  const eth = useCountUp(metrics.balanceEth);
  const age = useCountUp(metrics.ageYears !== null && metrics.ageYears > 0 ? metrics.ageYears : null);
  const ageUnknown = metrics.ageYears === -1;
  const readyCount = [metrics.txCount, metrics.balanceEth, metrics.ageYears].filter((v) => v !== null).length;

  return (
    <div className="space-y-6 py-4 text-center" role="status" aria-live="polite">
      <div className="relative mx-auto h-36 w-36">
        <span className="ws-ring absolute inset-0 rounded-full border-2 border-purple-400/40" />
        <span className="ws-ring absolute inset-3 rounded-full border-2 border-pink-400/40" style={{ animationDirection: "reverse", animationDuration: "5s" }} />
        <span className="ws-ring absolute inset-6 rounded-full border-2 border-amber-300/40" style={{ animationDuration: "3s" }} />
        <span
          className="absolute inset-9 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(244,114,182,0.9), rgba(168,85,247,0.4) 60%, transparent 75%)",
            transform: `scale(${0.7 + readyCount * 0.15})`,
            transition: "transform 600ms ease",
          }}
        />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white">Reading your wallet</h3>
        <p className="mt-1 text-sm text-white/50">
          {readyCount === 0 && "Looking up your history..."}
          {readyCount === 1 && "First reading is in..."}
          {readyCount === 2 && "Almost there..."}
          {readyCount === 3 && "Blending your scent..."}
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-3">
        <Row label="Activity" caption="Counting transactions" ready={metrics.txCount !== null} text={`${Math.round(tx).toLocaleString()} transactions`} color="#f472b6" />
        <Row label="Weight" caption="Weighing your balance" ready={metrics.balanceEth !== null} text={`${eth.toFixed(eth < 10 ? 2 : 0)} ETH`} color="#c084fc" />
        <Row
          label="Time"
          caption="Measuring your history"
          ready={metrics.ageYears !== null}
          text={ageUnknown ? "Age not found, treated as new" : `${age.toFixed(1)} years on chain`}
          color="#fbbf24"
        />
      </div>

      <style>{`
        @keyframes wsSpin { to { transform: rotate(360deg); } }
        .ws-ring { animation: wsSpin 8s linear infinite; border-top-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .ws-ring { animation: none; } }
      `}</style>
    </div>
  );
}
