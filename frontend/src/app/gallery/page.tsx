"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace"; // Используем твой ArcSigner для стабильности

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// Полное ABI, как в working detail page
const FULL_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

// Упрощенное ABI для fallback (если полное не декодируется)
const BASIC_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, uint8 concentration)"
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

// Стили для редкости (как на скриншоте детали)
const RARITY_STYLES: Record<number, { 
  badge: string; 
  border: string;
  glow: string;
}> = {
  0: { 
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", 
    border: "border-slate-500/30",
    glow: "hover:shadow-[0_0_15px_rgba(148,163,184,0.1)]"
  },
  1: { 
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", 
    border: "border-blue-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
  },
  2: { 
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", 
    border: "border-purple-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
  },
  3: { 
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", 
    border: "border-amber-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]"
  },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Scanning blockchain...");

  useEffect(() => {
    async function fetchGallery() {
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;
        
        // Создаем контракты для обоих ABI
        const fullContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, FULL_ABI, provider);
        const basicContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, BASIC_ABI, provider);

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;
        const BATCH_SIZE = 5;

        setStatus(`Scanning IDs (Auto-detect mode)...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          const batchPromises = [];
          
          for (let i = 0; i < BATCH_SIZE; i++) {
            const idToCheck = currentId + i;
            
            // Пытаемся получить полные данные
            const promise = fullContract.getPerfume(idToCheck)
              .then((p: any) => {
                if (p && p.name && p.name.length > 0) {
                  return {
                    tokenId: idToCheck,
                    name: p.name,
                    rarity: Number(p.rarity),
                    gender: Number(p.gender),
                    pType: Number(p.pType)
                  };
                }
                return null;
              })
              .catch(async (err) => {
                // Если полное декодирование упало (из-за string[3]), пробуем базовое
                if (err.message?.includes("decode") || err.message?.includes("UNEXPECTED_CONTINUE")) {
                   try {
                     const basicData = await basicContract.getPerfume(idToCheck);
                     if (basicData && basicData.name && basicData.name.length > 0) {
                       return {
                         tokenId: idToCheck,
                         name: basicData.name,
                         rarity: 0, // В базовом ABI нет редкости, ставим дефолт
                         gender: Number(basicData.gender),
                         pType: Number(basicData.pType)
                       };
                     }
                   } catch (e2) {
                     // Если и базовое упало, значит токен не существует или ошибка сети
                     return null;
                   }
                }
                // Если ошибка "Not minted", просто возвращаем null
                return null;
              });

            batchPromises.push(promise);
          }

          const batchResults = await Promise.all(batchPromises);
          
          let foundInBatch = false;
          for (const result of batchResults) {
            if (result) {
              results.push(result);
              foundInBatch = true;
              consecutiveEmpty = 0;
            } else {
              consecutiveEmpty++;
            }
          }

          if (results.length > 0 || currentId % 20 === 0) {
             setStatus(`Scanned up to ID ${currentId}. Found: ${results.length}`);
          }

          currentId += BATCH_SIZE;
        }

        const sorted = results.sort((a, b) => b.tokenId - a.tokenId);
        setItems(sorted);
        setStatus(`Done. Total found: ${sorted.length}`);
        
      } catch (e: any) {
        console.error("CRITICAL ERROR:", e);
        setStatus(`Error: ${e.shortMessage || e.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">Gallery</h1>
          <p className="text-white/50 mt-2">All fragrances minted on ScentProtocol.</p>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-xs text-white/30 font-mono">{status}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8 border border-white/10">
          <p>No fragrances found in scanned range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const style = RARITY_STYLES[item.rarity] || RARITY_STYLES[0];
            return (
              <Link 
                key={item.tokenId} 
                href={`/nft/${item.tokenId}`} 
                className={`block group relative rounded-2xl p-6 bg-slate-900/40 backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.glow}`}
              >
                {/* Header: ID & Rarity */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-white/30">#{item.tokenId}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
                    {RARITY_LABELS[item.rarity]}
                  </span>
                </div>
                
                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-6 line-clamp-2 group-hover:text-amber-300 transition-colors">
                  {item.name}
                </h3>
                
                {/* Footer: Gender & Type */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                    <span>{GENDER_ICONS[item.gender] || "⚲"}</span>
                    <span>{TYPE_LABELS[item.pType] || "Unknown"}</span>
                  </div>
                  {/* Optional: Add a small arrow icon */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
