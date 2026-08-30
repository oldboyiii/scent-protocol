"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// ABI только для getPerfume. totalSupply убран.
const GALLERY_ABI = [
  "function getPerfume(uint256 tokenId) view returns (tuple(string name, uint8 gender, uint8 pType, uint8 concentration, uint8 rarity, string[] topNotes, string[] heartNotes, string[] baseNotes, address creator, uint256 createdAt))"
];

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["⚲", "♂", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLES: Record<number, { badge: string; text: string }> = {
  0: { badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", text: "text-slate-300" },
  1: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", text: "text-blue-300" },
  2: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", text: "text-purple-300" },
  3: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", text: "text-amber-300" },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const signer = await getArcSigner();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, GALLERY_ABI, signer.provider);

        const results: GalleryItem[] = [];
        let tokenId = 1;
        let emptyCount = 0;
        const MAX_EMPTY_CHECKS = 5; // Stop if we find 5 consecutive missing tokens

        // Iterate sequentially until we hit a gap
        while (emptyCount < MAX_EMPTY_CHECKS) {
          try {
            const p = await contract.getPerfume(tokenId);
            
            if (p && p.name) {
              results.push({
                tokenId,
                name: p.name,
                rarity: Number(p.rarity),
                gender: Number(p.gender),
                pType: Number(p.pType),
              });
              emptyCount = 0; // Reset counter on success
            } else {
              emptyCount++;
            }
          } catch (e) {
            // If call reverts or fails, count as empty
            emptyCount++;
          }
          
          tokenId++;
          
          // Safety break to prevent infinite loops in testnet
          if (tokenId > 1000) break; 
        }

        setItems(results.reverse());
      } catch (e) {
        console.error("Failed to load gallery:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent leading-normal pb-1">
        Gallery
      </h1>
      <p className="text-white/50 mb-8">Explore all fragrances minted on ScentProtocol.</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card-luxury p-5 h-40 animate-pulse rounded-xl border border-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl border border-white/10">
          <p>No fragrances found on-chain yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const style = RARITY_STYLES[item.rarity] || RARITY_STYLES[0];
            return (
              <Link key={item.tokenId} href={`/nft/${item.tokenId}`} className="block group">
                <div className="glass-card-luxury p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/10 bg-slate-900/40 backdrop-blur-md h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/40">#{item.tokenId}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {RARITY_LABELS[item.rarity]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white truncate mb-2 group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h3>
                  <div className="mt-auto flex items-center gap-3 text-xs text-white/50 pt-2 border-t border-white/5">
                    <span>{GENDER_ICONS[item.gender]}</span>
                    <span>{TYPE_LABELS[item.pType]}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
