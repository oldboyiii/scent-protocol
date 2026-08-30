"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const CACHE_KEY_PREFIX = "scent_collection_v5_"; 

// Full ABI for reliable decoding
const FULL_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)",
  "function balanceOf(address owner) view returns (uint256)"
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
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;
        const userAddress = await signer.getAddress();
        setAddress(userAddress);

        // Check cache
        const cacheKey = `${CACHE_KEY_PREFIX}${userAddress.toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            if (parsedCache && Array.isArray(parsedCache) && parsedCache.length > 0) {
              setMyNFTs(parsedCache);
              setStatus("Loaded from cache");
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Cache parse error", e);
          }
        }

        setStatus("Checking balance...");
        
        // Create contract instance for reliable decoding
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, FULL_ABI, provider);
        
        // Get balance first
        let balance = 0;
        try {
          const balanceRaw = await contract.balanceOf(userAddress);
          balance = Number(balanceRaw);
        } catch (e) {
          console.error("Balance check failed", e);
          setError("Failed to connect to network.");
          setLoading(false);
          return;
        }
        
        if (balance === 0) {
          setMyNFTs([]);
          sessionStorage.setItem(cacheKey, JSON.stringify([]));
          setStatus("No NFTs found");
          setLoading(false);
          return;
        }

        setStatus(`Found ${balance} NFT(s). Scanning ownership sequentially...`);
        
        // Sequential scanning for 100% reliability
        const nfts: MyNFT[] = [];
        let foundCount = 0;
        const MAX_SCAN_ID = 1000; 
        
        for (let id = 1; id <= MAX_SCAN_ID && foundCount < balance; id++) {
          setStatus(`Scanning ID ${id}... Found: ${foundCount}/${balance}`);
          
          try {
            // Use standard contract call - it decodes EVERYTHING correctly
            const perfume = await contract.getPerfume(id);
            
            // Check ownership using decoded data
            if (perfume.creator && perfume.creator.toLowerCase() === userAddress.toLowerCase()) {
              nfts.push({
                tokenId: id,
                perfume: {
                  name: perfume.name,
                  gender: Number(perfume.gender),
                  pType: Number(perfume.pType),
                  concentration: Number(perfume.concentration),
                  rarity: Number(perfume.rarity),
                  topNotes: Array.from(perfume.topNotes || []),
                  heartNotes: Array.from(perfume.heartNotes || []),
                  baseNotes: Array.from(perfume.baseNotes || []),
                  creator: perfume.creator,
                  createdAt: perfume.createdAt
                }
              });
              foundCount++;
            }
          } catch (err: any) {
            // Ignore "Not minted" errors
            if (!err.message?.includes("Not minted") && !err.message?.includes("revert")) {
              console.warn(`Error fetching ID ${id}:`, err.shortMessage);
            }
          }
          
          // Small delay to keep RPC happy during sequential calls
          await new Promise(r => setTimeout(r, 50)); 
        }

        const sorted = nfts.sort((a, b) => b.tokenId - a.tokenId);
        setMyNFTs(sorted);
        sessionStorage.setItem(cacheKey, JSON.stringify(sorted));
        setStatus(`Done. Found ${sorted.length} NFT(s)`);
        
      } catch (error: any) {
        console.error("Collection load failed:", error);
        setError(error.message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
      <p className="text-white/50 font-mono">{status}</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center">
      <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Collection</h2>
      <p className="text-white/60 mb-6 max-w-md">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400">
        Retry
      </button>
    </div>
  );

  if (!address) return <div className="min-h-screen flex items-center justify-center text-white">Connect wallet to see collection</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <h1 className="text-4xl font-bold text-white text-center">My Collection</h1>
      <p className="text-center text-white/50">{myNFTs.length} scent{myNFTs.length !== 1 ? "s" : ""} collected</p>
      <p className="text-center text-xs text-white/30 font-mono">{status}</p>

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
                        {["Unisex","Male","Female"][nft.perfume.gender]}
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
                          {nft.perfume.topNotes.length > 0 
                            ? nft.perfume.topNotes.map(n => <span key={n} className="px-2 py-0.5 rounded bg-black/30 text-amber-200 text-xs border border-amber-500/30">{n}</span>)
                            : <span className="text-white/30 text-xs italic">None</span>
                          }
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
    </div>
  );
}
