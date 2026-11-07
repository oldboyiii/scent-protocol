"use client";

import Link from "next/link";
import { PerfumeData, GENDER_MAP, TYPE_MAP, RARITY_MAP } from "@/utils/contract";
import ScentCrest from "@/components/ScentCrest";
import FitTitle from "@/components/FitTitle"; // ✅ Added FitTitle import

interface PerfumeCardProps {
  tokenId: number;
  perfume: PerfumeData;
  aiDescription?: string;
  highlight?: boolean;
  isGenesis?: boolean;
  isMFW?: boolean;
  isHybrid?: boolean;
}

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

const MFW_STYLE = {
  bg: "from-purple-900/80 via-indigo-900/70 to-slate-900/80",
  border: "border-purple-500/50",
  badge: "bg-purple-500/40 text-purple-100 border-purple-400/60",
  text: "text-purple-100",
  glow: "shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]",
  hex: "#a855f7",
};

const HYBRID_STYLE = {
  bg: "from-cyan-900/80 via-teal-900/70 to-slate-900/80",
  border: "border-cyan-500/50",
  badge: "bg-cyan-500/40 text-cyan-100 border-cyan-400/60",
  text: "text-cyan-100",
  glow: "shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]",
  hex: "#22d3ee",
};

export default function PerfumeCard({ 
  tokenId, 
  perfume, 
  aiDescription, 
  highlight = false,
  isGenesis = false,
  isMFW = false,
  isHybrid = false
}: PerfumeCardProps) {
  // Determine style: Collection-specific styles take precedence over rarity
  const style = isHybrid 
    ? HYBRID_STYLE 
    : isMFW 
      ? MFW_STYLE 
      : (RARITY_STYLE[perfume.rarity] || RARITY_STYLE[0]);

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

        {/* Hover shimmer for regular cards (only if not a special collection with its own effects) */}
        {!highlight && !isMFW && !isGenesis && !isHybrid && (
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

        {/* Special Collection Overlays */}
        {isMFW && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse" />
          </div>
        )}
        {isGenesis && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 animate-pulse" />
          </div>
        )}
        {isHybrid && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/20 animate-pulse" />
          </div>
        )}

        {/* Glass shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Header */}
        <div className="relative flex justify-between items-start mb-4">
          {/* ✅ Added min-w-0 and flex-1 for proper text shrinking */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Scent Crest Logo */}
            <div className="flex-shrink-0">
              <ScentCrest
                seed={`${perfume.creator}-${perfume.name}`}
                name={perfume.name}
                rarity={perfume.rarity}
                size={60}
              />
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/40 uppercase tracking-wider truncate">
                {isHybrid ? "Hybrid" : isMFW ? "MFW 2026" : isGenesis ? "Genesis" : "Scent"} #{tokenId}
              </p>
              
              {/* ✅ REPLACEMENT: Using FitTitle instead of a hardcoded h3 */}
              <FitTitle 
                text={perfume.name} 
                className="font-bold text-white mt-1 group-hover:text-amber-300 transition-colors" 
              />
            </div>
          </div>
          
          {/* ✅ Added flex-shrink-0 to prevent the badge from shrinking */}
          <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge} flex-shrink-0`}>
            {RARITY_MAP[perfume.rarity]}
          </span>
        </div>

        {/* Collection Badge (if applicable) */}
        {isMFW && (
          <div className="relative mb-4">
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border border-purple-500/40">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">MFW 2026 Exclusive</span>
            </div>
          </div>
        )}
        {isGenesis && (
          <div className="relative mb-4">
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40">
              <svg viewBox="0 0 32 32" className="w-4 h-4 text-amber-400" fill="none">
                <path d="M4 26 Q16 2 28 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Genesis Collection</span>
            </div>
          </div>
        )}
        {isHybrid && (
          <div className="relative mb-4">
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/20 border border-cyan-500/40">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v6l-6 9h18l-6-9V3H9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6" />
              </svg>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Scent Alchemy Hybrid</span>
            </div>
          </div>
        )}

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
