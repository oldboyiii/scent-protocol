"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "@/utils/contract";

const MINI_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[] topNotes, string[] heartNotes, string[] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)",
];

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
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGallery() {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MINI_ABI, provider);

        const results: GalleryItem[] = [];

        // Перебираем tokenId от 1 до 200, ПРОПУСКАЕМ ошибки (continue), не break
        for (let tokenId = 1; tokenId <= 200; tokenId++) {
          try {
            const perfume = await contract.getPerfume(tokenId);
            if (perfume.name) {
              results.push({
                tokenId,
                name: perfume.name,
                rarity: Number(perfume.rarity),
                gender: Number(perfume.gender),
                pType: Number(perfume.pType),
              });
            }
          } catch {
            // Токен не существует или ошибка — пропускаем, идём дальше
            continue;
          }
        }

        setItems(results.reverse());
      } catch (e: any) {
        console.error("Gallery fetch error:", e);
        setError(e.message || "Failed to load gallery");
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

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">
          Gallery
        </h1>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-600 rounded-lg text-white hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

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
