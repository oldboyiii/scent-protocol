"use client";

import { useState } from "react";

interface Suggestion {
  gender: number;
  pType: number;
  reason: string;
}

const KEYWORDS: Record<string, { gender?: number; pType?: number; tags: string[] }> = {
  "summer": { pType: 2, tags: ["fresh", "light", "citrus"] },
  "fresh": { pType: 2, tags: ["citrus", "aquatic", "green"] },
  "light": { pType: 2, tags: ["airy", "soft"] },
  "winter": { pType: 0, tags: ["warm", "woody", "spicy"] },
  "warm": { pType: 0, tags: ["amber", "vanilla", "spicy"] },
  "date": { pType: 1, tags: ["seductive", "floral", "sweet"] },
  "evening": { pType: 1, tags: ["rich", "mysterious", "oud"] },
  "night": { pType: 1, tags: ["dark", "intense", "musk"] },
  "work": { pType: 2, tags: ["clean", "professional", "subtle"] },
  "office": { pType: 2, tags: ["clean", "professional", "subtle"] },
  "sport": { pType: 3, tags: ["energetic", "fresh", "minty"] },
  "gym": { pType: 3, tags: ["energetic", "fresh", "minty"] },
  "elegant": { pType: 1, tags: ["sophisticated", "refined", "classic"] },
  "luxury": { pType: 0, tags: ["rich", "exclusive", "rare"] },
  "casual": { pType: 2, tags: ["easy-going", "versatile"] },
  "beach": { pType: 3, tags: ["salty", "sunny", "tropical"] },
  "party": { pType: 1, tags: ["bold", "sparkling", "sweet"] },
  "romantic": { gender: 2, pType: 1, tags: ["rose", "jasmine", "soft"] },
  "masculine": { gender: 1, pType: 1, tags: ["woody", "leathery", "aromatic"] },
  "feminine": { gender: 2, pType: 1, tags: ["floral", "fruity", "sweet"] },
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

  const analyze = () => {
    setLoading(true);
    setTimeout(() => {
      const lower = input.toLowerCase();
      let gender: number | undefined;
      let pType: number | undefined;
      const matchedTags: string[] = [];

      for (const [word, data] of Object.entries(KEYWORDS)) {
        if (lower.includes(word)) {
          if (data.gender !== undefined) gender = data.gender;
          if (data.pType !== undefined) pType = data.pType;
          matchedTags.push(...data.tags);
        }
      }

      if (gender === undefined) gender = 0;
      if (pType === undefined) pType = 2;

      const uniqueTags = [...new Set(matchedTags)].slice(0, 3);
      const reason = uniqueTags.length > 0
        ? `Detected mood: ${uniqueTags.join(", ")}. Recommended ${GENDER_NAMES[gender]} ${TYPE_NAMES[pType].toLowerCase()}.`
        : `Based on your vibe, I recommend a ${GENDER_NAMES[gender].toLowerCase()} ${TYPE_NAMES[pType].toLowerCase()}.`;

      setSuggestion({ gender, pType, reason });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="glass-card p-6 max-w-xl w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="text-lg font-bold text-white">Scent AI Advisor</h3>
      </div>
      <p className="text-sm text-white/50 mb-4">
        Describe your mood, occasion, or vibe — AI will recommend the perfect fragrance type.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="e.g. summer date, winter evening, gym..."
          className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={analyze}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Analyze"}
        </button>
      </div>

      {suggestion && (
        <div className="bg-white/5 rounded-lg p-4 mb-4 animate-fade-up">
          <p className="text-sm text-white/80 italic mb-3">&ldquo;{suggestion.reason}&rdquo;</p>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-amber-300">
              {GENDER_NAMES[suggestion.gender]}
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-amber-300">
              {TYPE_NAMES[suggestion.pType]}
            </div>
          </div>
          <button
            onClick={() => onSelect(suggestion.gender, suggestion.pType)}
            className="mt-3 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Apply &rarr; Create Your Scent
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["summer date", "winter evening", "office", "party", "romantic"].map((tag) => (
          <button
            key={tag}
            onClick={() => { setInput(tag); }}
            className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

