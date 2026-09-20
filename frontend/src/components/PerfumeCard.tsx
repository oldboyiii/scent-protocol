"use client";

import Link from "next/link";
import { PerfumeData, GENDER_MAP, TYPE_MAP, RARITY_MAP, RARITY_COLORS } from "@/utils/contract";

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

export default function PerfumeCard({ tokenId, perfume, aiDescription, highlight = false }: PerfumeCardProps) {
  const style = RARITY_STYLE[perfume.rarity] || RARITY_STYLE[0];

  return (
    <Link href={`/nft/${tokenId}`}>
      <div 
        className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
          highlight ? "ring-4 ring-amber-400/50 ring-offset-2 ring-offset-slate-900" : ""
        }`}
      >
        {/* Shimmer effect for highlighted (newly minted) cards */}
        {highlight && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: `linear-gradient(90deg, transparent, ${style.hex}40, transparent)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }} />
        )}

        {/* Hover shimmer for regular cards */}
        {!highlight && (
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${style.hex}30, transparent)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 2s linear infinite",
              padding: "2px",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        )}

        {/* Glass shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Header */}
        <div className="relative flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Scent #{tokenId}</p>
            <h3 className="text-xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
              {perfume.name}
            </h3>
          </div>
          <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
            {RARITY_MAP[perfume.rarity]}
          </span>
        </div>

        {/* Meta info */}
        <div className="relative flex flex-wrap gap-2 text-xs mb-4">
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
            {GENDER_MAP[perfume.gender]}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
            {TYPE_MAP[perfume.pType]}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
            {perfume.concentration}%
          </span>
        </div>

        {/* Notes */}
        <div className="relative space-y-3 mb-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Top Notes</p>
            <div className="flex flex-wrap gap-1.5">
              {perfume.topNotes.map((note, i) => (
                <span key={i} className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-md text-xs border border-green-500/30">
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Heart Notes</p>
            <div className="flex flex-wrap gap-1.5">
              {perfume.heartNotes.map((note, i) => (
                <span key={i} className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md text-xs border border-rose-500/30">
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Base Notes</p>
            <div className="flex flex-wrap gap-1.5">
              {perfume.baseNotes.map((note, i) => (
                <span key={i} className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-xs border border-amber-500/30">
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Description */}
        {aiDescription && (
          <div className={`relative rounded-lg p-3 text-sm italic border-l-2 mb-4 ${
            highlight ? 'bg-amber-950/40 border-amber-400/60 text-white/80' : 'bg-black/30 border-white/20 text-white/70'
          }`}>
            {aiDescription}
          </div>
        )}

        {/* Footer */}
        <div className="relative flex items-center justify-between pt-2 border-t border-white/10">
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
