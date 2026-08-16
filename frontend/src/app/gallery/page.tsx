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
  const [debug, setDebug] = useState<string[]>([]);

  useEffect(() => {
    async function fetchGallery() {
      const logs: string[] = [];
      try {
        let contract;

        // Используем MetaMask provider если есть, иначе fallback
        const w = window as any;
        if (w.ethereum) {
          const browserProvider = new ethers.BrowserProvider(w.ethereum);
          contract = getContract(browserProvider);
          logs.push("Using MetaMask provider");
        } else {
          const fallbackProvider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
          contract = getContract(fallbackProvider);
          logs.push("Using fallback RPC");
        }

        // Пробуем totalSupply
        let total = 0;
        try {
          const supply = await contract.totalSupply();
          total = Number(supply);
          logs.push(`totalSupply = ${total}`);
        } catch (e: any) {
          logs.push(`totalSupply: ${e.reason || e.message?.slice(0, 60)}`);
        }

        const maxId = total > 0 ? total : 50;
        logs.push(`Checking 1..${maxId}`);

        const results: GalleryItem[] = [];

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
                .catch((e: any) => {
                  logs.push(`#${tokenId} error: ${e.reason || e.message?.slice(0, 40)}`);
                  return null;
                })
            );
          }

          const batchResults = await Promise.all(batch);
          const found = batchResults.filter((r): r is GalleryItem => r !== null);
          results.push(...found);
          logs.push(`Batch ${start}-${end}: found ${found.length}`);
        }

        logs.push(`Total found: ${results.length}`);
        setItems(results.reverse());
      } catch (e: any) {
        logs.push(`Fatal: ${e.message?.slice(0, 100)}`);
      } finally {
        setDebug(logs);
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

      <div className="mb-6 p-4 bg-black/30 rounded-lg text-xs font-mono text-white/50 space-y-1 max-h-48 overflow-y-auto">
        {debug.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-40 skeleton-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-white/40">
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
