"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const CACHE_KEY_PREFIX = "scent_collection_v11_";

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

interface PerfumeData {
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  creator: string;
  createdAt: number;
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

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_LABELS = ["Unisex", "Male", "Female"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const parseTokenURI = (uri: string): Omit<PerfumeData, 'createdAt'> & { createdAt: number } | null => {
  try {
    const base64 = uri.includes('base64,') ? uri.split('base64,')[1] : uri;
    const jsonStr = atob(base64);
    const data = JSON.parse(jsonStr);
    
    const attrs = data.attributes || [];
    const getAttr = (trait: string) => {
      const found = attrs.find((a: any) => a.trait_type === trait);
      return found ? found.value : null;
    };

    const levelName = getAttr('Level') || '';
    const rarityIndex = RARITY_LABELS.indexOf(levelName);
    const rarity = rarityIndex >= 0 ? rarityIndex : 0;

    const name = data.name?.replace('Arc Builder Credential #', '').trim() || 'Unknown';
    const gender = getAttr('Gender') || 0;
    const pType = getAttr('Type') || 0;
    const concentration = getAttr('Concentration') || 0;

    return {
      name,
      rarity,
      gender: typeof gender === 'string' ? GENDER_LABELS.indexOf(gender) : Number(gender),
      pType: typeof pType === 'string' ? TYPE_LABELS.indexOf(pType) : Number(pType),
      concentration: Number(concentration),
      topNotes: [],
      heartNotes: [],
      baseNotes: [],
      creator: '0x0000000000000000000000000000000000000000',
      createdAt: Date.now()
    };
  } catch (e) {
    console.warn("Failed to parse tokenURI:", e);
    return null;
  }
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

        const cacheKey = `${CACHE_KEY_PREFIX}${userAddress.toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMyNFTs(parsed);
              setStatus("Loaded from cache");
              setLoading(false);
              return;
            }
          } catch {}
        }

        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        setStatus("Checking balance...");
        let balance = 0;
        try {
          const raw = await contract.balanceOf(userAddress);
          balance = Number(raw);
        } catch {
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

        setStatus(`Found ${balance} NFT(s). Loading metadata...`);

        const nfts: MyNFT[] = [];
        let found = 0;
        const MAX_ID = 100; // Only scan first 100 IDs (since your tokens are within 1-44)

        for (let id = 1; id <= MAX_ID && found < balance; id++) {
          setStatus(`Loading NFT #${id}... (${found}/${balance})`);
          
          // Retry logic: try up to 3 times on RPC errors
          let success = false;
          for (let attempt = 0; attempt < 3 && !success; attempt++) {
            try {
              const uri = await contract.tokenURI(id);
              const parsed = parseTokenURI(uri);
              if (parsed) {
                nfts.push({ tokenId: id, perfume: parsed });
                found++;
                success = true;
              }
              break;
            } catch (err: any) {
              if (err.message?.includes("execution reverted")) {
                // Token doesn't exist, skip
                break;
              }
              if (attempt === 2) {
                console.warn(`Failed to load NFT #${id} after 3 attempts`);
              }
              // Wait and retry
              await new Promise(r => setTimeout(r, 500));
            }
          }
          
          // INCREASED DELAY: 300ms between requests to avoid RPC blocking
          await new Promise(r => setTimeout(r, 300));
        }

        const sorted = nfts.sort((a, b) => b.tokenId - a.tokenId);
        setMyNFTs(sorted);
        sessionStorage.setItem(cacheKey, JSON.stringify(sorted));
        setStatus(`Done. Found ${sorted.length} NFT(s)`);

      } catch (err: any) {
        setError(err.message || "Unknown error");
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
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400">Retry</button>
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
                    {RARITY_LABELS[rarity]}
                  </span>
                </div>
                
                {nft.perfume && (
                  <div className="flex gap-2 text-xs mb-4">
                    <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/70">
                      {GENDER_LABELS[nft.perfume.gender] || "Unisex"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/70">
                      {TYPE_LABELS[nft.perfume.pType] || "Parfum"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/70">
                      {nft.perfume.concentration}%
                    </span>
                  </div>
                )}

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
