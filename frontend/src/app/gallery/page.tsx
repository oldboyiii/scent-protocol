"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        let contract;
        const w = window as any;
        if (w.ethereum) {
          const browserProvider = new ethers.BrowserProvider(w.ethereum);
          contract = getContract(browserProvider);
        } else {
          const fallbackProvider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
          contract = getContract(fallbackProvider);
        }

        const results: GalleryItem[] = [];
        const maxId = 50;

        for (let start = 1; start <= maxId; start += 10) {
          const end = Math.min(start + 9, maxId);
          const batch = [];

          for (let tokenId = start; tokenId <= end; tokenId++) {
            batch.push(
              contract.getPerfume(tokenId)
                .then((p: any) => {
                  if (p && p.name) {
                    return {
                      tokenId,
                      name: p.name,
                      rarity: Number(p.rarity),
                      gender: Number(p.gender),
                      pType: Number(p.pType),
                    };
                  }
                  return null;
                })
                .catch(() => null)
            );
          }

          const batchResults = await Promise.all(batch);
          results.push(...batchResults.filter((r): r is GalleryItem => r !== null));
        }

        setItems(results.reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, []);

  const rarityLabel = ["Common", "Rare", "Epic", "Legendary"];
  const rarityColor = ["text-gray-400", "text-blue-400", "text-purple-400", "text-amber-400"];
  const genderIcon = ["⚲", "♂", "♀"];
  const typeLabel = ["Parfum", "EDP", "EDT", "EDC"];

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">
        Gallery
      </h1>
      <p className="text-white/50 mb-8">All fragrances minted on ScentProtocol.</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-40 skeleton-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p>No fragrances found on-chain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link key={item.tokenId} href={`/nft/${item.tokenId}`}>
              <div className="glass-card p-5 hover:bg-white/10 transition-colors cursor-pointer card-appear">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/50">#{item.tokenId}</span>
                  <span className={`text-xs font-bold uppercase ${rarityColor[item.rarity]}`}>
                    {rarityLabel[item.rarity]}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white truncate mb-2">{item.name}</h3>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{genderIcon[item.gender]}</span>
                  <span>{typeLabel[item.pType]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
