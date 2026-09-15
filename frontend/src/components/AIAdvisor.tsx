"use client";

import { useState, useEffect } from "react";

interface Suggestion {
  gender: number;
  pType: number;
  reason: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  vibe: string;
  archetype: string;
  archetypeIcon: string;
  dnaColors: string[];
  dailyCount: number;
}

interface KnowledgeEntry {
  gender?: number;
  pType?: number;
  intensity?: number;
  tags: string[];
  notes: { top?: string[]; heart?: string[]; base?: string[] };
  archetype?: string;
  archetypeIcon?: string;
}

const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  summer: { pType: 2, intensity: 1, tags: ["fresh", "light", "citrus"], notes: { top: ["Bergamot", "Lemon"], heart: ["Jasmine"], base: ["White Musk"] }, archetype: "The Free Spirit", archetypeIcon: "🌊" },
  winter: { pType: 0, intensity: 3, tags: ["warm", "woody", "spicy"], notes: { top: ["Cinnamon"], heart: ["Rose", "Oud"], base: ["Vanilla", "Amber"] }, archetype: "The Mystic", archetypeIcon: "🔮" },
  spring: { pType: 2, intensity: 1, tags: ["floral", "fresh", "green"], notes: { top: ["Peony"], heart: ["Lily", "Violet"], base: ["Moss"] }, archetype: "The Dreamer", archetypeIcon: "🌸" },
  autumn: { pType: 1, intensity: 2, tags: ["earthy", "warm", "mysterious"], notes: { top: ["Apple"], heart: ["Amber", "Patchouli"], base: ["Oakmoss"] }, archetype: "The Philosopher", archetypeIcon: "🍂" },
  date: { pType: 1, intensity: 2, tags: ["seductive", "romantic", "sweet"], notes: { top: ["Pink Pepper"], heart: ["Rose", "Jasmine"], base: ["Musk", "Vanilla"] }, archetype: "The Romantic", archetypeIcon: "💋" },
  work: { pType: 2, intensity: 1, tags: ["clean", "professional", "subtle"], notes: { top: ["Lemon"], heart: ["Neroli"], base: ["Cedar", "White Musk"] }, archetype: "The CEO", archetypeIcon: "💼" },
  party: { pType: 1, intensity: 3, tags: ["bold", "sparkling", "energetic"], notes: { top: ["Citrus"], heart: ["Tuberose", "Orchid"], base: ["Amber"] }, archetype: "The Life of the Party", archetypeIcon: "" },
  sport: { pType: 3, intensity: 1, tags: ["energetic", "fresh", "aquatic"], notes: { top: ["Mint", "Eucalyptus"], heart: ["Sea Notes"], base: ["Driftwood"] }, archetype: "The Athlete", archetypeIcon: "⚡" },
  romantic: { pType: 1, intensity: 2, tags: ["rose", "jasmine", "soft", "tender"], notes: { top: ["Raspberry"], heart: ["Rose", "Peony"], base: ["Musk"] }, archetype: "The Romantic", archetypeIcon: "💋" },
  masculine: { gender: 1, pType: 1, intensity: 2, tags: ["woody", "leathery", "aromatic"], notes: { top: ["Bergamot", "Lavender"], heart: ["Geranium"], base: ["Oud", "Leather"] }, archetype: "The Gentleman", archetypeIcon: "🎩" },
  feminine: { gender: 2, pType: 1, intensity: 2, tags: ["floral", "fruity", "sweet", "graceful"], notes: { top: ["Mandarin"], heart: ["Jasmine", "Freesia"], base: ["Vanilla", "Sandalwood"] }, archetype: "The Muse", archetypeIcon: "✨" },
  elegant: { pType: 0, intensity: 2, tags: ["sophisticated", "refined", "classic", "luxury"], notes: { top: ["Aldehydes"], heart: ["Iris", "Rose"], base: ["Sandalwood", "Amber"] }, archetype: "The Aristocrat", archetypeIcon: "" },
  beach: { pType: 3, intensity: 1, tags: ["salty", "sunny", "tropical", "relaxed"], notes: { top: ["Coconut", "Pineapple"], heart: ["Tiare Flower"], base: ["Sandalwood"] }, archetype: "The Free Spirit", archetypeIcon: "🌊" },
  luxury: { pType: 0, intensity: 3, tags: ["rich", "exclusive", "rare", "opulent"], notes: { top: ["Saffron", "Truffle"], heart: ["Oud", "Rose"], base: ["Ambergris", "Leather"] }, archetype: "The Connoisseur", archetypeIcon: "💎" },
  cozy: { pType: 1, intensity: 2, tags: ["warm", "comforting", "homey", "soft"], notes: { top: ["Apple", "Cinnamon"], heart: ["Vanilla Orchid"], base: ["Tonka"] }, archetype: "The Homebody", archetypeIcon: "" },
  rebel: { gender: 1, pType: 1, intensity: 3, tags: ["bold", "edgy", "unconventional", "dark"], notes: { top: ["Black Pepper"], heart: ["Leather", "Tobacco"], base: ["Oud", "Vetiver"] }, archetype: "The Rebel", archetypeIcon: "🔥" },
  artist: { pType: 0, intensity: 2, tags: ["creative", "unusual", "inspiring", "unique"], notes: { top: ["Absinthe"], heart: ["Violet", "Iris"], base: ["Incense", "Amber"] }, archetype: "The Artist", archetypeIcon: "🎨" },
  mysterious: { pType: 0, intensity: 3, tags: ["dark", "enigmatic", "intense", "secretive"], notes: { top: ["Saffron"], heart: ["Oud", "Myrrh"], base: ["Leather", "Musk"] }, archetype: "The Enigma", archetypeIcon: "" },
};

const CREATIVE_DESCRIPTIONS: Record<number, Record<number, string>> = {
  0: { 0: "A unisex elixir of pure sophistication.", 1: "Unisex elegance captured in liquid form.", 2: "A versatile masterpiece transcending boundaries.", 3: "Bold and boundary-breaking." },
  1: { 0: "Masculine power distilled — commanding yet refined.", 1: "The modern gentleman's signature.", 2: "A symphony of strength and subtlety.", 3: "Unapologetically masculine." },
  2: { 0: "Feminine grace in every note.", 1: "The essence of elegance and worth.", 2: "A bouquet of confidence and charm.", 3: "Radiant femininity." }
};

const TYPE_NAMES = ["Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"];
const GENDER_NAMES = ["Unisex", "Male", "Female"];

// Цвета для Scent DNA
const DNA_COLORS = ["#fbbf24", "#f97316", "#ec4899", "#a855f7", "#6366f1", "#3b82f6", "#10b981", "#84cc16"];

interface AIAdvisorProps {
  onSelect: (gender: number, pType: number) => void;
}

export default function AIAdvisor({ onSelect }: AIAdvisorProps) {
  const [input, setInput] = useState("");
  const [selectedGender, setSelectedGender] = useState<number>(0);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  // Генерируем "социальное доказательство" при загрузке
  useEffect(() => {
    const count = Math.floor(Math.random() * 50) + 12;
    setDailyCount(count);
  }, []);

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
      let archetype = "The Explorer";
      let archetypeIcon = "🧭";

      for (const [keyword, data] of Object.entries(KNOWLEDGE_BASE)) {
        if (lower.includes(keyword)) {
          matchCount++;
          if (data.gender !== undefined && gender === undefined) gender = data.gender;
          if (data.pType !== undefined) pType = pType !== undefined ? Math.min(pType, data.pType) : data.pType;
          matchedTags.push(...data.tags);
          if (data.notes.top) matchedNotes.top = [...(matchedNotes.top || []), ...data.notes.top];
          if (data.notes.heart) matchedNotes.heart = [...(matchedNotes.heart || []), ...data.notes.heart];
          if (data.notes.base) matchedNotes.base = [...(matchedNotes.base || []), ...data.notes.base];
          if (data.archetype) {
            archetype = data.archetype;
            archetypeIcon = data.archetypeIcon || "✨";
          }
        }
      }

      // Если пользователь выбрал пол вручную, используем его
      if (gender === undefined) gender = selectedGender;
      if (pType === undefined) pType = 2;

      const uniqueTags = [...new Set(matchedTags)].slice(0, 4);
      const topNotes = matchedNotes.top ? [...new Set(matchedNotes.top)].slice(0, 3) : ["Bergamot", "Citrus"];
      const heartNotes = matchedNotes.heart ? [...new Set(matchedNotes.heart)].slice(0, 3) : ["Floral"];
      const baseNotes = matchedNotes.base ? [...new Set(matchedNotes.base)].slice(0, 3) : ["Musk", "Woods"];
      const vibe = uniqueTags.length > 0 ? uniqueTags.join(", ") : "unique and mysterious";

      // Генерируем цвета для Scent DNA
      const dnaColors = Array.from({ length: 8 }, () => 
        DNA_COLORS[Math.floor(Math.random() * DNA_COLORS.length)]
      );

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
        archetypeIcon,
        dnaColors,
        dailyCount: Math.floor(Math.random() * 50) + 12
      });
      setLoading(false);
    }, 600);
  };

  const quickScenarios = [
    { emoji: "🏖️", text: "Beach sunset", tags: "summer beach" },
    { emoji: "💼", text: "CEO meeting", tags: "work elegant" },
    { emoji: "💃", text: "First date", tags: "date romantic" },
    { emoji: "✨", text: "Gala night", tags: "luxury elegant" },
    { emoji: "", text: "Rebel vibe", tags: "rebel bold" },
    { emoji: "🎨", text: "Artist mood", tags: "artist creative" },
  ];

  return (
    <div className="glass-card p-8 max-w-2xl w-full border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
          🤖
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Scent AI Advisor</h3>
          <p className="text-xs text-white/40 uppercase tracking-wider">Fragrance Intelligence</p>
        </div>
      </div>

      {/* Gender Selection */}
      <div className="mb-6">
        <p className="text-sm text-white/60 mb-3">Select your preference:</p>
        <div className="grid grid-cols-3 gap-3">
          {GENDER_NAMES.map((g, i) => (
            <button
              key={g}
              onClick={() => setSelectedGender(i)}
              className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                selectedGender === i
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="e.g. 'romantic winter evening'..."
          className="flex-1 px-5 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          onClick={() => analyze()}
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-semibold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          ) : "Analyze"}
        </button>
      </div>

      {/* Quick Scenarios */}
      <div className="flex flex-wrap gap-2 mb-6">
        {quickScenarios.map((scenario) => (
          <button
            key={scenario.text}
            onClick={() => { setInput(scenario.tags); analyze(scenario.tags); }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white hover:border-amber-500/30 transition-all"
          >
            {scenario.emoji} {scenario.text}
          </button>
        ))}
      </div>

      {/* Result Card */}
      {suggestion && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 animate-fade-up">
          {/* Archetype Badge */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-amber-300 font-medium mb-1">✨ Your Scent Archetype</p>
              <h4 className="text-2xl font-bold text-white">
                {suggestion.archetypeIcon} {suggestion.archetype}
              </h4>
              <p className="text-sm text-white/50 mt-1">
                {GENDER_NAMES[suggestion.gender]} {TYPE_NAMES[suggestion.pType]}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
              {suggestion.pType === 0 ? "Intense" : suggestion.pType === 1 ? "Elegant" : suggestion.pType === 2 ? "Fresh" : "Light"}
            </div>
          </div>

          {/* Scent DNA Visualization */}
          <div className="mb-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Your Scent DNA</p>
            <div className="h-3 rounded-full overflow-hidden flex">
              {suggestion.dnaColors.map((color, i) => (
                <div 
                  key={i} 
                  className="flex-1 h-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2">
              🧬 {suggestion.dailyCount} people minted this vibe today
            </p>
          </div>

          {/* Description */}
          <p className="text-base text-white/70 italic mb-5 leading-relaxed">
            &ldquo;{suggestion.reason}&rdquo;
          </p>

          {/* Notes */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-16 uppercase">Top Notes</span>
              <div className="flex flex-wrap gap-2">
                {suggestion.topNotes.map((note) => (
                  <span key={note} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-sm text-white/80">{note}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-16 uppercase">Heart</span>
              <div className="flex flex-wrap gap-2">
                {suggestion.heartNotes.map((note) => (
                  <span key={note} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-sm text-white/80">{note}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-16 uppercase">Base</span>
              <div className="flex flex-wrap gap-2">
                {suggestion.baseNotes.map((note) => (
                  <span key={note} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-sm text-white/80">{note}</span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onSelect(suggestion.gender, suggestion.pType)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 group"
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
