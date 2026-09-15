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
}

interface KnowledgeEntry {
  gender?: number;
  pType?: number;
  intensity?: number;
  tags: string[];
  notes: { top?: string[]; heart?: string[]; base?: string[] };
}

const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  summer: { pType: 2, intensity: 1, tags: ["fresh", "light", "citrus"], notes: { top: ["Bergamot", "Lemon"], heart: ["Jasmine"], base: ["White Musk"] } },
  winter: { pType: 0, intensity: 3, tags: ["warm", "woody", "spicy"], notes: { top: ["Cinnamon"], heart: ["Rose", "Oud"], base: ["Vanilla", "Amber"] } },
  spring: { pType: 2, intensity: 1, tags: ["floral", "fresh", "green"], notes: { top: ["Peony"], heart: ["Lily", "Violet"], base: ["Moss"] } },
  autumn: { pType: 1, intensity: 2, tags: ["earthy", "warm", "mysterious"], notes: { top: ["Apple"], heart: ["Amber", "Patchouli"], base: ["Oakmoss"] } },
  date: { pType: 1, intensity: 2, tags: ["seductive", "romantic", "sweet"], notes: { top: ["Pink Pepper"], heart: ["Rose", "Jasmine"], base: ["Musk", "Vanilla"] } },
  work: { pType: 2, intensity: 1, tags: ["clean", "professional", "subtle"], notes: { top: ["Lemon"], heart: ["Neroli"], base: ["Cedar", "White Musk"] } },
  party: { pType: 1, intensity: 3, tags: ["bold", "sparkling", "energetic"], notes: { top: ["Citrus"], heart: ["Tuberose", "Orchid"], base: ["Amber"] } },
  sport: { pType: 3, intensity: 1, tags: ["energetic", "fresh", "aquatic"], notes: { top: ["Mint", "Eucalyptus"], heart: ["Sea Notes"], base: ["Driftwood"] } },
  romantic: { pType: 1, intensity: 2, tags: ["rose", "jasmine", "soft", "tender"], notes: { top: ["Raspberry"], heart: ["Rose", "Peony"], base: ["Musk"] } },
  masculine: { gender: 1, pType: 1, intensity: 2, tags: ["woody", "leathery", "aromatic"], notes: { top: ["Bergamot", "Lavender"], heart: ["Geranium"], base: ["Oud", "Leather"] } },
  feminine: { gender: 2, pType: 1, intensity: 2, tags: ["floral", "fruity", "sweet", "graceful"], notes: { top: ["Mandarin"], heart: ["Jasmine", "Freesia"], base: ["Vanilla", "Sandalwood"] } },
  elegant: { pType: 0, intensity: 2, tags: ["sophisticated", "refined", "classic", "luxury"], notes: { top: ["Aldehydes"], heart: ["Iris", "Rose"], base: ["Sandalwood", "Amber"] } },
  beach: { pType: 3, intensity: 1, tags: ["salty", "sunny", "tropical", "relaxed"], notes: { top: ["Coconut", "Pineapple"], heart: ["Tiare Flower"], base: ["Sandalwood"] } },
  luxury: { pType: 0, intensity: 3, tags: ["rich", "exclusive", "rare", "opulent"], notes: { top: ["Saffron", "Truffle"], heart: ["Oud", "Rose"], base: ["Ambergris", "Leather"] } },
  cozy: { pType: 1, intensity: 2, tags: ["warm", "comforting", "homey", "soft"], notes: { top: ["Apple", "Cinnamon"], heart: ["Vanilla Orchid"], base: ["Tonka"] } },
};

const CREATIVE_DESCRIPTIONS: Record<number, Record<number, string>> = {
  0: { 0: "A unisex elixir of pure sophistication.", 1: "Unisex elegance captured in liquid form.", 2: "A versatile masterpiece transcending boundaries.", 3: "Bold and boundary-breaking." },
  1: { 0: "Masculine power distilled — commanding yet refined.", 1: "The modern gentleman's signature.", 2: "A symphony of strength and subtlety.", 3: "Unapologetically masculine." },
  2: { 0: "Feminine grace in every note.", 1: "The essence of elegance and worth.", 2: "A bouquet of confidence and charm.", 3: "Radiant femininity." }
};

const TYPE_NAMES = ["Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"];
const GENDER_NAMES = ["Unisex", "Male", "Female"];

interface AIAdvisorProps {
  onSelect: (gender: number, pType: number) => void;
}

export default function AIAdvisor({ onSelect }: AIAdvisorProps) {
  const [input, setInput] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const getCreativeDescription = (gender: number, pType: number): string => {
    if (gender in CREATIVE_DESCRIPTIONS && pType in CREATIVE_DESCRIPTIONS[gender]) {
      return CREATIVE_DESCRIPTIONS[gender][pType];
    }
    return "";
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

      for (const [keyword, data] of Object.entries(KNOWLEDGE_BASE)) {
        if (lower.includes(keyword)) {
          matchCount++;
          if (data.gender !== undefined && gender === undefined) gender = data.gender;
          if (data.pType !== undefined) pType = pType !== undefined ? Math.min(pType, data.pType) : data.pType;
          matchedTags.push(...data.tags);
          if (data.notes.top) matchedNotes.top = [...(matchedNotes.top || []), ...data.notes.top];
          if (data.notes.heart) matchedNotes.heart = [...(matchedNotes.heart || []), ...data.notes.heart];
          if (data.notes.base) matchedNotes.base = [...(matchedNotes.base || []), ...data.notes.base];
        }
      }

      if (gender === undefined) gender = 0;
      if (pType === undefined) pType = 2;

      const uniqueTags = [...new Set(matchedTags)].slice(0, 4);
      const topNotes = matchedNotes.top ? [...new Set(matchedNotes.top)].slice(0, 2) : ["Bergamot", "Citrus"];
      const heartNotes = matchedNotes.heart ? [...new Set(matchedNotes.heart)].slice(0, 2) : ["Floral"];
      const baseNotes = matchedNotes.base ? [...new Set(matchedNotes.base)].slice(0, 2) : ["Musk", "Woods"];
      const vibe = uniqueTags.length > 0 ? uniqueTags.join(", ") : "unique and mysterious";

      let reason = matchCount === 0 
        ? `Your vibe is intriguing! Sensing something ${vibe}.`
        : `A fascinating blend of ${uniqueTags.slice(0, 2).join(" & ")}.`;
      
      const creativeDesc = getCreativeDescription(gender, pType);
      if (creativeDesc) reason += ` ${creativeDesc}`;

      setSuggestion({ gender, pType, reason, topNotes, heartNotes, baseNotes, vibe });
      setLoading(false);
    }, 600);
  };

  const quickScenarios = [
    { emoji: "🏖️", text: "Beach sunset", tags: "summer beach" },
    { emoji: "💼", text: "CEO meeting", tags: "work elegant" },
    { emoji: "💃", text: "First date", tags: "date romantic" },
    { emoji: "✨", text: "Gala night", tags: "luxury elegant" },
  ];

  return (
    <div className="glass-card p-6 max-w-xl w-full border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-sm shadow-lg">
          🤖
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Scent AI Advisor</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Fragrance Intelligence</p>
        </div>
      </div>

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

      <div className="flex flex-wrap gap-2 mb-5">
        {quickScenarios.map((scenario) => (
          <button
            key={scenario.text}
            onClick={() => { setInput(scenario.tags); analyze(scenario.tags); }}
            className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white hover:border-amber-500/30 transition-all"
          >
            {scenario.emoji} {scenario.text}
          </button>
        ))}
      </div>

      {suggestion && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/10 animate-fade-up">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white">
                {GENDER_NAMES[suggestion.gender]} {TYPE_NAMES[suggestion.pType]}
              </h4>
              <p className="text-[10px] text-white/40 capitalize mt-0.5">{suggestion.vibe}</p>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase">
              {suggestion.pType === 0 ? "Intense" : suggestion.pType === 1 ? "Elegant" : suggestion.pType === 2 ? "Fresh" : "Light"}
            </div>
          </div>
          
          <p className="text-xs text-white/60 italic mb-4 leading-relaxed">
            &ldquo;{suggestion.reason}&rdquo;
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-12 uppercase">Top</span>
              <div className="flex flex-wrap gap-1">
                {suggestion.topNotes.map((note) => (
                  <span key={note} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/70">{note}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-12 uppercase">Heart</span>
              <div className="flex flex-wrap gap-1">
                {suggestion.heartNotes.map((note) => (
                  <span key={note} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/70">{note}</span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelect(suggestion.gender, suggestion.pType)}
            className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 group"
          >
            Apply to Form
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
