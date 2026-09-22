"use client";

import Link from "next/link";

interface NFTCardProps {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  creator: string;
  createdAt: number;
  isGenesis?: boolean;
  isMFW?: boolean;
  isListed?: boolean;
  price?: string;
  seller?: string;
}

const RARITY_STYLE: Record<number, { 
  bg: string; 
  border: string; 
  badge: string; 
  glow: string;
  hex: string;
}> = {
  0: {
    bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80",
    border: "border-slate-500/40",
    badge: "bg-slate-500/30 text-slate-200 border-slate-400/50",
    glow: "hover:shadow-[0_0_30px_rgba(148,163,184,0.15)]",
    hex: "#94a3b8",
  },
  1: {
    bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80",
    border: "border-blue-400/50",
    badge: "bg-blue-500/30 text-blue-100 border-blue-400/50",
    glow: "hover:shadow-[0_0_40px_rgba(96,165,250,0.25)]",
    hex: "#60a5fa",
  },
  2: {
    bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80",
    border: "border-purple-400/50",
    badge: "bg-purple-500/30 text-purple-100 border-purple-400/50",
    glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.25)]",
    hex: "#c084fc",
  },
  3: {
    bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90",
    border: "border-amber-400/60",
    badge: "bg-amber-500/40 text-amber-100 border-amber-400/60",
    glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.35)]",
    hex: "#fbbf24",
  },
};

// MFW统一紫色样式
const MFW_STYLE = {
  bg: "from-purple-900/80 via-indigo-900/70 to-slate-900/80",
  border: "border-purple-500/50",
  badge: "bg-purple-500/40 text-purple-100 border-purple-400/60",
  glow: "shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]",
  hex: "#a855f7",
};

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["", "♂", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

export default function NFTCard({
  tokenId,
  name,
  rarity,
  gender,
  pType,
  concentration,
  topNotes = [],
  heartNotes = [],
  baseNotes = [],
  creator,
  createdAt,
  isGenesis = false,
  isMFW = false,
  isListed = false,
  price,
  seller,
}: NFTCardProps) {
  // MFW使用统一紫色样式，其他使用 rarity 样式
  const style = isMFW ? MFW_STYLE : (RARITY_STYLE[rarity] || RARITY_STYLE[0]);

  return (
    <Link href={`/nft/${tokenId}`}>
      <div
        className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer`}
      >
        {/* MFW Collection Special Effects */}
        {isMFW && (
          <>
            {/* Animated Bottle Watermark */}
            <div className="absolute inset-0 flex items-start justify-center pointer-events-none opacity-5">
              <svg className="w-64 h-64 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            {/* Purple Border Glow Animation */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse" />
            </div>

            {/* Bottle Icon Animation on Top */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 opacity-100 group-hover:opacity-100 transition-all duration-700 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
               <svg className="w-full h-full text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
            </div>
          </>
        )}

        {/* Genesis Collection Special Effects */}
        {isGenesis && (
          <>
            {/* Animated Arc Logo Watermark */}
            <div className="absolute inset-0 flex items-start justify-center pointer-events-none opacity-5">
              <svg viewBox="0 0 100 60" className="w-64 h-40 text-white" fill="currentColor">
                <path d="M10 50 Q50 -20 90 50" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </div>

            {/* Golden Border Glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 animate-pulse" />
            </div>

            {/* Arc Arch Animation on Top */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-16 opacity-0 group-hover:opacity-100 transition-all duration-700">
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path
                  d="M10 50 Q50 -20 90 50"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  fill="none"
                  className="drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                />
              </svg>
            </div>
          </>
        )}

        {/* Standard Shimmer Effect (only for non-MFW/non-Genesis) */}
        {!isMFW && !isGenesis && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${style.hex}30, transparent)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 2s linear infinite",
            }}
          />
        )}

        {/* Top Gradient Line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Header with MFW Bottle Badge & Genesis Arc Logo */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* MFW Bottle Badge */}
            {isMFW && (
              <div className="relative group/mfw" title="MFW 2026 Exclusive">
                <div className="w-7 h-7 rounded-full bg-purple-500/30 border border-purple-400/60 flex items-center justify-center drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-purple-300 text-[10px] rounded opacity-0 group-hover/mfw:opacity-100 transition-opacity whitespace-nowrap z-10">
                  MFW 2026 Exclusive
                </div>
              </div>
            )}
            
            {/* Arc Logo for Genesis */}
            {isGenesis && (
              <div className="relative group/arc" title="Built on Arc">
                <svg viewBox="0 0 32 32" className="w-6 h-6 text-amber-400/80 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" fill="none">
                  <path d="M4 26 Q16 2 28 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded opacity-0 group-hover/arc:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Built on Arc
                </div>
              </div>
            )}
            
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">
                Scent #{tokenId}
              </p>
              <h3 className="text-xl font-bold text-white mt-1 truncate max-w-[200px]">
                {name}
              </h3>
            </div>
          </div>
          
          {/* Rarity Badge */}
          <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
            {RARITY_LABELS[rarity]}
          </span>
        </div>

        {/* MFW Badge */}
        {isMFW && (
          <div className="relative mb-4">
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border border-purple-500/40">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                MFW 2026 Exclusive
              </span>
            </div>
          </div>
        )}

        {/* Genesis Badge */}
        {isGenesis && (
          <div className="relative mb-4">
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40">
              <svg viewBox="0 0 32 32" className="w-4 h-4 text-amber-400" fill="none">
                <path d="M4 26 Q16 2 28 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Genesis Collection
              </span>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="relative flex flex-wrap gap-2 text-xs mb-4">
          <span className="px-2 py-1 rounded-full bg-black/30 text-white/70 border border-white/10">
            {GENDER_ICONS[gender] || "Unisex"}
          </span>
          <span className="px-2 py-1 rounded-full bg-black/30 text-white/70 border border-white/10">
            {TYPE_LABELS[pType] || "EDP"}
          </span>
          <span className="px-2 py-1 rounded-full bg-black/30 text-white/70 border border-white/10">
            {concentration || 0}%
          </span>
        </div>

        {/* Notes Preview (Compact) */}
        <div className="relative space-y-2 text-xs mb-4">
          <div>
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Top Notes</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {topNotes.slice(0, 2).map((n) => (
                <span key={n} className="px-1.5 py-0.5 rounded bg-black/30 text-amber-200/80 text-[10px] border border-amber-500/20">
                  {n}
                </span>
              ))}
              {topNotes.length > 2 && (
                <span className="px-1.5 py-0.5 rounded bg-black/30 text-white/40 text-[10px]">
                  +{topNotes.length - 2}
                </span>
              )}
              {topNotes.length === 0 && <span className="text-white/30 text-[10px]">Unknown</span>}
            </div>
          </div>
        </div>

        {/* Marketplace Info (if listed) */}
        {isListed && price && seller && (
          <div className="relative mb-4 p-3 rounded-xl bg-black/30 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 uppercase">Price</p>
                <p className="text-lg font-bold text-emerald-400">{price} USDC</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">Seller</p>
                <p className="text-xs text-white/60 font-mono">
                  {seller.slice(0, 4)}...{seller.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            {/* Arc Network Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/60" fill="none">
                <path d="M3 20 Q12 2 21 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-white/40">Arc Network</span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-amber-400 font-medium">View Details →</span>
          </div>
        </div>

        {/* Bottom Decoration */}
        {(isGenesis || isMFW) && (
          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${isMFW ? 'purple' : 'amber'}-500/50 to-transparent`} />
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </Link>
  );
}
