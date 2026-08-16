"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "@/utils/contract";

const MINI_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[] topNotes, string[] heartNotes, string[] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)",
];

// Topic0 для Transfer(address,address,uint256)
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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

        // Читаем логи Transfer напрямую через getLogs
        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          topics: [TRANSFER_TOPIC, ethers.zeroPadValue("0x0000", 32)], // from = zero address (mint)
          fromBlock: 0,
          toBlock: "latest",
        });

        console.log("Gallery logs found:", logs.length);

        // Извлекаем tokenId из topic3
        const tokenIds = logs
          .map((log) => {
            try {
              return Number(log.topics[3]); // indexed tokenId
            } catch {
              return null;
            }
          })
          .filter((id): id is number => id !== null);

        const uniqueTokenIds = [...new Set(tokenIds)].sort((a, b) => b - a).slice(0, 50);
        console.log("Unique token IDs:", uniqueTokenIds);

        const contract = new ethers.Contract(CONTRACT_ADDRESS, MINI_ABI, provider);
        const results: GalleryItem[] = [];

        for (const tokenId of uniqueTokenIds) {
          try {
            const perfume = await contract.getPerfume(tokenId);
            results.push({
              tokenId,
              name: perfume.name,
              rarity: Number(perfume.rarity),
              gender: Number(perfume.gender),
              pType: Number(perfume.pType),
            });
          } catch (e) {
            console.warn(`Failed to fetch perfume #${tokenId}:`, e);
          }
        }

        setItems(results);
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
          <p className="text-sm text-white/20 mt-2">Contract: {CONTRACT_ADDRESS.slice(0, 8)}...</p>
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
