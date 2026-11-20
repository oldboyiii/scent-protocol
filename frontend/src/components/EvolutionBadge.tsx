"use client";

import type { Evolution } from "@/utils/evolution";

const TIER = ["Common", "Rare", "Epic", "Legendary"];
const STAGE_STYLE = [
  { color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.06)" }, // Fresh
  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" }, // Aged
  { color: "#fcd34d", bg: "rgba(252,211,77,0.16)" }, // Matured
  { color: "#fde68a", bg: "rgba(253,230,138,0.2)" }, // Vintage
];

/**
 * Small evolution summary for a fragrance: stage chip, projected rarity, evolved note and streak.
 * `compact` fits a card header; the default layout fits a detail page.
 */
export default function EvolutionBadge({ evolution, compact = false }: { evolution: Evolution | null; compact?: boolean }) {
  if (!evolution) return null;
  // On a card, only show the chip once the scent has actually evolved.
  if (compact && evolution.stage === 0) return null;
  const s = STAGE_STYLE[Math.min(evolution.stage, 3)];
  const upgraded = evolution.effectiveRarity > evolution.baseRarity;
  const next =
    evolution.daysToNextStage !== null
      ? `Next stage in ${evolution.daysToNextStage} ${evolution.daysToNextStage === 1 ? "day" : "days"}`
      : "Fully evolved";

  const chip = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: s.color, background: s.bg, borderColor: `${s.color}55` }}
      title={`${evolution.stageName}, ${evolution.ageDays} days old. ${next}.`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {evolution.stageName}
    </span>
  );

  if (compact) return chip;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center gap-2">
        {chip}
        <span className="text-xs text-white/50">{evolution.ageDays} days old</span>
        {evolution.streakBadge && (
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            Held {evolution.streakDays} days
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-white/40">Rarity</dt>
          <dd className="mt-0.5 text-white">
            {TIER[evolution.baseRarity] ?? "Unknown"}
            {upgraded && (
              <span className="text-amber-300">
                {" "}
                <span aria-hidden>{"\u2192"}</span> {TIER[evolution.effectiveRarity]} <span className="text-xs text-white/50">(evolved)</span>
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-white/40">Evolved note</dt>
          <dd className="mt-0.5 text-white">{evolution.evolvedNote ?? <span className="text-white/40">Unlocks at Aged</span>}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-white/45">
        {next}. The base rarity on the NFT never changes. The evolved rarity is shown in the app only.
      </p>
    </div>
  );
}
