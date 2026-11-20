"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import EvolutionBadge from "@/components/EvolutionBadge";
import SlideOver from "@/components/SlideOver";
import { EVOLUTION_ADDRESS, evolve, getEvolution, startHoldingStreak } from "@/utils/evolution";
import type { Evolution } from "@/utils/evolution";

const READ_RPC = "https://rpc.mainnet.arc.io";
const STREAK_GOAL_DAYS = 30;
const PREVIEW_STEPS: Array<{ label: string; days: number }> = [
  { label: "Fresh", days: 0 },
  { label: "Aged", days: 45 },
  { label: "Matured", days: 120 },
  { label: "Vintage", days: 200 },
];

let readProvider: ethers.JsonRpcProvider | null = null;
function reader() {
  if (!readProvider) readProvider = new ethers.JsonRpcProvider(READ_RPC);
  return readProvider;
}

function explain(err: unknown): string {
  const e = err as { code?: string | number; shortMessage?: string; reason?: string; message?: string };
  if (e?.code === 4001 || e?.code === "ACTION_REJECTED") return "You rejected the transaction.";
  const text = e?.reason || e?.shortMessage || e?.message || "";
  if (/CollectionNotSupported|collection/i.test(text)) return "This collection is not enabled for evolution yet.";
  if (/NotTokenOwner|owner/i.test(text)) return "Only the current owner can start a streak.";
  return text ? text.slice(0, 160) : "Could not start the streak. Please try again.";
}

interface Props {
  /** Collection contract the token belongs to. */
  nft: string;
  tokenId: string | number;
  baseRarity: number;
  /** Creation time in seconds, from the collection. */
  createdAt: number;
  isOwner: boolean;
}

/**
 * Full evolution details (shown inside the slide-out panel). The stage, note and projected rarity are worked out locally
 * from the creation time. The ScentEvolution contract is then asked the same question: when it agrees
 * the panel says so, and it supplies the holding streak, which only the chain knows.
 */
function EvolutionDetails({ nft, tokenId, baseRarity, createdAt, isOwner }: Props) {
  const local = useMemo(() => evolve(nft, tokenId, baseRarity, createdAt), [nft, tokenId, baseRarity, createdAt]);
  const [onchain, setOnchain] = useState<Evolution | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview mode: /nft/10?previewAge=200 shows how this scent looks at 200 days. It never changes real data.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawPreview = searchParams.get("previewAge");
  const previewDays = rawPreview !== null && /^\d{1,4}$/.test(rawPreview) ? Math.min(Number(rawPreview), 3650) : null;
  const preview = useMemo(
    () =>
      previewDays === null
        ? null
        : evolve(nft, tokenId, baseRarity, Math.floor(Date.now() / 1000) - previewDays * 86400),
    [previewDays, nft, tokenId, baseRarity],
  );
  const setPreview = useCallback(
    (days: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (days === null) params.delete("previewAge");
      else params.set("previewAge", String(days));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const refresh = useCallback(async () => {
    if (!EVOLUTION_ADDRESS) return;
    setOnchain(await getEvolution(reader(), nft, tokenId));
  }, [nft, tokenId]);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!EVOLUTION_ADDRESS) return;
      const r = await getEvolution(reader(), nft, tokenId);
      if (live) setOnchain(r);
    })();
    return () => {
      live = false;
    };
  }, [nft, tokenId]);

  const agrees =
    !!local &&
    !!onchain &&
    local.stage === onchain.stage &&
    local.effectiveRarity === onchain.effectiveRarity &&
    local.evolvedNote === onchain.evolvedNote;

  useEffect(() => {
    if (local && onchain && !agrees) console.warn("Evolution: the app and the contract disagree", { local, onchain });
  }, [local, onchain, agrees]);

  const shown: Evolution | null =
    local && onchain
      ? { ...local, streakActive: onchain.streakActive, streakDays: onchain.streakDays, streakBadge: onchain.streakBadge }
      : local;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
      if (!eth) throw new Error("No wallet found.");
      const signer = await new ethers.BrowserProvider(eth).getSigner();
      await startHoldingStreak(signer, nft, tokenId);
      await refresh();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }

  if (preview && previewDays !== null) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-400/50 bg-amber-400/[0.05] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            Preview mode
          </span>
          <button type="button" onClick={() => setPreview(null)} className="min-h-[44px] px-2 text-xs text-white/60 underline hover:text-white">
            Exit preview
          </button>
        </div>
        <p className="mt-1 text-xs text-white/60">
          This shows the scent at {previewDays} days old. It is not its real age, and nothing is saved.
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Preview a stage">
          {PREVIEW_STEPS.map((step) => {
            const active = preview.stageName === step.label;
            return (
              <button
                key={step.label}
                type="button"
                aria-pressed={active}
                onClick={() => setPreview(step.days)}
                className={`min-h-[44px] rounded-full border px-4 text-xs font-semibold transition-colors ${
                  active ? "border-amber-400/70 bg-amber-400/15 text-amber-200" : "border-white/15 bg-white/5 text-white/65 hover:bg-white/10"
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <EvolutionBadge evolution={preview} />
        </div>
      </div>
    );
  }

  if (!shown) return null;
  const streakDays = onchain?.streakActive ? onchain.streakDays : 0;
  const pct = Math.min(100, Math.round((streakDays / STREAK_GOAL_DAYS) * 100));

  return (
    <div className="space-y-2">
      <EvolutionBadge evolution={shown} />
      <button
        type="button"
        onClick={() => setPreview(200)}
        className="min-h-[44px] text-xs text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
      >
        Preview later stages
      </button>

      {onchain && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Holding streak</p>
            {agrees && (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-emerald-300/90"
                title="The ScentEvolution contract returns the same stage, note and rarity."
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Matches the contract
              </span>
            )}
          </div>

          {onchain.streakActive ? (
            <div className="mt-2">
              <p className="text-sm text-white">
                {streakDays} {streakDays === 1 ? "day" : "days"} held
                <span className="text-white/45"> by the current owner</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-white/45">
                {onchain.streakBadge ? "Streak badge earned. It resets if the NFT changes owner." : `${Math.max(STREAK_GOAL_DAYS - streakDays, 0)} days to the streak badge.`}
              </p>
            </div>
          ) : isOwner ? (
            <div className="mt-2">
              <p className="text-xs leading-relaxed text-white/55">
                Start a streak to earn a badge after {STREAK_GOAL_DAYS} days of holding. It is free to start, never changes the NFT, and resets if it changes owner.
              </p>
              <button
                type="button"
                onClick={start}
                disabled={busy}
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Confirm in your wallet..." : "Start holding streak"}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/45">The owner has not started a streak yet.</p>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const ROW_STYLE = [
  { color: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.06)" },
  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  { color: "#fcd34d", bg: "rgba(252,211,77,0.16)" },
  { color: "#fde68a", bg: "rgba(253,230,138,0.2)" },
];

/**
 * One compact row for the detail card: the stage and age at a glance. Tapping it opens the full details
 * (evolution summary, holding streak and preview) in a slide-out panel so the card stays short.
 * A shared preview link (?previewAge=N) opens the panel straight away.
 */
export default function EvolutionPanel(props: Props) {
  const { nft, tokenId, baseRarity, createdAt } = props;
  const local = useMemo(() => evolve(nft, tokenId, baseRarity, createdAt), [nft, tokenId, baseRarity, createdAt]);
  const searchParams = useSearchParams();
  const previewing = /^\d{1,4}$/.test(searchParams.get("previewAge") ?? "");
  const [open, setOpen] = useState(previewing);

  useEffect(() => {
    if (previewing) setOpen(true);
  }, [previewing]);

  if (!local) return null;
  const st = ROW_STYLE[Math.min(local.stage, 3)];
  const next = local.daysToNextStage !== null ? `Next stage in ${local.daysToNextStage} ${local.daysToNextStage === 1 ? "day" : "days"}` : "Fully evolved";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="group flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.07]"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: st.color, background: st.bg, borderColor: `${st.color}55` }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
            {local.stageName}
          </span>
          <span className="text-xs text-white/55">
            {local.ageDays} days old{previewing ? "" : `, ${next.charAt(0).toLowerCase()}${next.slice(1)}`}
          </span>
          {previewing && (
            <span className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Preview
            </span>
          )}
        </span>
        <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-amber-300 group-hover:text-amber-200">
          Evolution
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>

      <SlideOver open={open} onClose={() => setOpen(false)} title="Evolution">
        <EvolutionDetails {...props} />
      </SlideOver>
    </>
  );
}
