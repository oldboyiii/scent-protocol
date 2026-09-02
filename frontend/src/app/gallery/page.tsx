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

type SortOption = "newest" | "oldest" | "name" | "rarity";

const RARITY_STYLE: Record<number, { 
  bg: string; 
  border: string; 
  badge: string; 
  glow: string;
}> = {
  0: {
    bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80",
    border: "border-slate-500/40",
    badge: "bg-slate-500/30 text-slate-200 border-slate-400/50",
    glow: "hover:shadow-[0_0_30px_rgba(148,163,184,0.15)]",
  },
  1: {
    bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80",
    border: "border-blue-400/50",
    badge: "bg-blue-500/30 text-blue-100 border-blue-400/50",
    glow: "hover:shadow-[0_0_40px_rgba(96,165,250,0.25)]",
  },
  2: {
    bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80",
    border: "border-purple-400/50",
    badge: "bg-purple-500/30 text-purple-100 border-purple-400/50",
    glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.25)]",
  },
  3: {
    bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90",
    border: "border-amber-400/60",
    badge: "bg-amber-500/40 text-amber-100 border-amber-400/60",
    glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.35)]",
  },
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);

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
        const maxId = 60;

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

        setItems(results);
      } catch (e) {
        console.error("Gallery fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sort-dropdown-container')) {
        setShowSort(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.tokenId - a.tokenId;
      case "oldest":
        return a.tokenId - b.tokenId;
      case "name":
        return a.name.localeCompare(b.name);
      case "rarity":
        return b.rarity - a.rarity;
      default:
        return 0;
    }
  });

  const rarityLabel = ["Common", "Rare", "Epic", "Legendary"];
  const genderIcon = ["", "♂", "♀"];
  const typeLabel = ["Parfum", "EDP", "EDT", "EDC"];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "name", label: "Name (A-Z)" },
    { value: "rarity", label: "Rarity (High to Low)" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent leading-[1.3] pb-3">
        Gallery
      </h1>
      <p className="text-white/50 mb-8">All fragrances minted on ScentProtocol.</p>

      {/* Sort Controls */}
      <div className="mb-6 flex items-center gap-3 relative sort-dropdown-container">
        <span className="text-white/50 text-sm">Sort by:</span>
        
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[160px] justify-between"
          >
            <span>
              {sortBy === "newest" && "Newest First"}
              {sortBy === "oldest" && "Oldest First"}
              {sortBy === "name" && "Name (A-Z)"}
              {sortBy === "rarity" && "Rarity (High to Low)"}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showSort ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSort && (
            <div className="absolute top-full mt-1 left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value as SortOption);
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                    sortBy === option.value ? "text-amber-400 bg-white/5" : "text-white/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <span className="text-white/30 text-sm ml-auto">
          {items.length} items
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card rounded-2xl p-8 border border-white/10">
          <p>No fragrances found on-chain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedItems.map((item) => {
            const style = RARITY_STYLE[item.rarity] || RARITY_STYLE[0];
            
            return (
              <Link key={item.tokenId} href={`/nft/${item.tokenId}`}>
                <div 
                  className={`group relative rounded-2xl p-5 backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                >
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-mono text-white/40">#{item.tokenId}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
                      {rarityLabel[item.rarity]}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white truncate mb-4 group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-white/50 border-t border-white/5 pt-3">
                    <span>{genderIcon[item.gender]}</span>
                    <span>{typeLabel[item.pType]}</span>
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-amber-400">
                      →
                    </span>
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
