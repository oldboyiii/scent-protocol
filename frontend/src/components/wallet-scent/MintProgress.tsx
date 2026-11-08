"use client";

// The three stages of a commit-reveal mint, driven by real transactions and real block numbers.
//   1. Seal    : the commit transaction
//   2. Mature  : wait a few blocks so the result cannot be gamed
//   3. Open    : the reveal transaction
// `stage` is the stage currently running (1 to 3). 4 means everything is done.

interface MintProgressProps {
  stage: 1 | 2 | 3 | 4;
  blocksDone: number;
  blocksTotal: number;
  accent?: string;
}

const STEPS = [
  { title: "Seal", hint: "Confirm in your wallet" },
  { title: "Mature", hint: "Letting the scent settle" },
  { title: "Open", hint: "Confirm in your wallet" },
];

export default function MintProgress({ stage, blocksDone, blocksTotal, accent = "#c084fc" }: MintProgressProps) {
  const pct = blocksTotal > 0 ? Math.min(100, Math.round((blocksDone / blocksTotal) * 100)) : 0;

  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <ol className="flex items-start justify-between gap-2">
        {STEPS.map((step, i) => {
          const n = i + 1;
          const done = stage > n;
          const active = stage === n;
          return (
            <li key={step.title} className="flex flex-1 flex-col items-center text-center">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-500 ${active ? "ws-step-active" : ""}`}
                style={{
                  borderColor: done || active ? accent : "rgba(255,255,255,0.15)",
                  background: done ? accent : active ? `${accent}26` : "transparent",
                  color: done ? "#0b0b14" : "#fff",
                  boxShadow: active ? `0 0 22px ${accent}88` : "none",
                }}
              >
                {done ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  n
                )}
              </span>
              <span className={`mt-2 text-sm font-semibold ${done || active ? "text-white" : "text-white/40"}`}>{step.title}</span>
              <span className="text-[11px] text-white/40">{active ? step.hint : done ? "Done" : ""}</span>
            </li>
          );
        })}
      </ol>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: stage === 2 ? `${pct}%` : stage > 2 ? "100%" : "0%", background: `linear-gradient(90deg, ${accent}, #f472b6)` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-white/50">
          {stage === 1 && "Sealing your scent onchain..."}
          {stage === 2 && `Maturing: block ${Math.min(blocksDone, blocksTotal)} of ${blocksTotal}`}
          {stage === 3 && "Ready. Opening the bottle..."}
          {stage === 4 && "Done"}
        </p>
      </div>

      <style>{`
        @keyframes wsPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .ws-step-active { animation: wsPulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ws-step-active { animation: none; } }
      `}</style>
    </div>
  );
}
