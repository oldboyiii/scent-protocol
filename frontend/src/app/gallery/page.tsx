"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";

const NFT_CONTRACT_ADDRESS = "0x8d456e033FF7220068CDc1C3F08D6BA6641D103e";
const GENESIS_CONTRACT_ADDRESS = "0x807dF79Ec16CF51C07e7B522175EB408D6dE247E";
const CACHE_KEY = "scentprotocol_gallery_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const GENESIS_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getPerfume",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "uint8", "name": "gender", "type": "uint8"},
        {"internalType": "uint8", "name": "pType", "type": "uint8"},
        {"internalType": "string[3]", "name": "topNotes", "type": "string[3]"},
        {"internalType": "string[3]", "name": "heartNotes", "type": "string[3]"},
        {"internalType": "string[3]", "name": "baseNotes", "type": "string[3]"},
        {"internalType": "uint8", "name": "concentration", "type": "uint8"},
        {"internalType": "uint8", "name": "rarity", "type": "uint8"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "bool", "name": "isGenesis", "type": "bool"}
      ],
      "internalType": "struct ScentProtocolGenesis.Perfume",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

interface GalleryItem {
  tokenId: number;
  contractAddress: string;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
  createdAt: number;
  creator: string;
}

type SortOption = "newest" | "oldest" | "name" | "rarity";
type CollectionFilter = "all" | "scents" | "genesis";

const RARITY_STYLE: Record<number, { 
  bg: string; 
  border: string; 
  badge: string; 
  text: string;
  glow: string;
  hex: string;
}> = {
  0: { 
    bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", 
    border: "border-slate-500/40", 
    badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", 
    text: "text-slate-200",
    glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]",
    hex: "#94a3b8"
  },
  1: { 
    bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", 
    border: "border-blue-400/50", 
    badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", 
    text: "text-blue-100",
    glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]",
    hex: "#60a5fa"
  },
  2: { 
    bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", 
    border: "border-purple-400/50", 
    badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", 
    text: "text-purple-100",
    glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]",
    hex: "#c084fc"
  },
  3: { 
    bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", 
    border: "border-amber-400/60", 
    badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", 
    text: "text-amber-100",
    glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]",
    hex: "#fbbf24"
  },
};

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["", "♂", "♀", ""];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<CollectionFilter>("all");
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    async function fetchGallery() {
      // Try cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log("✅ Loaded from cache:", data.length, "items");
            setItems(data);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Cache error:", e);
      }

      try {
        const w = window as any;
        const provider = w.ethereum 
          ? new ethers.BrowserProvider(w.ethereum) 
          : new ethers.JsonRpcProvider("https://rpc.mainnet.arc.io");
        
        const nftContract = getContract(provider);
        const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
        
        const results: GalleryItem[] = [];

        console.log("🔍 Fetching gallery data...");
        
        // OPTIMIZATION: Get actual nextTokenId instead of guessing
        let nextTokenId = 1;
        try {
          nextTokenId = Number(await nftContract.getNextTokenId());
        } catch (e) {
          nextTokenId = 100; // Fallback
        }
        
        // Fetch only existing tokens in parallel
        const mainPromises = [];
        for (let tokenId = 1; tokenId < nextTokenId; tokenId++) {
          mainPromises.push(
            nftContract.getPerfume(tokenId)
              .then((perfume: any) => {
                if (perfume && perfume.name) {
                  return {
                    tokenId,
                    contractAddress: NFT_CONTRACT_ADDRESS,
                    name: perfume.name,
                    rarity: Number(perfume.rarity),
                    gender: Number(perfume.gender),
                    pType: Number(perfume.pType),
                    concentration: Number(perfume.concentration),
                    topNotes: perfume.topNotes ? Array.from(perfume.topNotes).map((n: any) => String(n)) : [],
                    createdAt: Number(perfume.createdAt),
                    creator: perfume.creator,
                  };
                }
                return null;
              })
              .catch(() => null)
          );
        }
        
        const mainResults = await Promise.all(mainPromises);
        const validMain = mainResults.filter((item): item is GalleryItem => item !== null);
        results.push(...validMain);
        
        // Fetch Genesis (always 100 max)
        const genesisPromises = [];
        for (let tokenId = 1; tokenId <= 100; tokenId++) {
          genesisPromises.push(
            genesisContract.getPerfume(tokenId)
              .then((data: any) => {
                if (data && data.name) {
                  return {
                    tokenId,
                    contractAddress: GENESIS_CONTRACT_ADDRESS,
                    name: data.name,
                    rarity: Number(data.rarity),
                    gender: Number(data.gender),
                    pType: Number(data.pType),
                    concentration: Number(data.concentration),
                    topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [],
                    createdAt: Number(data.createdAt),
                    creator: data.creator,
                  };
                }
                return null;
              })
              .catch(() => null)
          );
        }
        
        const genesisResults = await Promise.all(genesisPromises);
        const validGenesis = genesisResults.filter((item): item is GalleryItem => item !== null);
        results.push(...validGenesis);
        
        console.log(`✅ Gallery loaded: ${results.length} total items found`);
        setItems(results);
        
        // Save to cache
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: results,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn("Cache save error:", e);
        }
      } catch (e) {
        console.error("Gallery fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowSort(false);
        setShowFilter(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredItems = items.filter(item => {
    if (filterBy === "all") return true;
    if (filterBy === "genesis") return item.contractAddress === GENESIS_CONTRACT_ADDRESS;
    return item.contractAddress === NFT_CONTRACT_ADDRESS;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.createdAt - a.createdAt;
      case "oldest":
        return a.createdAt - b.createdAt;
      case "name":
        return a.name.localeCompare(b.name);
      case "rarity":
        return b.rarity - a.rarity;
      default:
        return 0;
    }
  });

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "name", label: "Name (A-Z)" },
    { value: "rarity", label: "Rarity (High to Low)" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">
          Gallery
        </h1>
        <p className="text-center text-white/50">All fragrances minted on ScentProtocol.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 dropdown-container">
        <div className="relative">
          <button 
            onClick={() => { setShowFilter(!showFilter); setShowSort(false); }} 
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[160px] justify-between"
          >
            <span>
              {filterBy === "all" && "All Collections"}
              {filterBy === "scents" && "ScentProtocol"}
              {filterBy === "genesis" && "Genesis"}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showFilter ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showFilter && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl min-w-[180px]">
              <button onClick={() => { setFilterBy("all"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "all" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>All Collections</button>
              <button onClick={() => { setFilterBy("scents"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "scents" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>ScentProtocol</button>
              <button onClick={() => { setFilterBy("genesis"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "genesis" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>Genesis</button>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => { setShowSort(!showSort); setShowFilter(false); }} 
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
                <button key={option.value} onClick={() => { setSortBy(option.value as SortOption); setShowSort(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${sortBy === option.value ? "text-amber-400 bg-white/5" : "text-white/70"}`}>{option.label}</button>
              ))}
            </div>
          )}
        </div>

        <span className="text-white/30 text-sm ml-auto">{sortedItems.length} item{sortedItems.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <p className="text-lg mb-4">No NFTs found in the gallery yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map((item) => {
            const rarity = item.rarity;
            const isGenesis = item.contractAddress === GENESIS_CONTRACT_ADDRESS;
            const style = isGenesis 
              ? { 
                  bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", 
                  border: "border-amber-400/70", 
                  badge: "bg-amber-500/50 text-amber-50 border-amber-400/80", 
                  text: "text-amber-100",
                  glow: "shadow-[0_0_80px_rgba(251,191,36,0.5),0_0_120px_rgba(245,158,11,0.3)]",
                  hex: "#fbbf24"
                }
              : (RARITY_STYLE[rarity] || RARITY_STYLE[0]);

            return (
              <Link key={`${item.contractAddress}-${item.tokenId}`} href={`/nft/${item.tokenId}`}>
                <div className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}>
                  
                  {isGenesis && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                      background: `linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.5s linear infinite",
                    }} />
                  )}

                  {!isGenesis && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                      background: `linear-gradient(90deg, transparent, ${style.hex}30, transparent)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2s linear infinite",
                      padding: "2px",
                      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }} />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {!isGenesis && (
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
                      background: `linear-gradient(105deg, transparent 40%, ${style.hex}15 50%, transparent 60%)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.5s infinite",
                    }} />
                  )}

                  <div className="relative flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-white/40 uppercase tracking-wider">
                          {isGenesis ? "Genesis" : "Scent"} #{item.tokenId}
                        </p>
                        {isGenesis && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-amber-500/40 text-amber-50 border-amber-400/80 flex items-center gap-1">
                            <img src="/arc-logo.png" alt="Arc" className="w-3 h-3 inline-block" style={{ filter: "drop-shadow(0 0 2px rgba(251,191,36,0.8))" }} />
                            Genesis
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                  </div>

                  <div className="relative flex flex-wrap gap-2 text-xs mb-4">
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{GENDER_ICONS[item.gender] || "Unisex"}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{TYPE_LABELS[item.pType]}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{item.concentration}%</span>
                  </div>

                  {item.topNotes.length > 0 && (
                    <div className="relative space-y-2 text-sm mb-4">
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Top Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.topNotes.slice(0, 2).map((n) => (
                            <span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-amber-200 text-xs border border-amber-500/30">{n}</span>
                          ))}
                          {item.topNotes.length > 2 && (
                            <span className="px-2 py-0.5 text-xs text-white/40">+{item.topNotes.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-center justify-between pt-2">
                    <span className="text-sm text-white/50">View Details</span>
                    <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
