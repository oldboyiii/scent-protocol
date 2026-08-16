"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "@/utils/contract";

const MINI_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
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

  useEffect(() => {
    async function fetchGallery() {
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MINI_ABI, provider);

        const filter = contract.filters.Transfer(ethers.ZeroAddress);
        const events = await contract.queryFilter(filter, 0, "latest");

        const uniqueTokenIds = [...new Set(events.map((e) => Number((e as any).args?.tokenId)))];

        const results: GalleryItem[] = [];
        for (const tokenId of uniqueTokenIds.slice(0, 50)) {
          try {
            const perfume = await contract.getPerfume(tokenId);
            results.push({
              tokenId,
              name: perfume.name,
              rarity: Number(perfume.rarity),
              gender: Number(perfume.gender),
              pType: Number(perfume.pType),
            });
          } catch {}
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
        <div className="text-center py-20 text-white/40">No fragrances minted yet.</div>
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
