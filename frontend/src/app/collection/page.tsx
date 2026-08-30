"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const CACHE_PREFIX = "scent_collection_";

const NFT_ABI = [
  "function getPerfume(uint256 tokenId) view returns (tuple(string name, uint8 gender, uint8 pType, uint8 concentration, uint8 rarity, string[] topNotes, string[] heartNotes, string[] baseNotes, address creator, uint256 createdAt))"
];

interface PerfumeData {
  name: string; 
  gender: number; 
  pType: number; 
  concentration: number; 
  rarity: number;
  topNotes: string[]; 
  heartNotes: string[]; 
  baseNotes: string[]; 
  creator: string; 
  createdAt: bigint;
}

interface MyNFT { 
  tokenId: number; 
  perfume?: PerfumeData; 
}

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; glow: string; hex: string }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

export default function CollectionPage() {
  const [myNFTs, setMyNFTs] = useState<MyNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const signer = await getArcSigner();
        const userAddress = await signer.getAddress();
        setAddress(userAddress);

        // Check cache for this specific user
        const cacheKey = `${CACHE_PREFIX}${userAddress.toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            setMyNFTs(JSON.parse(cached));
            setLoading(false);
            return;
          } catch {}
        }

        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer.provider);
        const nfts: MyNFT[] = [];
        const BATCH_SIZE = 10;
        const MAX_ID = 300;

        for (let start = 1; start <= MAX_ID; start += BATCH_SIZE) {
          const end = Math.min(start + BATCH_SIZE - 1, MAX_ID);
          const batchPromises = [];

          for (let id = start; id <= end; id++) {
            batchPromises.push(
              contract.getPerfume(id)
                .then((p: any) => {
                  if (p && p.name && p.creator?.toLowerCase() === userAddress.toLowerCase()) {
                    return {
                      tokenId: id,
                      perfume: {
                        name: p.name, gender: Number(p.gender), pType: Number(p.pType),
                        concentration: Number(p.concentration), rarity: Number(p.rarity),
                        topNotes: p.topNotes, heartNotes: p.heartNotes, baseNotes: p.baseNotes,
                        creator: p.creator, createdAt: p.createdAt
                      }
                    };
                  }
                  return null;
                })
                .catch(() => null)
            );
          }

          const batchResults = await Promise.all(batchPromises);
          
          // FIX: Explicit type predicate to satisfy TypeScript strictness
          nfts.push(...batchResults.filter((r): r is MyNFT => r !== null));
        }
        
        setMyNFTs(nfts);
        sessionStorage.setItem(cacheKey, JSON.stringify(nfts));
      } catch (error) {
        console.error("Collection load failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading your scents...</div>;
  if (!address) return <div className="min-h-screen flex items-center justify-center text-white">Connect wallet to see collection</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <h1 className="text-4xl font-bold text-white text-center">My Collection</h1>
      <p className="text-center text-white/50">{myNFTs.length} scent{myNFTs.length !== 1 ? "s" : ""} collected</p>

      {myNFTs.length === 0 ? (
        <div className="text-center py-20 glass-card-luxury rounded-2xl border border-white/10 p-8">
          <p className="mb-4">No scents in your collection yet.</p>
          <Link href="/mint" className="px-6 py-3 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-colors">Mint First Scent →</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myNFTs.map((nft) => {
            const rarity = nft.perfume?.rarity ?? 0;
            const style = RARITY_STYLE[rarity] || RARITY_STYLE[0];
            return (
              <div key={nft.tokenId} className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} hover:scale-[1.02] transition-transform duration-300`}>
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Scent #{nft.tokenId}</p>
                    <h3 className="text-xl font-bold text-white mt-1">{nft.perfume?.name || "Unknown Scent"}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
                    {["Common","Rare","Epic","Legendary"][rarity]}
                  </span>
                </div>
                
                {nft.perfume && (
                  <>
                    <div className="flex gap-2 text-xs mb-4">
                      <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/70">
                        {["Male","Female","Unisex"][nft.perfume.gender]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/70">
                        {["Parfum","EDP","EDT","EDC"][nft.perfume.pType]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/70">
                        {nft.perfume.concentration}%
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs text-white/40 uppercase tracking-wider">Top Notes</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {nft.perfume.topNotes.map(n => (
                            <span key={n} className="px-2 py-0.5 rounded bg-black/30 text-amber-200 text-xs border border-amber-500/30">{n}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-white/40 uppercase tracking-wider">Heart Notes</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {nft.perfume.heartNotes.map(n => (
                            <span key={n} className="px-2 py-0.5 rounded bg-black/30 text-rose-200 text-xs border border-rose-500/30">{n}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-white/40 uppercase tracking-wider">Base Notes</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {nft.perfume.baseNotes.map(n => (
                            <span key={n} className="px-2 py-0.5 rounded bg-black/30 text-emerald-200 text-xs border border-emerald-500/30">{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {!nft.perfume && <p className="text-sm text-white/40 italic">Metadata unavailable.</p>}

                <div className="mt-6 pt-4 border-t border-white/10">
                   <Link href={`/nft/${nft.tokenId}`} className="block w-full py-2.5 text-center bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition font-semibold">
                     Manage & Sell
                   </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
