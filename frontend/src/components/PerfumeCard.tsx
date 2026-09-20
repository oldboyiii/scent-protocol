"use client";

import Link from "next/link";
import { PerfumeData } from "@/utils/contract";

interface PerfumeCardProps {
  tokenId: number;
  perfume: PerfumeData;
  aiDescription?: string;
  highlight?: boolean;
}

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

const RARITY = ["Common", "Rare", "Epic", "Legendary"];
const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];

export default function PerfumeCard({ tokenId, perfume, aiDescription, highlight = false }: PerfumeCardProps) {
  const style = RARITY_STYLE[perfume.rarity] || RARITY_STYLE[0];

  return (
    <Link href={`/nft/${tokenId}`}>
      <div 
        className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
          highlight ? "ring-4 ring-amber-400/50 ring-offset-2 ring-offset-slate-900" : ""
        }`}
      >
        {highlight && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: `linear-gradient(90deg, transparent, ${style.hex}40, transparent)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }} />
        )}

        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Scent #{tokenId}</p>
            <h3 className="text-xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
              {perfume.name}
            </h3>
          </div>
          <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
            {RARITY[perfume.rarity]}
          </span>
        </div>

        <div className="relative flex flex-wrap gap-2 text-xs mb-4">
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{GENDER[perfume.gender]}</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{TYPE[perfume.pType]}</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{perfume.concentration}%</span>
        </div>

        {aiDescription && (
          <div className="relative text-sm text-white/60 italic border-l-2 border-white/20 pl-3 mb-4">
            {aiDescription}
          </div>
        )}

        <div className="relative flex items-center justify-between pt-2">
          <span className="text-sm text-white/50">View Details</span>
          <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </Link>
  );
}
