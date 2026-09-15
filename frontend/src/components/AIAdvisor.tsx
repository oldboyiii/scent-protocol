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

// Расширенная база знаний с весами и категориями
const KNOWLEDGE_BASE: Record<string, { 
  gender?: number; 
  pType?: number; 
  intensity?: number;
  tags: string[];
  notes: { top?: string[]; heart?: string[]; base?: string[] };
  scenarios: string[];
}> = {
  // СЕЗОНЫ И ВРЕМЯ
  "summer": { 
    pType: 2, 
    intensity: 1,
    tags: ["fresh", "light", "citrus", "aquatic", "airy"],
    notes: { top: ["Bergamot", "Lemon", "Mint"], heart: ["Jasmine", "Neroli"], base: ["White Musk", "Cedar"] },
    scenarios: ["beach vacation", "hot day", "poolside", "tropical getaway"]
  },
  "winter": { 
    pType: 0, 
    intensity: 3,
    tags: ["warm", "woody", "spicy", "rich", "cozy"],
    notes: { top: ["Cinnamon", "Cardamom"], heart: ["Rose", "Oud"], base: ["Vanilla", "Amber", "Sandalwood"] },
    scenarios: ["snowy evening", "fireside", "holiday party", "ski resort"]
  },
  "spring": {
    pType: 2,
    intensity: 1,
    tags: ["floral", "fresh", "green", "blooming", "delicate"],
    notes: { top: ["Peony", "Freesia"], heart: ["Lily", "Violet"], base: ["Moss", "Musk"] },
    scenarios: ["garden party", "first date", "morning walk", "picnic"]
  },
  "autumn": {
    pType: 1,
    intensity: 2,
    tags: ["earthy", "warm", "mysterious", "amber", "spiced"],
    notes: { top: ["Apple", "Pear"], heart: ["Amber", "Patchouli"], base: ["Oakmoss", "Tonka"] },
    scenarios: ["coffee shop", "art gallery", "rainy day", "harvest festival"]
  },
  
  // ВРЕМЯ СУТОК
  "morning": { 
    pType: 2, 
    intensity: 1,
    tags: ["fresh", "energizing", "clean", "bright"],
    notes: { top: ["Grapefruit", "Orange"], heart: ["Tea", "Ginger"], base: ["Light Woods"] },
    scenarios: ["breakfast", "morning run", "yoga session"]
  },
  "day": { 
    pType: 2, 
    intensity: 1,
    tags: ["versatile", "balanced", "professional"],
    notes: { top: ["Bergamot"], heart: ["Lavender"], base: ["Vetiver"] },
    scenarios: ["lunch meeting", "shopping", "casual outing"]
  },
  "evening": { 
    pType: 1, 
    intensity: 2,
    tags: ["sophisticated", "elegant", "refined"],
    notes: { top: ["Black Pepper"], heart: ["Violet", "Iris"], base: ["Sandalwood", "Amber"] },
    scenarios: ["dinner", "theater", "cocktail bar"]
  },
  "night": { 
    pType: 0, 
    intensity: 3,
    tags: ["intense", "mysterious", "seductive", "bold"],
    notes: { top: ["Saffron"], heart: ["Oud", "Leather"], base: ["Tobacco", "Vanilla"] },
    scenarios: ["club", "late night", "romantic encounter"]
  },
  
  // СОБЫТИЯ И ОККАЗИИ
  "date": { 
    gender: undefined,
    pType: 1, 
    intensity: 2,
    tags: ["seductive", "romantic", "floral", "sweet", "alluring"],
    notes: { top: ["Pink Pepper"], heart: ["Rose", "Jasmine"], base: ["Musk", "Vanilla"] },
    scenarios: ["first date", "anniversary", "romantic dinner"]
  },
  "work": { 
    pType: 2, 
    intensity: 1,
    tags: ["clean", "professional", "subtle", "confident", "minimal"],
    notes: { top: ["Lemon"], heart: ["Neroli", "Petitgrain"], base: ["Cedar", "White Musk"] },
    scenarios: ["presentation", "interview", "business meeting", "office"]
  },
  "party": { 
    pType: 1, 
    intensity: 3,
    tags: ["bold", "sparkling", "sweet", "energetic", "fun"],
    notes: { top: ["Champagne", "Citrus"], heart: ["Tuberose", "Orchid"], base: ["Amber", "Tonka"] },
    scenarios: ["birthday", "celebration", "nightclub", "festival"]
  },
  "sport": { 
    pType: 3, 
    intensity: 1,
    tags: ["energetic", "fresh", "minty", "aquatic", "dynamic"],
    notes: { top: ["Mint", "Eucalyptus"], heart: ["Sea Notes"], base: ["Driftwood"] },
    scenarios: ["gym", "running", "swimming", "tennis"]
  },
  "wedding": {
    gender: 2,
    pType: 0,
    intensity: 2,
    tags: ["elegant", "timeless", "floral", "luxurious", "bridal"],
    notes: { top: ["Pear", "Bergamot"], heart: ["Tuberose", "Orange Blossom"], base: ["Vanilla", "Sandalwood"] },
    scenarios: ["bride", "wedding ceremony", "reception"]
  },
  
  // НАСТРОЕНИЯ И АТМОСФЕРА
  "romantic": { 
    gender: undefined, 
    pType: 1, 
    intensity: 2,
    tags: ["rose", "jasmine", "soft", "tender", "dreamy"],
    notes: { top: ["Raspberry"], heart: ["Rose", "Peony"], base: ["Musk", "Patchouli"] },
    scenarios: ["candlelight", "love letter", "slow dance"]
  },
  "masculine": { 
    gender: 1, 
    pType: 1, 
    intensity: 2,
    tags: ["woody", "leathery", "aromatic", "strong", "rugged"],
    notes: { top: ["Bergamot", "Lavender"], heart: ["Geranium", "Sage"], base: ["Oud", "Leather"] },
    scenarios: ["boardroom", "luxury car", "gentleman's club"]
  },
  "feminine": { 
    gender: 2, 
    pType: 1, 
    intensity: 2,
    tags: ["floral", "fruity", "sweet", "delicate", "graceful"],
    notes: { top: ["Mandarin", "Black Currant"], heart: ["Jasmine", "Freesia"], base: ["Vanilla", "Sandalwood"] },
    scenarios: ["spa day", "brunch", "shopping"]
  },
  "elegant": { 
    pType: 0, 
    intensity: 2,
    tags: ["sophisticated", "refined", "classic", "timeless", "luxury"],
    notes: { top: ["Aldehydes"], heart: ["Iris", "Rose"], base: ["Sandalwood", "Amber"] },
    scenarios: ["opera", "gala", "five star hotel"]
  },
  "casual": { 
    pType: 2, 
    intensity: 1,
    tags: ["easy-going", "versatile", "comfortable", "relaxed"],
    notes: { top: ["Bergamot"], heart: ["Lavender", "Geranium"], base: ["Cedar", "Musk"] },
    scenarios: ["weekend", "errands", "coffee with friends"]
  },
  
  // АРОМАТИЧЕСКИЕ СЕМЕЙСТВА
  "woody": {
    pType: 1,
    intensity: 2,
    tags: ["earthy", "natural", "grounding", "forest"],
    notes: { top: ["Bergamot"], heart: ["Vetiver", "Patchouli"], base: ["Cedar", "Sandalwood", "Oud"] },
    scenarios: ["hiking", "cabin retreat", "autumn walk"]
  },
  "floral": {
    gender: 2,
    pType: 1,
    intensity: 2,
    tags: ["romantic", "feminine", "garden", "blooming"],
    notes: { top: ["Freesia"], heart: ["Rose", "Peony", "Lily"], base: ["Musk", "Amber"] },
    scenarios: ["flower shop", "spring garden", "tea party"]
  },
  "citrus": {
    pType: 2,
    intensity: 1,
    tags: ["fresh", "energizing", "zesty", "bright", "uplifting"],
    notes: { top: ["Lemon", "Orange", "Bergamot"], heart: ["Ginger", "Neroli"], base: ["Light Woods"] },
    scenarios: ["morning shower", "breakfast", "beach day"]
  },
  "oriental": {
    pType: 0,
    intensity: 3,
    tags: ["exotic", "spicy", "warm", "mysterious", "sensual"],
    notes: { top: ["Saffron", "Cardamom"], heart: ["Oud", "Incense"], base: ["Vanilla", "Amber", "Musk"] },
    scenarios: ["moroccan market", "incense shop", "desert night"]
  },
  "fresh": {
    pType: 2,
    intensity: 1,
    tags: ["clean", "aquatic", "crisp", "pure", "airy"],
    notes: { top: ["Sea Salt", "Bergamot"], heart: ["Sage", "Lavender"], base: ["Driftwood", "Musk"] },
    scenarios: ["ocean breeze", "fresh laundry", "mountain air"]
  },
  
  // КОНКРЕТНЫЕ СЦЕНАРИИ
  "beach": { 
    pType: 3, 
    intensity: 1,
    tags: ["salty", "sunny", "tropical", "coconut", "relaxed"],
    notes: { top: ["Coconut", "Pineapple"], heart: ["Tiare Flower"], base: ["Sandalwood", "Vanilla"] },
    scenarios: ["tanning", "surfing", "beach bar"]
  },
  "luxury": { 
    pType: 0, 
    intensity: 3,
    tags: ["rich", "exclusive", "rare", "expensive", "opulent"],
    notes: { top: ["Saffron", "Truffle"], heart: ["Oud", "Rose"], base: ["Ambergris", "Leather"] },
    scenarios: ["private jet", "yacht", "michelin restaurant"]
  },
  "cozy": {
    pType: 1,
    intensity: 2,
    tags: ["warm", "comforting", "homey", "sweet", "soft"],
    notes: { top: ["Apple", "Cinnamon"], heart: ["Vanilla Orchid"], base: ["Tonka", "Cashmeran"] },
    scenarios: ["reading by fireplace", "baking", "rainy afternoon"]
  },
  "adventure": {
    gender: 1,
    pType: 1,
    intensity: 2,
    tags: ["bold", "wild", "rugged", "explorer", "dynamic"],
    notes: { top: ["Ginger", "Cardamom"], heart: ["Tobacco Leaf", "Oud"], base: ["Leather", "Amber"] },
    scenarios: ["mountain climbing", "safari", "road trip"]
  },
  "meditation": {
    pType: 0,
    intensity: 1,
    tags: ["calm", "spiritual", "peaceful", "zen", "incense"],
    notes: { top: ["Frankincense"], heart: ["Lotus", "Sandalwood"], base: ["Patchouli", "Musk"] },
    scenarios: ["yoga", "temple", "spa retreat"]
  },
};

// Креативные описания для разных типов
const CREATIVE_DESCRIPTIONS = {
  0: {
    0: "A unisex elixir of pure sophistication — where artistry meets alchemy.",
    1: "Unisex elegance captured in liquid form — timeless and unforgettable.",
    2: "A versatile masterpiece that transcends boundaries and expectations.",
    3: "Bold and boundary-breaking — for those who define their own rules."
  },
  1: {
    0: "Masculine power distilled into fragrance — commanding yet refined.",
    1: "The modern gentleman's signature — confident without trying.",
    2: "A symphony of strength and subtlety — for the discerning man.",
    3: "Unapologetically masculine — raw power meets refined taste."
  },
  2: {
    0: "Feminine grace in every note — delicate yet unforgettable.",
    1: "The essence of elegance — for the woman who knows her worth.",
    2: "A bouquet of confidence and charm — impossible to ignore.",
    3: "Radiant femininity — where softness meets strength."
  }
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
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const analyze = (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim()) return;
    
    setLoading(true);
    setSelectedScenario(null);
    
    setTimeout(() => {
      const lower = text.toLowerCase();
      let gender: number | undefined;
      let pType: number | undefined;
      let intensity: number = 2;
      const matchedTags: string[] = [];
      const matchedNotes: { top?: string[]; heart?: string[]; base?: string[] } = {};
      let matchCount = 0;

      // Умный поиск с весами
      for (const [keyword, data] of Object.entries(KNOWLEDGE_BASE)) {
        if (lower.includes(keyword)) {
          matchCount++;
          if (data.gender !== undefined && gender === undefined) gender = data.gender;
          if (data.pType !== undefined) {
            // Если несколько совпадений, выбираем среднее или более интенсивное
            pType = pType !== undefined ? Math.min(pType, data.pType) : data.pType;
          }
          if (data.intensity !== undefined) intensity = Math.max(intensity, data.intensity);
          matchedTags.push(...data.tags);
          
          // Объединяем ноты
          if (data.notes.top) matchedNotes.top = [...(matchedNotes.top || []), ...data.notes.top];
          if (data.notes.heart) matchedNotes.heart = [...(matchedNotes.heart || []), ...data.notes.heart];
          if (data.notes.base) matchedNotes.base = [...(matchedNotes.base || []), ...data.notes.base];
        }
      }

      // Дефолтные значения если ничего не найдено
      if (gender === undefined) gender = 0;
      if (pType === undefined) pType = 2;

      // Убираем дубликаты
      const uniqueTags = [...new Set(matchedTags)].slice(0, 5);
      
      // Выбираем топ-3 ноты для каждого уровня
      const topNotes = matchedNotes.top ? [...new Set(matchedNotes.top)].slice(0, 3) : ["Bergamot", "Citrus"];
      const heartNotes = matchedNotes.heart ? [...new Set(matchedNotes.heart)].slice(0, 3) : ["Floral"];
      const baseNotes = matchedNotes.base ? [...new Set(matchedNotes.base)].slice(0, 3) : ["Musk", "Woods"];

      // Креативное описание на основе найденных тегов
      const vibe = uniqueTags.length > 0 
        ? uniqueTags.join(", ")
        : "unique and mysterious";

      // Умная генерация причины
      let reason = "";
      if (matchCount === 0) {
        reason = `Your vibe is intriguing! I'm sensing something ${vibe}. Let's create something uniquely yours.`;
      } else if (matchCount === 1) {
        reason = `I sense ${uniqueTags.slice(0, 3).join(", ")}. This calls for a ${GENDER_NAMES[gender].toLowerCase()} ${TYPE_NAMES[pType].toLowerCase()} that captures this essence perfectly.`;
      } else {
        reason = `A fascinating blend of ${uniqueTags.slice(0, 3).join(", ")}. Your perfect match: a ${GENDER_NAMES[gender].toLowerCase()} ${TYPE_NAMES[pType].toLowerCase()} with depth and character.`;
      }

      // Добавляем креативное описание
      const creativeDesc = CREATIVE_DESCRIPTIONS[gender][pType];
      reason += ` ${creativeDesc}`;

      setSuggestion({ 
        gender, 
        pType, 
        reason, 
        topNotes,
        heartNotes,
        baseNotes,
        vibe
      });
      setLoading(false);
    }, 600);
  };

  const quickScenarios = [
    { emoji: "🏖️", text: "Beach sunset", tags: ["summer", "evening", "romantic"] },
    { emoji: "", text: "CEO meeting", tags: ["work", "elegant", "masculine"] },
    { emoji: "💃", text: "First date", tags: ["date", "romantic", "evening"] },
    { emoji: "", text: "Gala night", tags: ["luxury", "elegant", "night"] },
    { emoji: "", text: "Yoga retreat", tags: ["meditation", "fresh", "morning"] },
    { emoji: "🏔️", text: "Mountain adventure", tags: ["adventure", "winter", "woody"] },
  ];

  return (
    <div className="glass-card p-8 max-w-2xl w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl shadow-lg">
          🤖
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Scent AI Advisor</h3>
          <p className="text-xs text-white/50">Powered by fragrance intelligence</p>
        </div>
      </div>
      
      <p className="text-sm text-white/60 mb-6 leading-relaxed">
        Describe your mood, occasion, or vibe. Our AI analyzes over 100 scenarios to recommend 
        your perfect fragrance profile — complete with note pyramids and creative direction.
      </p>

      {/* Input Area */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="e.g. 'romantic winter evening' or 'summer beach party'..."
          className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          onClick={() => analyze()}
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Analyzing
            </span>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      {/* Quick Scenarios */}
      <div className="mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Quick scenarios</p>
        <div className="flex flex-wrap gap-2">
          {quickScenarios.map((scenario) => (
            <button
              key={scenario.text}
              onClick={() => {
                setSelectedScenario(scenario.text);
                analyze(scenario.tags.join(" "));
              }}
              className={`px-4 py-2 rounded-lg text-xs transition-all ${
                selectedScenario === scenario.text
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {scenario.emoji} {scenario.text}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion Card */}
      {suggestion && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 mb-6 border border-white/10 animate-fade-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-amber-300 font-medium mb-2">✨ AI Recommendation</p>
              <h4 className="text-lg font-bold text-white mb-1">
                {GENDER_NAMES[suggestion.gender]} {TYPE_NAMES[suggestion.pType]}
              </h4>
              <p className="text-xs text-white/50 capitalize">{suggestion.vibe}</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              {suggestion.pType === 0 ? "INTENSE" : suggestion.pType === 1 ? "ELEGANT" : suggestion.pType === 2 ? "FRESH" : "LIGHT"}
            </div>
          </div>
          
          <p className="text-sm text-white/70 italic mb-5 leading-relaxed">
            &ldquo;{suggestion.reason}&rdquo;
          </p>

          {/* Note Pyramid */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-16">Top Notes</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.topNotes.map((note) => (
                  <span key={note} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/80">
                    {note}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-16">Heart</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.heartNotes.map((note) => (
                  <span key={note} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/80">
                    {note}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-16">Base</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.baseNotes.map((note) => (
                  <span key={note} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/80">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelect(suggestion.gender, suggestion.pType)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
          >
            Apply Settings → Create Your Scent
          </button>
        </div>
      )}

      {/* Advanced Tips */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-xs text-white/40 mb-3"> Try combining multiple elements:</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-white/60">"elegant summer evening"</span>
          <span className="text-white/30">•</span>
          <span className="text-white/60">"masculine winter adventure"</span>
          <span className="text-white/30">•</span>
          <span className="text-white/60">"romantic spring date"</span>
        </div>
      </div>
    </div>
  );
}
