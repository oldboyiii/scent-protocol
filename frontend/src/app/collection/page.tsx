"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
// Using v2 cache key to force refresh old empty data
const CACHE_KEY_PREFIX = "scent_collection_v2_"; 

// Interface for calldata generation
const INTERFACE = new ethers.Interface([
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)",
  "function balanceOf(address owner) view returns (uint256)"
]);

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

  // Manual parser with ownership check
  const parsePerfumeFromRawData = (rawData: string, tokenId: number, userAddress: string): MyNFT | null => {
    try {
      const hex = rawData.startsWith('0x') ? rawData.slice(2) : rawData;
      if (hex.length < 64 || parseInt(hex.substring(0, 64), 16) === 0) return null;

      // --- 1. EXTRACT NAME ---
      let name = "";
      try {
        const nameOffsetHex = hex.substring(0, 64);
        const nameOffset = parseInt(nameOffsetHex, 16) * 2;
        const lenHex = hex.substring(nameOffset, nameOffset + 64);
        const len = parseInt(lenHex, 16);
        
        if (len > 0 && len < 100) {
          const nameHex = hex.substring(nameOffset + 64, nameOffset + 64 + (len * 2));
          let decodedName = "";
          let isValid = true;
          for (let i = 0; i < len * 2; i += 2) {
            const byte = parseInt(nameHex.substr(i, 2), 16);
            if (byte >= 32 && byte <= 126) decodedName += String.fromCharCode(byte);
            else { isValid = false; break; }
          }
          if (isValid && decodedName.trim().length > 0) name = decodedName.trim();
        }
      } catch {}

      // Fallback heuristic for name
      if (!name) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substr(i, 2), 16);
        let currStr = "", candidates: string[] = [];
        for (const b of bytes) {
          if (b >= 32 && b <= 126) currStr += String.fromCharCode(b);
          else { if (currStr.length > 3) candidates.push(currStr); currStr = ""; }
        }
        if (currStr.length > 3) candidates.push(currStr);
        for (const c of candidates) {
          if (c.length === 40 && /^[0-9a-fA-F]+$/.test(c)) continue;
          if (/^\d+$/.test(c)) continue;
          if (c.includes(" ") && c.length > 3) { name = c; break; }
          if (!name && c.length > 5) name = c;
        }
      }
      if (!name || name.length < 2) return null;

      // --- 2. EXTRACT METADATA ---
      let gender = 0, pType = 0, rarity = 0, concentration = 0;
      
      const gVal = parseInt(hex.substring(64, 66), 16);
      if (gVal <= 2) gender = gVal;
      const pVal = parseInt(hex.substring(128, 130), 16);
      if (pVal <= 3) pType = pVal;

      // Rarity & Concentration from mixed slot at end
      const totalLen = hex.length;
      const mixedSlotStart = totalLen - 192; 
      
      if (mixedSlotStart > 0 && mixedSlotStart + 64 <= totalLen) {
         const mixedSlotHex = hex.substring(mixedSlotStart, mixedSlotStart + 64);
         
         const val1 = parseInt(mixedSlotHex.substring(60, 62), 16);
         const val2 = parseInt(mixedSlotHex.substring(62, 64), 16);
         
         if (val1 >= 0 && val1 <= 3) rarity = val1;
         else if (val2 >= 0 && val2 <= 3) rarity = val2;
         
         if (val1 >= 5 && val1 <= 30) concentration = val1;
         else if (val2 >= 5 && val2 <= 30) concentration = val2;
      }

      // --- 3. CHECK OWNERSHIP ---
      const creatorHex = hex.substring(totalLen - 64);
      const creatorAddr = "0x" + creatorHex.substring(24).toLowerCase();
      
      if (creatorAddr !== userAddress.toLowerCase()) {
        return null;
      }

      const topNotes: string[] = [];
      const heartNotes: string[] = [];
      const baseNotes: string[] = [];

      let createdAt = BigInt(0);
      try {
        const createdAtHex = hex.substring(totalLen - 128, totalLen - 64);
        createdAt = BigInt("0x" + createdAtHex);
      } catch {}

      return {
        tokenId,
        perfume: {
          name, gender, pType, concentration, rarity,
          topNotes, heartNotes, baseNotes,
          creator: creatorAddr, createdAt
        }
      };

    } catch (e) {
      console.warn(`Parse failed for ID ${tokenId}`, e);
      return null;
    }
  };

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setStatus("Connecting to Arc Network...");
        const signer = await getArcSigner();
        const provider = signer.provider;
        const userAddress = await signer.getAddress();
        setAddress(userAddress);

        // Check cache with NEW version key (v2) to force refresh
        const cacheKey = `${CACHE_KEY_PREFIX}${userAddress.toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        // Skip cache if it's empty array to force a real scan
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache && parsedCache.length > 0) {
            setMyNFTs(parsedCache);
            setStatus("Loaded from cache");
            setLoading(false);
            return;
          }
        }

        setStatus("Checking balance...");
        
        // Step 1: Get balance
        const balanceCalldata = INTERFACE.encodeFunctionData("balanceOf", [userAddress]);
        const balanceRaw = await provider.call({ to: NFT_CONTRACT_ADDRESS, data: balanceCalldata });
        const balance = Number(BigInt(balanceRaw));
        
        if (balance === 0) {
          setMyNFTs([]);
          sessionStorage.setItem(cacheKey, JSON.stringify([]));
          setStatus("No NFTs found");
          setLoading(false);
          return;
        }

        setStatus(`Found ${balance} NFT(s). Scanning ownership...`);
        
        // Step 2: Scan IDs
        const nfts: MyNFT[] = [];
        let foundCount = 0;
        const MAX_SCAN_ID = 500;
        const BATCH_SIZE = 3;
        
        for (let start = 1; start <= MAX_SCAN_ID && foundCount < balance; start += BATCH_SIZE) {
          const end = Math.min(start + BATCH_SIZE - 1, MAX_SCAN_ID);
          setStatus(`Scanning IDs ${start}-${end}... Found: ${foundCount}/${balance}`);
          
          const batchPromises = [];
          for (let id = start; id <= end; id++) {
            const calldata = INTERFACE.encodeFunctionData("getPerfume", [id]);
            batchPromises.push(
              provider.call({ to: NFT_CONTRACT_ADDRESS, data: calldata })
                .then(raw => parsePerfumeFromRawData(raw, id, userAddress))
                .catch(() => null)
            );
          }
          
          const results = await Promise.all(batchPromises);
          for (const r of results) {
            if (r) {
              nfts.push(r);
              foundCount++;
            }
          }
          
          // Delay to prevent RPC throttling
          await new Promise(r => setTimeout(r, 150));
        }

        const sorted = nfts.sort((a, b) => b.tokenId - a.tokenId);
        setMyNFTs(sorted);
        sessionStorage.setItem(cacheKey, JSON.stringify(sorted));
        setStatus(`Done. Found ${sorted.length} NFT(s)`);
        
      } catch (error) {
        console.error("Collection load failed:", error);
        setStatus("Error loading collection");
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
                            : <span className="text-white/30 text-xs italic">Available on detail page</span>
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
