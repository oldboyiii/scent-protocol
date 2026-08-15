"use client";

import { PerfumeData, GENDER_MAP, TYPE_MAP, RARITY_MAP, RARITY_COLORS } from "@/utils/contract";

interface Props {
  tokenId: number;
  perfume: PerfumeData;
  aiDescription?: string;
}

export default function PerfumeCard({ tokenId, perfume, aiDescription }: Props) {
  return (
    <div className="glass-card p-6 hover:bg-white/10 transition-all duration-300 animate-fade-up hover-lift">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-scent-gold">{perfume.name}</h3>
          <p className="text-sm text-white/60">#{tokenId}</p>
        </div>
        <span className={`text-sm font-bold ${RARITY_COLORS[perfume.rarity]}`}>
          {RARITY_MAP[perfume.rarity]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="text-white/50">Gender:</div>
        <div>{GENDER_MAP[perfume.gender]}</div>
        <div className="text-white/50">Type:</div>
        <div>{TYPE_MAP[perfume.pType]}</div>
        <div className="text-white/50">Concentration:</div>
        <div>{perfume.concentration}%</div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Top Notes</p>
          <div className="flex flex-wrap gap-2">
            {perfume.topNotes.map((note, i) => (
              <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs">
                {note}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Heart Notes</p>
          <div className="flex flex-wrap gap-2">
            {perfume.heartNotes.map((note, i) => (
              <span key={i} className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded-lg text-xs">
                {note}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Base Notes</p>
          <div className="flex flex-wrap gap-2">
            {perfume.baseNotes.map((note, i) => (
              <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs">
                {note}
              </span>
            ))}
          </div>
        </div>
      </div>

      {aiDescription && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">AI Description</p>
          <p className="text-sm text-white/80 italic leading-relaxed">{aiDescription}</p>
        </div>
      )}
    </div>
  );
}
