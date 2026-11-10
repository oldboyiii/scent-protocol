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
  ];

  return (
    <div className="glass-card p-6 max-w-2xl w-full border border-white/10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 7.071l.707.707M12 9a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Scent AI Advisor</h3>
          <p className="text-xs text-white/40 uppercase tracking-wider">Fragrance Intelligence</p>
        </div>
      </div>

      <div className="flex p-1 bg-white/5 rounded-lg mb-5 border border-white/10">
        <button
          onClick={() => { setMode('quick'); setDeepSuggestion(null); setError(null); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'quick' ? "bg-white/10 text-white shadow" : "text-white/50 hover:text-white/80"
          }`}
        >
          Quick Pick
        </button>
        <button
          onClick={() => { setMode('deep'); setDeepSuggestion(null); setError(null); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'deep' ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow" : "text-white/50 hover:text-white/80"
          }`}
        >
          Deep Mood Analysis
        </button>
      </div>

      {mode === 'quick' && (
        <div className="animate-fade-up">
          <div className="mb-5">
            <p className="text-sm text-white/60 mb-2">Select preference:</p>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_NAMES.map((g, i) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(i)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGender === i
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow"
                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/60 mb-3">Or choose a scenario:</p>
          <div className="flex flex-wrap gap-2">
            {quickScenarios.map((scenario) => (
              <button
                key={scenario.text}
                onClick={() => handleQuickPick(scenario.tags)}
                disabled={loading}
                className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white hover:border-amber-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {SCENARIO_ICONS[scenario.icon]}
                {scenario.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'deep' && (
        <div className="animate-fade-up">
          {!deepSuggestion ? (
            <>
              <p className="text-sm text-white/60 mb-3">Describe your current mood, location, or occasion:</p>
              
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
                className="w-full mb-3 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-white text-sm font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {loading ? "Detecting your vibe..." : "Get my current vibe"}
              </button>

              {error && (
                <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                  {error}
                  <button onClick={() => setError(null)} className="block mx-auto mt-1 underline hover:text-red-300">Dismiss</button>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-white/40 mb-2">Recent searches:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => { setInput(term); analyzeDeepMood(term); }}
                        className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:border-amber-500/30 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyzeDeepMood()}
                  placeholder="e.g. 'romantic winter evening in Paris'..."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  onClick={() => analyzeDeepMood()}
                  disabled={loading || !input.trim()}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : "Analyze"}
                </button>
              </div>

              {noMatch && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200" role="status">
                  <p className="mb-2">I could not read a mood from that. Try a few words about the place, the weather or the feeling:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["romantic evening", "rainy forest", "office meeting", "beach holiday", "cozy winter", "night club"].map((ex) => (
                      <button key={ex} onClick={() => { setInput(ex); analyzeDeepMood(ex); }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-amber-500/30 transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-white/40 mb-4">
                Tip: Mention weather, time of day, or specific emotions for better results.
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/10 animate-fade-up">
              
              {/* ✅ ADDED: Full location, weather, and time context display */}
              {deepSuggestion.vibe && deepSuggestion.vibe !== "unique and mysterious" && (
                <div className="mb-5 p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Context</p>
                    <p className="text-sm text-white/80">{deepSuggestion.vibe}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-amber-300 font-medium mb-1">Your Scent Archetype</p>
                  <h4 className="text-lg font-bold text-white">
                    {deepSuggestion.archetype}
                  </h4>
                  <p className="text-sm text-white/50 mt-0.5">
                    {GENDER_NAMES[deepSuggestion.gender]} {TYPE_NAMES[deepSuggestion.pType]}
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
                  {deepSuggestion.pType === 0 ? "Intense" : deepSuggestion.pType === 1 ? "Elegant" : deepSuggestion.pType === 2 ? "Fresh" : "Light"}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Preview of this mood:</p>
                <ScentPlayer
                  variant="full"
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

              <div className="mb-5" aria-live="polite">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Already on the marketplace for this mood</p>
                {matchesLoading && <p className="text-xs text-white/40 animate-pulse">Scanning marketplace listings...</p>}
                {!matchesLoading && matchesError && (
                  <p className="text-xs text-amber-300/80">Marketplace data temporarily unavailable, but you can still mint a new fragrance based on this profile below.</p>
                )}
                {!matchesLoading && !matchesError && matches.length === 0 && (
                  <p className="text-xs text-white/40">No listed fragrance fits this mood right now. Mint a new one below.</p>
                )}
                <div className="space-y-2">
                  {matches.map((m) => (
                    <Link key={`${m.collection}-${m.tokenId}`} href={m.href} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all group">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors">{m.name}</p>
                        <p className="text-xs text-white/50 truncate">Fits with {m.matchedNotes.slice(0, 3).join(", ") || "its overall character"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-300">{m.priceUsdc} USDC</p>
                        <p className="text-[11px] text-white/40">{Math.round(m.score * 100)}% match</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Suggested Scent DNA</p>
                <div className="h-2.5 rounded-full overflow-hidden flex">
                  {deepSuggestion.dnaColors?.map((color, i) => (
                    <div 
                      key={i} 
                      className="h-full transition-all duration-500"
                      style={{ backgroundColor: color, width: `${100 / (deepSuggestion.dnaColors?.length || 8)}%` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-2">
                  *Actual minted notes will be generated on-chain based on this vibe.
                </p>
              </div>

              <p className="text-sm text-white/70 italic mb-4 leading-relaxed">
                &ldquo;{deepSuggestion.reason}&rdquo;
              </p>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Top</span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepSuggestion.topNotes?.map((note) => (
                      <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">{note}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Heart</span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepSuggestion.heartNotes?.map((note) => (
                      <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">{note}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-14 uppercase">Base</span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepSuggestion.baseNotes?.map((note) => (
                      <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">{note}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
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
                  className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/10 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isVariating ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : "Another take"}
                </button>
                <button
                  onClick={() => { setDeepSuggestion(null); setInput(""); }}
                  className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/10 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    if (deepSuggestion) {
                      onSelect(deepSuggestion);
                    }
                  }}
                  className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-semibold shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 group"
                >
                  Apply to Mint Form
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
