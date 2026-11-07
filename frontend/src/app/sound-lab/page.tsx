"use client";

// Sound Lab: a private page for tuning the scent sound by ear.
// Save as src/app/sound-lab/page.tsx, open /sound-lab, move the sliders while a scent
// is playing, then press "Copy settings" and paste the result back to me.
// Remove the page before launch if you do not want it public.

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TUNING, playScent, stopScent } from "@/components/sound/scentSound";
import type { ScentSoundEngine, Tuning } from "@/components/sound/scentSound";

const TOP = ["Bergamot", "Lemon", "Lavender", "Grapefruit", "Orange", "Mint", "Eucalyptus", "Basil", "Rosemary", "Thyme"];
const HEART = ["Rose", "Jasmine", "Lily", "Geranium", "Neroli", "Ylang-Ylang", "Chamomile", "Lavender", "Petitgrain", "Heliotrope"];
const BASE = ["Vanilla", "Sandalwood", "Cedarwood", "Vetiver", "Patchouli", "Amber", "Musk", "Tonka Bean", "Benzoin", "Oud"];
const RARITIES = ["Common", "Rare", "Epic", "Legendary"];

interface Preset {
  label: string;
  top: string[];
  heart: string[];
  base: string[];
  rarity: number;
}

const PRESETS: Preset[] = [
  { label: "Morning citrus", top: ["Bergamot", "Grapefruit", "Mint"], heart: ["Neroli", "Lavender", "Geranium"], base: ["Musk", "Cedarwood", "Vanilla"], rarity: 0 },
  { label: "Romantic evening", top: ["Orange", "Bergamot", "Lavender"], heart: ["Rose", "Jasmine", "Ylang-Ylang"], base: ["Vanilla", "Amber", "Musk"], rarity: 2 },
  { label: "Night oud", top: ["Thyme", "Rosemary", "Basil"], heart: ["Heliotrope", "Geranium", "Lavender"], base: ["Oud", "Patchouli", "Vetiver"], rarity: 3 },
  { label: "Forest", top: ["Eucalyptus", "Mint", "Rosemary"], heart: ["Chamomile", "Petitgrain", "Lavender"], base: ["Cedarwood", "Sandalwood", "Vetiver"], rarity: 1 },
  { label: "Soft cream", top: ["Lemon", "Orange", "Bergamot"], heart: ["Lily", "Jasmine", "Neroli"], base: ["Tonka Bean", "Benzoin", "Vanilla"], rarity: 0 },
];

interface SliderDef {
  key: keyof Tuning;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  restart?: boolean;
}

const SLIDERS: SliderDef[] = [
  { key: "drone", label: "Base drone", min: 0, max: 2, step: 0.05, hint: "Deep low layer" },
  { key: "pad", label: "Heart pad", min: 0, max: 2.5, step: 0.05, hint: "Warm chord layer" },
  { key: "chimes", label: "Chime level", min: 0, max: 3, step: 0.05, hint: "How loud the bells are" },
  { key: "chimeDensity", label: "Chime density", min: 0, max: 3, step: 0.05, hint: "How often bells play" },
  { key: "breath", label: "Airy breath", min: 0, max: 3, step: 0.05, hint: "Herbal wind sound" },
  { key: "crackle", label: "Wood crackle", min: 0, max: 3, step: 0.05, hint: "Fire and wood clicks" },
  { key: "reverbWet", label: "Reverb level", min: 0, max: 1.5, step: 0.05, hint: "Space and echo" },
  { key: "reverbSend", label: "Reverb amount", min: 0, max: 1.5, step: 0.05, hint: "How much each layer feeds the echo" },
  { key: "reverbLength", label: "Reverb length", min: 0.4, max: 2.5, step: 0.1, hint: "Applies on restart", restart: true },
  { key: "brightness", label: "Brightness", min: 0.3, max: 1.8, step: 0.05, hint: "Lower is darker and softer" },
  { key: "tempo", label: "Chord length", min: 0.5, max: 2, step: 0.05, hint: "Lower changes chords faster" },
];

function Picker({ label, pool, value, onChange }: { label: string; pool: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wider text-white/40">{label}</p>
      <div className="flex flex-wrap gap-2">
        {value.map((note, i) => (
          <select
            key={i}
            value={note}
            onChange={(e) => onChange(value.map((n, j) => (j === i ? e.target.value : n)))}
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
            aria-label={`${label} note ${i + 1}`}
          >
            {pool.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}

export default function SoundLab() {
  const [top, setTop] = useState(PRESETS[0].top);
  const [heart, setHeart] = useState(PRESETS[0].heart);
  const [base, setBase] = useState(PRESETS[0].base);
  const [rarity, setRarity] = useState(0);
  const [seed, setSeed] = useState("lab-1");
  const [tuning, setTuning] = useState<Tuning>({ ...DEFAULT_TUNING });
  const [volume, setVolume] = useState(0.8);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const engineRef = useRef<ScentSoundEngine | null>(null);
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const start = useCallback(async () => {
    const engine = await playScent({ seed, rarity, topNotes: top, heartNotes: heart, baseNotes: base }, tuningRef.current);
    engine.setVolume(volumeRef.current);
    engineRef.current = engine;
    engine.onStop = () => {
      if (engineRef.current === engine) {
        engineRef.current = null;
        setPlaying(false);
      }
    };
    setPlaying(true);
  }, [seed, rarity, top, heart, base]);

  // Changing the notes, rarity or seed while playing restarts with the new scent.
  const startRef = useRef(start);
  startRef.current = start;
  const playingRef = useRef(false);
  playingRef.current = playing;
  useEffect(() => {
    if (playingRef.current) void startRef.current();
  }, [seed, rarity, top, heart, base]);

  useEffect(() => () => stopScent(), []);

  const toggle = () => {
    if (playing) stopScent();
    else void start();
  };

  const update = (key: keyof Tuning, value: number) => {
    setTuning((t) => ({ ...t, [key]: value }));
    engineRef.current?.setTuning({ [key]: value });
  };

  const applyPreset = (p: Preset) => {
    setTop(p.top);
    setHeart(p.heart);
    setBase(p.base);
    setRarity(p.rarity);
  };

  const settings = JSON.stringify({ notes: { top, heart, base }, rarity, seed, tuning }, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settings);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-10 text-white">
      <header>
        <h1 className="text-2xl font-bold">Sound Lab</h1>
        <p className="mt-1 text-sm text-white/50">
          Pick a scent, press play, and move the sliders while it plays. Use headphones. Press Copy settings when it sounds right.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">
              {p.label}
            </button>
          ))}
        </div>
        <Picker label="Top notes" pool={TOP} value={top} onChange={setTop} />
        <Picker label="Heart notes" pool={HEART} value={heart} onChange={setHeart} />
        <Picker label="Base notes" pool={BASE} value={base} onChange={setBase} />
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs uppercase tracking-wider text-white/40">
            Rarity
            <select value={rarity} onChange={(e) => setRarity(Number(e.target.value))} className="mt-1 block rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm normal-case tracking-normal text-white">
              {RARITIES.map((r, i) => (
                <option key={r} value={i}>{r}</option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-wider text-white/40">
            Seed (changes the key and chords)
            <input value={seed} onChange={(e) => setSeed(e.target.value)} className="mt-1 block w-48 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm normal-case tracking-normal text-white" />
          </label>
          <label className="flex-1 text-xs uppercase tracking-wider text-white/40">
            Volume {Math.round(volume * 100)}%
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                engineRef.current?.setVolume(v);
              }}
              className="mt-2 block w-full"
            />
          </label>
        </div>
        <button type="button" onClick={toggle} className="w-full rounded-xl bg-cyan-500/80 py-3 text-sm font-semibold text-black hover:bg-cyan-400">
          {playing ? "Stop" : "Play"}
        </button>
        {playing && (
          <button type="button" onClick={() => void start()} className="w-full rounded-xl border border-white/15 py-2 text-xs text-white/70 hover:bg-white/5">
            Restart (applies reverb length)
          </button>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Mix</h2>
          <button
            type="button"
            onClick={() => {
              setTuning({ ...DEFAULT_TUNING });
              engineRef.current?.setTuning({ ...DEFAULT_TUNING });
            }}
            className="text-xs text-white/50 underline hover:text-white"
          >
            Reset to default
          </button>
        </div>
        {SLIDERS.map((s) => (
          <label key={s.key} className="block">
            <span className="flex justify-between text-sm">
              <span>{s.label} <span className="text-xs text-white/40">{s.hint}</span></span>
              <span className="tabular-nums text-white/60">{tuning[s.key].toFixed(2)}</span>
            </span>
            <input
              type="range" min={s.min} max={s.max} step={s.step} value={tuning[s.key]}
              onChange={(e) => update(s.key, Number(e.target.value))}
              className="mt-1 block w-full"
            />
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Settings to send me</h2>
          <button type="button" onClick={() => void copy()} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">
            {copied ? "Copied" : "Copy settings"}
          </button>
        </div>
        <textarea readOnly value={settings} rows={10} className="w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/70" />
      </section>
    </main>
  );
}
