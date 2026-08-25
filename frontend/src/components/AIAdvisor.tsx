"use client";

import { useState } from "react";

interface AIAdvisorProps {
  onSelect: (gender: number, type: number) => void;
}

const MOOD_MAP: Record<string, { gender: number; type: number; reason: string }> = {
  "summer": { gender: 2, type: 2, reason: "Light, fresh scents work best in heat. Unisex EDT recommended." },
  "winter": { gender: 0, type: 0, reason: "Cold weather calls for rich, concentrated warmth. Male Parfum." },
  "date": { gender: 1, type: 1, reason: "Romantic evenings need depth and longevity. Female EDP." },
  "office": { gender: 2, type: 2, reason: "Subtle and professional. Unisex EDT is perfect." },
  "party": { gender: 2, type: 1, reason: "Make an impression. Unisex EDP has presence." },
  "fresh": { gender: 2, type: 3, reason: "Crisp and airy. Unisex EDC for everyday." },
  "strong": { gender: 0, type: 0, reason: "Bold and commanding. Male Parfum." },
  "sweet": { gender: 1, type: 1, reason: "Warm and inviting. Female EDP." },
  "elegant": { gender: 1, type: 0, reason: "Sophistication in every drop. Female Parfum." },
  "sport": { gender: 0, type: 3, reason: "Energetic and light. Male EDC." },
};

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];

export default function AIAdvisor({ onSelect }: AIAdvisorProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    gender: number;
    type: number;
    reason: string;
  } | null>(null);

  const analyze = () => {
    const lower = input.toLowerCase();
    for (const [key, value] of Object.entries(MOOD_MAP)) {
      if (lower.includes(key)) {
        setResult(value);
        return;
      }
    }
    // Default
    setResult({
      gender: 2,
      type: 2,
      reason: "No specific mood detected. Defaulting to versatile Unisex EDT.",
    });
  };

  const quickTags = [
    "summer", "winter", "date", "office",
    "party", "fresh", "strong", "sweet",
  ];

  return (
    <div className="glass-card rounded-2xl p-6 max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="text-lg font-bold text-white">AI Perfume Advisor</h3>
          <p className="text-sm text-white/50">Describe the occasion or mood</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="e.g. summer date, office, party..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
        <button
          onClick={analyze}
          className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 font-semibold hover:bg-amber-500/30 transition-colors border border-amber-500/30"
        >
          Analyze
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setInput(tag);
              const lower = tag.toLowerCase();
              for (const [key, value] of Object.entries(MOOD_MAP)) {
                if (lower.includes(key)) {
                  setResult(value);
                  return;
                }
              }
            }}
            className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 transition-colors capitalize"
          >
            {tag}
          </button>
        ))}
      </div>

      {result && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
          <p className="text-sm text-white/70">{result.reason}</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-sm font-semibold border border-amber-500/20">
              {GENDER[result.gender]}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-sm font-semibold border border-amber-500/20">
              {TYPE[result.type]}
            </span>
          </div>
          <button
            onClick={() => onSelect(result.gender, result.type)}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
          >
            Apply to Mint Form →
          </button>
        </div>
      )}
    </div>
  );
}

