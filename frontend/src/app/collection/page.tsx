"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PerfumeData } from "@/utils/contract";

interface StoredScent {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
  timestamp: number;
}

export default function CollectionPage() {
  const [scents, setScents] = useState<StoredScent[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("scent_collection");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setScents(parsed.sort((a: StoredScent, b: StoredScent) => b.timestamp - a.timestamp));
      } catch {}
    }
  }, []);

  const rarityLabel = ["Common", "Rare", "Epic", "Legendary"];
  const rarityColor = ["text-gray-400", "text-blue-400", "text-purple-400", "text-amber-400"];
  const genderText = ["Unisex", "Male", "Female"];
  const typeText = ["Parfum", "EDP", "EDT", "EDC"];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">
        My Collection
      </h1>
      <p className="text-white/50 mb-8">Your minted fragrances, stored locally in your browser.</p>

      {scents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 mb-4">No scents minted yet.</p>
          <Link href="/" className="text-amber-400 hover:text-amber-300 underline">
            Mint your first fragrance →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {scents.map((s) => (
            <div key={s.tokenId} className="glass-card p-6 card-appear">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm text-white/50">Scent #{s.tokenId}</span>
                  <h2 className="text-2xl font-bold text-white">{s.perfume.name}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/10 uppercase ${rarityColor[s.perfume.rarity]}`}>
                  {rarityLabel[s.perfume.rarity]}
                </span>
              </div>

              {/* Meta */}
              <p className="text-sm text-white/50 mb-4">
                {genderText[s.perfume.gender]} · {typeText[s.perfume.pType]} · {s.perfume.concentration}% concentration
              </p>

              {/* Notes Pyramid */}
              <div className="space-y-3 mb-4">
                <NoteRow label="Top Notes" notes={s.perfume.topNotes} color="text-yellow-300" />
                <NoteRow label="Heart Notes" notes={s.perfume.heartNotes} color="text-pink-300" />
                <NoteRow label="Base Notes" notes={s.perfume.baseNotes} color="text-amber-600" />
              </div>

              {/* AI Description */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Description</p>
                <p className="text-white/80 text-sm italic leading-relaxed">&ldquo;{s.description}&rdquo;</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>By {s.perfume.creator.slice(0, 6)}...{s.perfume.creator.slice(-4)}</span>
                <span>{new Date(s.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteRow({ label, notes, color }: { label: string; notes: string[]; color: string }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {notes.map((n, i) => (
          <span key={i} className={`px-3 py-1 rounded-full bg-white/10 text-sm ${color}`}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

