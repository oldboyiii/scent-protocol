"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentVibe } from "@/utils/weather";
import ScentPlayer from "@/components/sound/ScentPlayer";
import Link from "next/link";
import { NOTE_COLORS, CREATIVE_DESCRIPTIONS, TYPE_NAMES, GENDER_NAMES } from "@/utils/advisorData";
import { analyzeMood, rankListings, seedFor } from "@/utils/advisorMatch";
import type { RankedListing } from "@/utils/advisorMatch";
import { loadMarketListings } from "@/utils/marketListings";

// --- INTERFACES ---

export interface MintContext {
  gender: number;
  pType: number;
  mood?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  seedString: string;
  vibe?: string;
  archetype?: string;
  dnaColors?: string[];
  reason?: string;
}

const SCENARIO_ICONS: Record<string, JSX.Element> = {
  beach: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  work: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  date: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  gala: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  rebel: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
  artist: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  yoga: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  club: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  wedding: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  travel: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  
  // ✅ ADDED: Icons for new scenarios
  rain: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-2 2m6-2l-2 2" /></svg>,
  drive: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /><circle cx="12" cy="12" r="10" strokeWidth={1.5} strokeDasharray="4 4" /></svg>,
};

// --- COMPONENT ---

interface AIAdvisorProps {
  onSelect: (context: MintContext) => void;
}

export default function AIAdvisor({ onSelect }: AIAdvisorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [input, setInput] = useState("");
  const [selectedGender, setSelectedGender] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isVariating, setIsVariating] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [deepSuggestion, setDeepSuggestion] = useState<MintContext | null>(null);
  const [variation, setVariation] = useState(0);
  const [noMatch, setNoMatch] = useState(false);
  const [matches, setMatches] = useState<RankedListing[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const runRef = useRef(0);
  const [pickedTag, setPickedTag] = useState<string | null>(null); // UI only: shows the "applied" tick on a tile

  useEffect(() => {
    try {
      const saved = localStorage.getItem("scent-advisor-recent");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    const moodParam = searchParams.get("mood");
    const variationParam = searchParams.get("variation");
    if (moodParam && mode === 'deep') {
      setInput(moodParam);
      analyzeDeepMood(moodParam, variationParam ? Number(variationParam) : 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (deepSuggestion && deepSuggestion.mood) {
      const params = new URLSearchParams(window.location.search);
      params.set("mood", deepSuggestion.mood);
      params.set("variation", String(variation));
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [deepSuggestion, variation, router]);

  const saveRecentSearch = (text: string) => {
    const updated = [text, ...recentSearches.filter(s => s !== text)].slice(0, 3);
    setRecentSearches(updated);
    try {
      localStorage.setItem("scent-advisor-recent", JSON.stringify(updated));
    } catch {}
  };

  const getCreativeDescription = (gender: number, pType: number): string => {
    if (gender in CREATIVE_DESCRIPTIONS && pType in CREATIVE_DESCRIPTIONS[gender]) {
      return CREATIVE_DESCRIPTIONS[gender][pType];
    }
    return "";
  };

  const generateDNAColors = (notes: { top?: string[]; heart?: string[]; base?: string[] }): string[] => {
    const allNotes = [...(notes.top || []), ...(notes.heart || []), ...(notes.base || [])];
    const colors: string[] = [];
    
    allNotes.forEach(note => {
      const color = NOTE_COLORS[note] || NOTE_COLORS[note.split(" ")[0]];
      if (color) colors.push(color);
    });

    while (colors.length < 8) {
      colors.push("#6366f1");
    }
    
    return colors.slice(0, 8);
  };

  const handleQuickPick = (scenarioTags: string) => {
    const mood = analyzeMood(scenarioTags, selectedGender);
    onSelect({
      gender: mood.gender ?? selectedGender,
      pType: mood.pType,
      mood: scenarioTags,
      topNotes: mood.notes.top.length ? mood.notes.top : ["Bergamot"],
      heartNotes: mood.notes.heart.length ? mood.notes.heart : ["Floral"],
      baseNotes: mood.notes.base.length ? mood.notes.base : ["Musk"],
      seedString: seedFor(scenarioTags, 0),
    });
  };

  const analyzeDeepMood = (overrideText?: string, nextVariation = 0) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    setError(null);
    setNoMatch(false);
    setDeepSuggestion(null);
    setMatches([]);
    setMatchesError(false);
    setVariation(nextVariation);

    const mood = analyzeMood(text, selectedGender, nextVariation);
    if (!mood.recognized) {
      setNoMatch(true);
      return;
    }

    saveRecentSearch(text);

    const gender = mood.gender ?? selectedGender;
    
    // ✅ ADDED: Preserve full location/weather/time string if it looks like a weather context
    const isWeatherContext = text.toLowerCase().includes("°c") || text.toLowerCase().includes("time") || text.toLowerCase().includes(" in ");
    const vibeContext = isWeatherContext ? text : (mood.tags.length ? mood.tags.slice(0, 4).join(", ") : "unique and mysterious");
    
    let reason = `A fascinating blend of ${mood.tags.slice(0, 2).join(" & ")}.`;
    const creativeDesc = getCreativeDescription(gender, mood.pType);
    if (creativeDesc) reason += ` ${creativeDesc}`;

    setDeepSuggestion({
      gender,
      pType: mood.pType,
      mood: text,
      topNotes: mood.notes.top,
      heartNotes: mood.notes.heart,
      baseNotes: mood.notes.base,
      seedString: seedFor(text, nextVariation),
      vibe: vibeContext, // Now contains the full context string
      archetype: mood.archetype,
      dnaColors: generateDNAColors(mood.notes),
      reason,
    });

    const run = ++runRef.current;
    setMatchesLoading(true);
    loadMarketListings()
      .then((list) => { 
        if (run === runRef.current) {
          setMatches(rankListings(mood, list, gender, 3));
          setMatchesError(false);
        }
      })
      .catch(() => { 
        if (run === runRef.current) {
          setMatches([]);
          setMatchesError(true);
        }
      })
      .finally(() => { 
        if (run === runRef.current) setMatchesLoading(false); 
      });
  };

  const quickScenarios = [
    { icon: "beach", text: "Beach sunset", tags: "summer beach" },
    { icon: "work", text: "CEO meeting", tags: "work elegant" },
    { icon: "date", text: "First date", tags: "date romantic" },
    { icon: "gala", text: "Gala night", tags: "luxury elegant" },
    { icon: "rebel", text: "Rebel vibe", tags: "rebel bold" },
    { icon: "yoga", text: "Morning yoga", tags: "sport fresh" },
    { icon: "club", text: "Night club", tags: "party bold" },
    { icon: "wedding", text: "Wedding day", tags: "romantic elegant" },
    { icon: "travel", text: "Adventure trip", tags: "summer fresh" },
    { icon: "artist", text: "Artist mood", tags: "artist creative" },
    
    // ✅ ADDED: Two new scenarios to perfectly fill the 3x4 grid
    { icon: "rain", text: "Rainy walk", tags: "fresh earthy" },
    { icon: "drive", text: "Midnight drive", tags: "mysterious bold" },
  ];

  // ---- Presentation only: nothing below changes how moods are analysed or matched ----
  const SCENARIO_HUE: Record<string, string> = {
    beach: "#38bdf8", work: "#94a3b8", date: "#f472b6", gala: "#fbbf24", rebel: "#ef4444",
    yoga: "#34d399", club: "#a855f7", wedding: "#fda4af", travel: "#22d3ee", artist: "#f59e0b",
    // ✅ ADDED: Colors for new scenarios
    rain: "#60a5fa", drive: "#c084fc",
  };
  const exampleMoods = ["romantic evening", "rainy forest", "office meeting", "beach holiday", "cozy winter", "night club"];
  const noteColor = (note: string) => NOTE_COLORS[note] || NOTE_COLORS[note.split(" ")[0]] || "#6366f1";
  const pick = (tags: string) => {
    handleQuickPick(tags);
    setPickedTag(tags);
    setTimeout(() => setPickedTag(null), 1800);
  };
  const dnaRing = (colors: string[] = []) => {
    if (colors.length === 0) return "conic-gradient(#6366f1 0 100%)";
    const step = 100 / colors.length;
    return `conic-gradient(${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
  };
  const sectionLabel = "text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40";
  const spinner = (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="glass-card relative overflow-hidden p-5 sm:p-7 max-w-2xl w-full border border-white/10">
      {/* soft ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 7.071l.707.707M12 9a3 3 0 100 6 3 3 0 000-6z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold tracking-tight text-white">Scent AI Advisor</h3>
            <p className="text-sm text-white/50">Tell it the moment. It shapes the scent.</p>
          </div>
        </div>

        {/* mode switch with a sliding highlight */}
        <div role="tablist" aria-label="Advisor mode" className="relative grid grid-cols-2 p-1 rounded-2xl bg-black/25 border border-white/10 mb-6">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 transition-transform duration-300 ease-out"
            style={{ transform: mode === "deep" ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            role="tab"
            aria-selected={mode === "quick"}
            onClick={() => { setMode("quick"); setDeepSuggestion(null); setError(null); }}
            className={`relative z-10 h-11 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${mode === "quick" ? "text-white" : "text-white/60 hover:text-white/90"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Quick Pick
          </button>
          <button
            role="tab"
            aria-selected={mode === "deep"}
            onClick={() => { setMode("deep"); setDeepSuggestion(null); setError(null); }}
            className={`relative z-10 h-11 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${mode === "deep" ? "text-white" : "text-white/60 hover:text-white/90"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Deep Mood
          </button>
        </div>

        {mode === "quick" && (
          <div className="animate-fade-up">
            <p className={`${sectionLabel} mb-2.5`}>Who is it for?</p>
            <div className="grid grid-cols-3 gap-2 mb-6" role="radiogroup" aria-label="Preference">
              {GENDER_NAMES.map((g, i) => (
                <button
                  key={g}
                  role="radio"
                  aria-checked={selectedGender === i}
                  onClick={() => setSelectedGender(i)}
                  className={`h-11 rounded-xl text-sm font-medium border transition-all ${
                    selectedGender === i
                      ? "bg-white/10 border-amber-400/60 text-white shadow-[0_0_0_3px_rgba(251,191,36,0.12)]"
                      : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/90"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <p className={`${sectionLabel} mb-2.5`}>Pick the moment</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {quickScenarios.map((scenario) => {
                const hue = SCENARIO_HUE[scenario.icon] || "#a78bfa";
                const done = pickedTag === scenario.tags;
                return (
                  <button
                    key={scenario.text}
                    onClick={() => pick(scenario.tags)}
                    disabled={loading}
                    className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                      done ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5"
                      style={{ backgroundColor: `${hue}22`, color: hue }}
                    >
                      {SCENARIO_ICONS[scenario.icon]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{scenario.text}</span>
                      <span className="block truncate text-[11px] text-white/40">
                        {done ? "Applied to the mint form" : scenario.tags.split(" ").join(" \u00b7 ")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === "deep" && (
          <div className="animate-fade-up">
            {!deepSuggestion ? (
              <>
                <button
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const vibe = await getCurrentVibe();
                      setInput(vibe);
                      analyzeDeepMood(vibe);
                    } catch (err: any) {
                      setError(err.message || "Failed to detect location. Please enter manually.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="group w-full flex items-center gap-3.5 rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/10 to-violet-500/10 p-3.5 text-left transition-all hover:border-sky-300/40 hover:from-sky-500/15 hover:to-violet-500/15 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
                    {loading ? spinner : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{loading ? "Reading your surroundings..." : "Get my current vibe"}</span>
                    <span className="block text-xs text-white/50">Adds your weather, place and local time. Runs only when you press this.</span>
                  </span>
                  <svg className="w-4 h-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                {error && (
                  <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="shrink-0 underline hover:text-red-200">Dismiss</button>
                  </div>
                )}

                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/30" aria-hidden="true">
                  <span className="h-px flex-1 bg-white/10" />
                  or describe it
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="relative">
                  <label htmlFor="advisor-mood" className="sr-only">Describe your mood, place or occasion</label>
                  <input
                    id="advisor-mood"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && analyzeDeepMood()}
                    placeholder="e.g. romantic winter evening in Paris"
                    className="min-h-[52px] w-full rounded-2xl border border-white/10 bg-black/25 py-3.5 pl-4 pr-28 text-[15px] text-white placeholder-white/30 transition focus:border-amber-400/60 focus:outline-none focus:ring-4 focus:ring-amber-400/10"
                  />
                  <button
                    onClick={() => analyzeDeepMood()}
                    disabled={loading || !input.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 text-sm font-semibold text-white transition-all hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    {loading ? spinner : "Analyze"}
                  </button>
                </div>

                {noMatch && (
                  <p role="status" className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
                    I could not read a mood from that. Try a few words about the place, the weather or the feeling, in English or Russian. Some ideas are just below.
                  </p>
                )}

                <div className="mt-4">
                  <p className={`${sectionLabel} mb-2`}>Try</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exampleMoods.map((ex) => (
                      <button key={ex} onClick={() => { setInput(ex); analyzeDeepMood(ex); }} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-amber-400/40 hover:bg-white/[0.08] hover:text-white">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {recentSearches.length > 0 && (
                  <div className="mt-4">
                    <p className={`${sectionLabel} mb-2 flex items-center gap-1.5`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Recent
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term) => (
                        <button key={term} onClick={() => { setInput(term); analyzeDeepMood(term); }} className="max-w-full truncate rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 transition hover:border-white/30 hover:text-white">
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] animate-fade-up">
                {/* the scent DNA as a colour strip along the top */}
                <div className="flex h-1.5" aria-hidden="true">
                  {deepSuggestion.dnaColors?.map((color, i) => (
                    <span key={i} className="h-full flex-1" style={{ backgroundColor: color }} />
                  ))}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">Your scent archetype</p>
                      <h4 className="mt-1 text-2xl font-bold tracking-tight text-white text-balance">{deepSuggestion.archetype}</h4>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/55">
                        <span>{GENDER_NAMES[deepSuggestion.gender]} {TYPE_NAMES[deepSuggestion.pType]}</span>
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          {deepSuggestion.pType === 0 ? "Intense" : deepSuggestion.pType === 1 ? "Elegant" : deepSuggestion.pType === 2 ? "Fresh" : "Light"}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-[72px] w-[72px] shrink-0" aria-hidden="true">
                      <div className="absolute inset-0 rounded-full" style={{ background: dnaRing(deepSuggestion.dnaColors) }} />
                      <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-[#1a1030] text-[10px] font-bold uppercase tracking-widest text-white/60">DNA</div>
                    </div>
                  </div>

                  {deepSuggestion.vibe && deepSuggestion.vibe !== "unique and mysterious" && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3.5 py-3">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="min-w-0">
                        <p className={sectionLabel}>Based on</p>
                        <p className="mt-0.5 text-sm text-white/85 text-pretty">{deepSuggestion.vibe}</p>
                      </div>
                    </div>
                  )}

                  <blockquote className="mt-4 border-l-2 border-amber-400/50 pl-3.5 text-sm italic leading-relaxed text-white/70 text-pretty">
                    {deepSuggestion.reason}
                  </blockquote>

                  {/* notes as a pyramid: opening, melody, atmosphere */}
                  <div className="mt-5 space-y-2.5 rounded-xl border border-white/10 bg-black/20 p-3.5">
                    {([
                      ["Top", "the opening", deepSuggestion.topNotes],
                      ["Heart", "the melody", deepSuggestion.heartNotes],
                      ["Base", "the atmosphere", deepSuggestion.baseNotes],
                    ] as const).map(([tier, role, notes]) => (
                      <div key={tier} className="flex items-start gap-3">
                        <div className="w-16 shrink-0 pt-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{tier}</p>
                          <p className="text-[10px] text-white/35">{role}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {notes?.map((note) => (
                            <span key={note} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/85">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: noteColor(note) }} />
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-white/35">*Actual minted notes will be generated on-chain based on this vibe.</p>

                  <div className="mt-5">
                    <p className={`${sectionLabel} mb-2`}>Hear this mood</p>
                    <ScentPlayer
                      variant="full"
                      hideNotes={true}
                      tokenId={`advisor-${deepSuggestion.seedString}`}
                      perfume={{
                        name: deepSuggestion.archetype || "Your mood",
                        rarity: 1,
                        topNotes: deepSuggestion.topNotes ?? [],
                        heartNotes: deepSuggestion.heartNotes ?? [],
                        baseNotes: deepSuggestion.baseNotes ?? [],
                      }}
                    />
                  </div>

                  <div className="mt-5" aria-live="polite">
                    <div className="mb-2 flex items-center justify-between">
                      <p className={sectionLabel}>Already on the marketplace</p>
                      {!matchesLoading && !matchesError && matches.length > 0 && <span className="text-[11px] text-white/35">{matches.length} fit{matches.length === 1 ? "s" : ""} this mood</span>}
                    </div>
                    {matchesLoading && (
                      <div className="space-y-2" aria-label="Scanning marketplace listings">
                        {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.05]" />)}
                      </div>
                    )}
                    {!matchesLoading && matchesError && (
                      <p className="text-xs text-amber-300/80">Marketplace data temporarily unavailable, but you can still mint a new fragrance based on this profile below.</p>
                    )}
                    {!matchesLoading && !matchesError && matches.length === 0 && (
                      <p className="text-xs text-white/40">No listed fragrance fits this mood right now. Mint a new one below.</p>
                    )}
                    <div className="space-y-2">
                      {matches.map((m, idx) => (
                        <Link key={`${m.collection}-${m.tokenId}`} href={m.href} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all hover:border-amber-400/40 hover:bg-white/[0.08]">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-white/60 tabular-nums">{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-amber-300">{m.name}</p>
                            <p className="truncate text-xs text-white/50">Fits with {m.matchedNotes.slice(0, 3).join(", ") || "its overall character"}</p>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.round(m.score * 100)}%` }} />
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-amber-300 tabular-nums">{m.priceUsdc} USDC</p>
                            <p className="text-[11px] text-white/40 tabular-nums">{Math.round(m.score * 100)}% match</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <button
                      onClick={() => { if (deepSuggestion) onSelect(deepSuggestion); }}
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-sm font-semibold text-white shadow transition-all hover:from-amber-400 hover:to-orange-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                    >
                      Apply to Mint Form
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          setIsVariating(true);
                          setTimeout(() => {
                            analyzeDeepMood(deepSuggestion.mood, variation + 1);
                            setIsVariating(false);
                          }, 150);
                        }}
                        disabled={isVariating}
                        aria-label="Generate another variation of this scent profile"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/85 transition hover:bg-white/[0.09] disabled:opacity-60"
                      >
                        {isVariating ? spinner : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 15A7 7 0 0018 17m.5-8A7 7 0 006 7" /></svg>
                        )}
                        Another take
                      </button>
                      <button
                        onClick={() => { setDeepSuggestion(null); setInput(""); }}
                        className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/85 transition hover:bg-white/[0.09]"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
