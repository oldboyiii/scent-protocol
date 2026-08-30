"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { getArcSigner } from "@/utils/marketplace";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

// ABI только для событий Transfer и чтения метаданных
const NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
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

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
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

        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer.provider);
        
        // 1. Получаем все события Transfer, где получатель - текущий пользователь
        const filter = contract.filters.Transfer(null, userAddress);
        const logs = await contract.queryFilter(filter);
        
        // Извлекаем ID токенов и убираем дубликаты (если токен передавался несколько раз)
        const ownedTokenIds = [...new Set(logs.map((log: any) => Number(log.args.tokenId)))];

        const nfts: MyNFT[] = [];

        // 2. Загружаем метаданные для каждого принадлежащего токена
        for (const tokenId of ownedTokenIds) {
          try {
            const perfumeData = await contract.getPerfume(tokenId);
            nfts.push({
              tokenId,
              perfume: {
                name: perfumeData.name,
                gender: Number(perfumeData.gender),
                pType: Number(perfumeData.pType),
                concentration: Number(perfumeData.concentration),
                rarity: Number(perfumeData.rarity),
                topNotes: perfumeData.topNotes,
                heartNotes: perfumeData.heartNotes,
                baseNotes: perfumeData.baseNotes,
                creator: perfumeData.creator,
                createdAt: perfumeData.createdAt
              }
            });
          } catch (e) {
            console.warn(`Could not fetch metadata for token ${tokenId}`, e);
            nfts.push({ tokenId });
          }
        }
        
        setMyNFTs(nfts);
      } catch (error) {
        console.error("Failed to load collection:", error);
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
      <h1 className="text-4xl md:text-5xl font-bold text-white text-center leading-normal pb-1">My Collection</h1>
      <p className="text-center text-white/50">{myNFTs.length} scent{myNFTs.length !== 1 ? "s" : ""} collected</p>

      {myNFTs.length === 0 ? (
        <div className="text-center text-white/40 py-20 glass-card-luxury rounded-2xl border border-white/10 p-8">
          <p className="text-lg mb-4">No scents in your collection yet.</p>
          <Link href="/mint" className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors">Mint Your First Scent →</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myNFTs.map((nft) => {
            const rarity = nft.perfume?.rarity ?? 0;
            const style = RARITY_STYLE[rarity] || RARITY_STYLE[0];
            const hasFullData = !!nft.perfume;

            return (
              <div key={nft.tokenId} className={`group relative rounded-2xl p-6 space-y-4 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}>
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${style.hex}30, transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite", padding: "2px", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Scent #{nft.tokenId}</p>
                    <h3 className="text-xl font-bold text-white mt-1">{nft.perfume?.name || `Unknown Scent`}</h3>
                  </div>
                  <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>{["Common", "Rare", "Epic", "Legendary"][rarity]}</span>
                </div>

                {hasFullData && nft.perfume && (
                  <>
                    <div className="relative flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{["Male", "Female", "Unisex"][nft.perfume.gender]}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{["Parfum", "EDP", "EDT", "EDC"][nft.perfume.pType]}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{nft.perfume.concentration}%</span>
                    </div>
                    <div className="relative space-y-2 text-sm">
                      <div><span className="text-white/40 text-xs uppercase tracking-wider">Top Notes</span><div className="flex flex-wrap gap-1.5 mt-1">{nft.perfume.topNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-amber-200 text-xs border border-amber-500/30">{n}</span>))}</div></div>
                      <div><span className="text-white/40 text-xs uppercase tracking-wider">Heart Notes</span><div className="flex flex-wrap gap-1.5 mt-1">{nft.perfume.heartNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-rose-200 text-xs border border-rose-500/30">{n}</span>))}</div></div>
                      <div><span className="text-white/40 text-xs uppercase tracking-wider">Base Notes</span><div className="flex flex-wrap gap-1.5 mt-1">{nft.perfume.baseNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-emerald-200 text-xs border border-emerald-500/30">{n}</span>))}</div></div>
                    </div>
                  </>
                )}
                {!hasFullData && <p className="relative text-sm text-white/40">Metadata unavailable on-chain.</p>}
                <div className="relative pt-4 border-t border-white/10">
                   <Link href={`/nft/${nft.tokenId}`} className="block w-full py-2.5 text-center bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition font-semibold">Manage & Sell</Link>
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
