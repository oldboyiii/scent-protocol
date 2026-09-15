"use client";

import { useState } from "react";

interface Suggestion {
  gender: number;
  pType: number;
  reason: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  vibe: string;
  archetype: string;
  dnaColors: string[];
}

interface KnowledgeEntry {
  gender?: number;
  pType?: number;
  intensity?: number;
  tags: string[];
  notes: { top?: string[]; heart?: string[]; base?: string[] };
  archetype?: string;
}

// Colors for notes (mapping for Scent DNA)
const NOTE_COLORS: Record<string, string> = {
  "Bergamot": "#fbbf24", "Lemon": "#fbbf24", "Citrus": "#fbbf24", "Orange": "#fbbf24",
  "Rose": "#ec4899", "Jasmine": "#ec4899", "Floral": "#ec4899", "Peony": "#ec4899",
  "Oud": "#92400e", "Wood": "#92400e", "Cedar": "#92400e", "Sandalwood": "#92400e", "Woody": "#92400e",
  "Vanilla": "#f59e0b", "Amber": "#f59e0b", "Spicy": "#f59e0b", "Cinnamon": "#f59e0b",
  "Musk": "#6b7280", "Leather": "#6b7280", "Tobacco": "#6b7280",
  "Fresh": "#10b981", "Mint": "#10b981", "Aquatic": "#10b981", "Sea": "#10b981",
  "Lavender": "#a855f7", "Violet": "#a855f7", "Iris": "#a855f7",
  "Apple": "#84cc16", "Pear": "#84cc16", "Green": "#84cc16",
};

const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  summer: { pType: 2, intensity: 1, tags: ["fresh", "light", "citrus"], notes: { top: ["Bergamot", "Lemon"], heart: ["Jasmine"], base: ["White Musk"] }, archetype: "The Free Spirit" },
  winter: { pType: 0, intensity: 3, tags: ["warm", "woody", "spicy"], notes: { top: ["Cinnamon"], heart: ["Rose", "Oud"], base: ["Vanilla", "Amber"] }, archetype: "The Mystic" },
  spring: { pType: 2, intensity: 1, tags: ["floral", "fresh", "green"], notes: { top: ["Peony"], heart: ["Lily", "Violet"], base: ["Moss"] }, archetype: "The Dreamer" },
  autumn: { pType: 1, intensity: 2, tags: ["earthy", "warm", "mysterious"], notes: { top: ["Apple"], heart: ["Amber", "Patchouli"], base: ["Oakmoss"] }, archetype: "The Philosopher" },
  date: { pType: 1, intensity: 2, tags: ["seductive", "romantic", "sweet"], notes: { top: ["Pink Pepper"], heart: ["Rose", "Jasmine"], base: ["Musk", "Vanilla"] }, archetype: "The Romantic" },
  work: { pType: 2, intensity: 1, tags: ["clean", "professional", "subtle"], notes: { top: ["Lemon"], heart: ["Neroli"], base: ["Cedar", "White Musk"] }, archetype: "The CEO" },
  party: { pType: 1, intensity: 3, tags: ["bold", "sparkling", "energetic"], notes: { top: ["Citrus"], heart: ["Tuberose", "Orchid"], base: ["Amber"] }, archetype: "The Life of the Party" },
  sport: { pType: 3, intensity: 1, tags: ["energetic", "fresh", "aquatic"], notes: { top: ["Mint", "Eucalyptus"], heart: ["Sea Notes"], base: ["Driftwood"] }, archetype: "The Athlete" },
  romantic: { pType: 1, intensity: 2, tags: ["rose", "jasmine", "soft", "tender"], notes: { top: ["Raspberry"], heart: ["Rose", "Peony"], base: ["Musk"] }, archetype: "The Romantic" },
  masculine: { gender: 1, pType: 1, intensity: 2, tags: ["woody", "leathery", "aromatic"], notes: { top: ["Bergamot", "Lavender"], heart: ["Geranium"], base: ["Oud", "Leather"] }, archetype: "The Gentleman" },
  feminine: { gender: 2, pType: 1, intensity: 2, tags: ["floral", "fruity", "sweet", "graceful"], notes: { top: ["Mandarin"], heart: ["Jasmine", "Freesia"], base: ["Vanilla", "Sandalwood"] }, archetype: "The Muse" },
  elegant: { pType: 0, intensity: 2, tags: ["sophisticated", "refined", "classic", "luxury"], notes: { top: ["Aldehydes"], heart: ["Iris", "Rose"], base: ["Sandalwood", "Amber"] }, archetype: "The Aristocrat" },
  beach: { pType: 3, intensity: 1, tags: ["salty", "sunny", "tropical", "relaxed"], notes: { top: ["Coconut", "Pineapple"], heart: ["Tiare Flower"], base: ["Sandalwood"] }, archetype: "The Free Spirit" },
  luxury: { pType: 0, intensity: 3, tags: ["rich", "exclusive", "rare", "opulent"], notes: { top: ["Saffron", "Truffle"], heart: ["Oud", "Rose"], base: ["Ambergris", "Leather"] }, archetype: "The Connoisseur" },
  cozy: { pType: 1, intensity: 2, tags: ["warm", "comforting", "homey", "soft"], notes: { top: ["Apple", "Cinnamon"], heart: ["Vanilla Orchid"], base: ["Tonka"] }, archetype: "The Homebody" },
  rebel: { gender: 1, pType: 1, intensity: 3, tags: ["bold", "edgy", "unconventional", "dark"], notes: { top: ["Black Pepper"], heart: ["Leather", "Tobacco"], base: ["Oud", "Vetiver"] }, archetype: "The Rebel" },
  artist: { pType: 0, intensity: 2, tags: ["creative", "unusual", "inspiring", "unique"], notes: { top: ["Absinthe"], heart: ["Violet", "Iris"], base: ["Incense", "Amber"] }, archetype: "The Artist" },
};

const CREATIVE_DESCRIPTIONS: Record<number, Record<number, string>> = {
  0: { 0: "A unisex elixir of pure sophistication.", 1: "Unisex elegance captured in liquid form.", 2: "A versatile masterpiece transcending boundaries.", 3: "Bold and boundary-breaking." },
  1: { 0: "Masculine power distilled — commanding yet refined.", 1: "The modern gentleman's signature.", 2: "A symphony of strength and subtlety.", 3: "Unapologetically masculine." },
  2: { 0: "Feminine grace in every note.", 1: "The essence of elegance and worth.", 2: "A bouquet of confidence and charm.", 3: "Radiant femininity." }
};

const TYPE_NAMES = ["Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"];
const GENDER_NAMES = ["Unisex", "Male", "Female"];

// SVG icons for scenarios
const SCENARIO_ICONS: Record<string, JSX.Element> = {
  beach: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  work: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  date: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  gala: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  rebel: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
  artist: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
};

interface AIAdvisorProps {
  onSelect: (gender: number, pType: number) => void;
}

export default function AIAdvisor({ onSelect }: AIAdvisorProps) {
  const [input, setInput] = useState("");
  const [selectedGender, setSelectedGender] = useState<number>(0);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const getCreativeDescription = (gender: number, pType: number): string => {
    if (gender in CREATIVE_DESCRIPTIONS && pType in CREATIVE_DESCRIPTIONS[gender]) {
      return CREATIVE_DESCRIPTIONS[gender][pType];
    }
    return "";
  };

  // Generate DNA colors based on real notes
  const generateDNAColors = (notes: { top?: string[]; heart?: string[]; base?: string[] }): string[] => {
    const allNotes = [...(notes.top || []), ...(notes.heart || []), ...(notes.base || [])];
    const colors: string[] = [];
    
    allNotes.forEach(note => {
      const color = NOTE_COLORS[note] || NOTE_COLORS[note.split(" ")[0]];
      if (color) colors.push(color);
    });

    // If notes are few, add defaults
    while (colors.length < 8) {
      colors.push("#6366f1");
    }
    
    return colors.slice(0, 8);
  };

  const analyze = (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      let gender: number | undefined;
      let pType: number | undefined;
      const matchedTags: string[] = [];
      const matchedNotes: { top?: string[]; heart?: string[]; base?: string[] } = {};
      let matchCount = 0;
      let archetype = "The Explorer";

      for (const [keyword, data] of Object.entries(KNOWLEDGE_BASE)) {
        if (lower.includes(keyword)) {
          matchCount++;
          if (data.gender !== undefined && gender === undefined) gender = data.gender;
          if (data.pType !== undefined) pType = pType !== undefined ? Math.min(pType, data.pType) : data.pType;
          matchedTags.push(...data.tags);
          if (data.notes.top) matchedNotes.top = [...(matchedNotes.top || []), ...data.notes.top];
          if (data.notes.heart) matchedNotes.heart = [...(matchedNotes.heart || []), ...data.notes.heart];
          if (data.notes.base) matchedNotes.base = [...(matchedNotes.base || []), ...data.notes.base];
          if (data.archetype) archetype = data.archetype;
        }
      }

      // If user selected gender manually, use it
      if (gender === undefined) gender = selectedGender;
      if (pType === undefined) pType = 2;

      const uniqueTags = [...new Set(matchedTags)].slice(0, 4);
      const topNotes = matchedNotes.top ? [...new Set(matchedNotes.top)].slice(0, 3) : ["Bergamot", "Citrus"];
      const heartNotes = matchedNotes.heart ? [...new Set(matchedNotes.heart)].slice(0, 3) : ["Floral"];
      const baseNotes = matchedNotes.base ? [...new Set(matchedNotes.base)].slice(0, 3) : ["Musk", "Woods"];
      const vibe = uniqueTags.length > 0 ? uniqueTags.join(", ") : "unique and mysterious";
      const dnaColors = generateDNAColors(matchedNotes);

      let reason = matchCount === 0 
        ? `Your vibe is intriguing! Sensing something ${vibe}.`
        : `A fascinating blend of ${uniqueTags.slice(0, 2).join(" & ")}.`;
      
      const creativeDesc = getCreativeDescription(gender, pType);
      if (creativeDesc) reason += ` ${creativeDesc}`;

      setSuggestion({ 
        gender, 
        pType, 
        reason, 
        topNotes, 
        heartNotes, 
        baseNotes, 
        vibe,
        archetype,
        dnaColors
      });
      setLoading(false);
    }, 600);
  };

  const quickScenarios = [
    { icon: "beach", text: "Beach sunset", tags: "summer beach" },
    { icon: "work", text: "CEO meeting", tags: "work elegant" },
    { icon: "date", text: "First date", tags: "date romantic" },
    { icon: "gala", text: "Gala night", tags: "luxury elegant" },
    { icon: "rebel", text: "Rebel vibe", tags: "rebel bold" },
    { icon: "artist", text: "Artist mood", tags: "artist creative" },
  ];

  return (
    <div className="glass-card p-6 max-w-2xl w-full border border-white/10">
      {/* Header */}
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

      {/* Gender Selection */}
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

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="e.g. 'romantic winter evening'..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          onClick={() => analyze()}
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

      {/* Quick Scenarios */}
      <div className="flex flex-wrap gap-2 mb-5">
        {quickScenarios.map((scenario) => (
          <button
            key={scenario.text}
            onClick={() => { setInput(scenario.tags); analyze(scenario.tags); }}
            className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white hover:border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            {SCENARIO_ICONS[scenario.icon]}
            {scenario.text}
          </button>
        ))}
      </div>

      {/* Result Card */}
      {suggestion && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/10 animate-fade-up">
          {/* Archetype Badge */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-amber-300 font-medium mb-1">Your Scent Archetype</p>
              <h4 className="text-lg font-bold text-white">
                {suggestion.archetype}
              </h4>
              <p className="text-sm text-white/50 mt-0.5">
                {GENDER_NAMES[suggestion.gender]} {TYPE_NAMES[suggestion.pType]}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
              {suggestion.pType === 0 ? "Intense" : suggestion.pType === 1 ? "Elegant" : suggestion.pType === 2 ? "Fresh" : "Light"}
            </div>
          </div>

          {/* Scent DNA Visualization */}
          <div className="mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Scent DNA</p>
            <div className="h-2.5 rounded-full overflow-hidden flex">
              {suggestion.dnaColors.map((color, i) => (
                <div 
                  key={i} 
                  className="h-full"
                  style={{ backgroundColor: color, width: `${100 / suggestion.dnaColors.length}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2">
              Unique formula generated on-chain
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-white/70 italic mb-4 leading-relaxed">
            &ldquo;{suggestion.reason}&rdquo;
          </p>

          {/* Notes */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 w-14 uppercase">Top</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.topNotes.map((note) => (
                  <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">{note}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 w-14 uppercase">Heart</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.heartNotes.map((note) => (
                  <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">{note}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 w-14 uppercase">Base</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.baseNotes.map((note) => (
                  <span key={note} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">{note}</span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onSelect(suggestion.gender, suggestion.pType)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-semibold shadow hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 group"
          >
            Apply to Form
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
