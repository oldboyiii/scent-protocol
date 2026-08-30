"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

const FULL_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

interface GalleryItem {
  tokenId: number;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  description?: string;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["⚲", "♂", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLES: Record<number, { 
  badge: string; 
  border: string;
  glow: string;
  bg: string;
}> = {
  0: { 
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", 
    border: "border-slate-500/30",
    glow: "hover:shadow-[0_0_15px_rgba(148,163,184,0.1)]",
    bg: "from-slate-900/80 to-slate-900/40"
  },
  1: { 
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", 
    border: "border-blue-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    bg: "from-blue-950/60 to-slate-900/60"
  },
  2: { 
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", 
    border: "border-purple-500/40",
    glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    bg: "from-purple-950/60 to-slate-900/60"
  },
  3: { 
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", 
    border: "border-amber-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]",
    bg: "from-amber-950/60 to-slate-900/60"
  },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, FULL_ABI, provider);

        const results: GalleryItem[] = [];
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 10; 
        let currentId = 1;

        setStatus(`Scanning IDs...`);

        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY && currentId < 500) {
          setProgress(currentId);
          
          try {
            const perfume = await contract.getPerfume(currentId);
            
            if (perfume && perfume.name && perfume.name.length > 0) {
              // Ethers v6: доступ по имени ИЛИ по индексу
              const name = String(perfume.name || perfume[0]);
              const gender = Number(perfume.gender !== undefined ? perfume.gender : perfume[1]);
              const pType = Number(perfume.pType !== undefined ? perfume.pType : perfume[2]);
              const rarity = Number(perfume.rarity !== undefined ? perfume.rarity : perfume[7]);
              
              console.log(`ID ${currentId}: name=${name}, rarity=${rarity}`);

              const topNotesStr = perfume.topNotes?.length > 0 
                ? `${perfume.topNotes[0]} based` 
                : TYPE_LABELS[pType];

              results.push({
                tokenId: currentId,
                name,
                rarity,
                gender,
                pType,
                description: topNotesStr
              });
              
              consecutiveEmpty = 0;
            } else {
              consecutiveEmpty++;
            }
          } catch (err: any) {
            if (err.message?.includes("Not minted") || err.message?.includes("revert")) {
              consecutiveEmpty++;
            } else {
              console.warn(`RPC issue at ID ${currentId}`, err.shortMessage || err.message);
              await new Promise(r => setTimeout(r, 1000)); 
              continue; 
            }
          }

          if (currentId % 5 === 0) {
             setStatus(`Scanned up to ID ${currentId}. Found: ${results.length}`);
          }

          currentId++;
          await new Promise(r => setTimeout(r, 100)); 
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
    };
    
    fetchGallery();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent">Gallery</h1>
          <p className="text-white/50 mt-2">All fragrances minted on ScentProtocol.</p>
        </div>
        <div className="text-right hidden md:block min-w-[200px]">
           <p className="text-xs text-white/30 font-mono mb-1">{status}</p>
           {loading && (
             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-amber-500 transition-all duration-300" 
                 style={{width: `${Math.min((progress / 500) * 100, 100)}%`}} 
               />
             </div>
           )}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card-luxury rounded-2xl p-8 border border-white/10">
          No fragrances found in scanned range.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const style = RARITY_STYLES[item.rarity] || RARITY_STYLES[0];
            return (
              <Link 
                key={item.tokenId} 
                href={`/nft/${item.tokenId}`} 
                className={`block group relative rounded-2xl p-6 bg-gradient-to-br ${style.bg} backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.glow}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-white/30">#{item.tokenId}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
                    {RARITY_LABELS[item.rarity]}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-300 transition-colors">
                  {item.name}
                </h3>

                <p className="text-xs text-white/40 mb-6 italic truncate">
                  {item.description} fragrance
                </p>
                
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <span title="Gender">{GENDER_ICONS[item.gender]}</span>
                    <span title="Type">{TYPE_LABELS[item.pType]}</span>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 text-sm">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
