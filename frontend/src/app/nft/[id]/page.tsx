"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import ShareCard from "@/components/ShareCard";

const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const GENESIS_CONTRACT_ADDRESS = "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf";

const SCENT_ABI = [
  "function ownerOf(uint256) view returns (address)",
  "function getPerfume(uint256) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

const GENESIS_ABI = [
  "function ownerOf(uint256) view returns (address)",
  "function getPerfume(uint256) view returns (uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool isGenesis)"
];

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

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
    hex: "#94a3b8",
  },
  1: {
    bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80",
    border: "border-blue-400/50",
    badge: "bg-blue-500/30 text-blue-100 border-blue-400/50",
    text: "text-blue-100",
    glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]",
    hex: "#60a5fa",
  },
  2: {
    bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80",
    border: "border-purple-400/50",
    badge: "bg-purple-500/30 text-purple-100 border-purple-400/50",
    text: "text-purple-100",
    glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]",
    hex: "#c084fc",
  },
  3: {
    bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90",
    border: "border-amber-400/60",
    badge: "bg-amber-500/40 text-amber-100 border-amber-400/60",
    text: "text-amber-100",
    glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]",
    hex: "#fbbf24",
  },
};

function generateDescription(perfume: {
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
}): string {
  const genderLabel = GENDER[perfume.gender];
  const typeLabel = TYPE[perfume.pType];
  const rarityLabel = RARITY[perfume.rarity];

  const top = perfume.topNotes.join(", ");
  const heart = perfume.heartNotes.join(", ");
  const base = perfume.baseNotes.join(", ");

  const openings = [
    `A ${rarityLabel.toLowerCase()} ${genderLabel.toLowerCase()} ${typeLabel.toLowerCase()} that opens with the vibrant sparkle of ${top}.`,
    `This ${rarityLabel.toLowerCase()} composition for ${genderLabel.toLowerCase()}s begins with an invigorating burst of ${top}.`,
    `An exquisite ${typeLabel.toLowerCase()} where ${top} create an unforgettable first impression.`,
  ];

  const hearts = [
    `At its heart, ${heart} weave a sophisticated tapestry of emotion and depth.`,
    `The soul of this fragrance reveals itself through ${heart}, offering warmth and intrigue.`,
    `As it evolves, ${heart} emerge, lending an air of timeless elegance.`,
  ];

  const bases = [
    `Finally, the base settles into a rich embrace of ${base}, leaving a lasting signature.`,
    `The dry-down is anchored by ${base}, creating a memorable trail that lingers for hours.`,
    `A foundation of ${base} ensures this scent endures, evolving beautifully on the skin.`,
  ];

  const seed = perfume.name.length + perfume.topNotes.length + perfume.heartNotes.length;

  return `${openings[seed % openings.length]} ${hearts[seed % hearts.length]} ${bases[seed % bases.length]} Crafted at ${perfume.concentration}% concentration, ${perfume.name} is a true masterpiece of digital perfumery.`;
}

export default function NFTDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [perfume, setPerfume] = useState<any>(null);
  const [isGenesis, setIsGenesis] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) return;

    async function fetch() {
      try {
        let provider;
        if (typeof window !== "undefined" && (window as any).ethereum) {
          provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        }

        // Try ScentProtocol first
        try {
          const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, SCENT_ABI, provider);
          const data = await contract.getPerfume(id);
          
          setPerfume({
            name: data.name,
            gender: Number(data.gender),
            pType: Number(data.pType),
            topNotes: Array.from(data.topNotes || []) as string[],
            heartNotes: Array.from(data.heartNotes || []) as string[],
            baseNotes: Array.from(data.baseNotes || []) as string[],
            concentration: Number(data.concentration),
            rarity: Number(data.rarity),
            createdAt: Number(data.createdAt),
            creator: data.creator,
          });
          setIsGenesis(false);
          setLoading(false);
          return;
        } catch (e) {
          console.log(`Token ${id} not in ScentProtocol, trying Genesis...`);
        }

        // Try Genesis
        try {
          const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
          const data = await genesisContract.getPerfume(id);
          
          setPerfume({
            name: data.name,
            gender: Number(data.gender),
            pType: Number(data.pType),
            topNotes: Array.from(data.topNotes || []) as string[],
            heartNotes: Array.from(data.heartNotes || []) as string[],
            baseNotes: Array.from(data.baseNotes || []) as string[],
            concentration: Number(data.concentration),
            rarity: Number(data.rarity),
            createdAt: Number(data.createdAt),
            creator: data.creator,
          });
          setIsGenesis(true);
          setLoading(false);
          return;
        } catch (e) {
          console.log(`Token ${id} not in Genesis either`);
        }

        // If we get here, token not found in either contract
        setPerfume(null);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-10 bg-white/10 rounded-lg w-1/2" />
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
      </div>
    );
  }

  if (!perfume || !perfume.name) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Scent not found</h1>
        <p className="text-white/50 mb-8">Token #{id} does not exist or has not been minted yet.</p>
        <Link href="/collection" className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
          ← Back to Collection
        </Link>
      </div>
    );
  }

  const description = generateDescription(perfume);
  const style = RARITY_STYLE[perfume.rarity] || RARITY_STYLE[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <Link href="/collection" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
        ← Back to Collection
      </Link>

      <div className={`group relative rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500`}>
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${style.hex}30, transparent)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
            padding: "2px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${style.hex}15 50%, transparent 60%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s infinite",
          }}
        />

        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                {isGenesis ? "Genesis" : "Scent"} #{id}
              </p>
              {isGenesis && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-amber-500/30 text-amber-100 border-amber-400/50">
                  🏆 Genesis
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 leading-normal pb-1">
              {perfume.name}
            </h1>
          </div>
          <span className={`relative text-sm font-bold px-3 py-1.5 rounded-full border backdrop-blur-md ${style.badge}`}>
            {RARITY[perfume.rarity]}
          </span>
        </div>

        <div className="relative flex flex-wrap gap-3 text-sm mb-6">
          <span className="px-3 py-1 rounded-full bg-black/30 text-white/80 border border-white/10">{GENDER[perfume.gender]}</span>
          <span className="px-3 py-1 rounded-full bg-black/30 text-white/80 border border-white/10">{TYPE[perfume.pType]}</span>
          <span className="px-3 py-1 rounded-full bg-black/30 text-white/80 border border-white/10">{perfume.concentration}%</span>
        </div>

        <div className="relative space-y-4 mb-6">
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Top Notes</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {perfume.topNotes.map((n: string) => (
                <span key={n} className="px-3 py-1 rounded-md bg-black/30 text-amber-200 text-sm border border-amber-500/30">
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Heart Notes</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {perfume.heartNotes.map((n: string) => (
                <span key={n} className="px-3 py-1 rounded-md bg-black/30 text-rose-200 text-sm border border-rose-500/30">
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Base Notes</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {perfume.baseNotes.map((n: string) => (
                <span key={n} className="px-3 py-1 rounded-md bg-black/30 text-emerald-200 text-sm border border-emerald-500/30">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative bg-black/30 rounded-lg p-4 text-white/70 italic border-l-2 border-white/10 mb-6">
          {description}
        </div>

        <div className="relative text-sm text-white/40 space-y-1">
          <p>Creator: {perfume.creator}</p>
          <p>Minted: {new Date(Number(perfume.createdAt) * 1000).toLocaleString()}</p>
        </div>

        <div className="relative mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <Link href={`/nft/${id - 1}`} className={`text-sm text-white/50 hover:text-white transition-colors ${id <= 1 ? "invisible" : ""}`}>
            ← Previous
          </Link>
          <ShareCard tokenId={id} perfume={perfume} />
          <Link href={`/nft/${id + 1}`} className="text-sm text-white/50 hover:text-white transition-colors">
            Next →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
