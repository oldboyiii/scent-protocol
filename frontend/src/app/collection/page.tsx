"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StoredScent {
  tokenId: number;
  name: string;
  rarity: number;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scents.map((s) => (
            <Link key={s.tokenId} href={`/nft/${s.tokenId}`}>
              <div className="glass-card p-5 hover:bg-white/10 transition-colors cursor-pointer card-appear">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/50">#{s.tokenId}</span>
                  <span className={`text-xs font-bold uppercase ${rarityColor[s.rarity] || rarityColor[0]}`}>
                    {rarityLabel[s.rarity] || "Common"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white truncate">{s.name}</h3>
                <p className="text-xs text-white/40 mt-2">
                  Minted {new Date(s.timestamp).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
