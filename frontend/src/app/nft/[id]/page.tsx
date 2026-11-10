"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";
import { useAccount } from "wagmi";
import ShareCard from "@/components/ShareCard";
import ScentCrest from "@/components/ScentCrest";
import FitTitle from "@/components/FitTitle";
import ScentPlayer from "@/components/sound/ScentPlayer";

// ============================================================
// CONTRACT ADDRESSES & ABIs
// ============================================================
const MARKETPLACE_ADDRESS = "0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const GENESIS_CONTRACT_ADDRESS = "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6";
const MFW_CONTRACT_ADDRESS = "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20";
const VIRAL_CONTRACT_ADDRESS = "0x55A3527C87190fa8456De46247b52214287e8688";
const ALCHEMY_CONTRACT_ADDRESS = "0xe922c92423728b2092D61b6a9eD5ecA7d0e0B58D";

const GENESIS_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPerfume",
    outputs: [{
      components: [
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint8", name: "gender", type: "uint8" },
        { internalType: "uint8", name: "pType", type: "uint8" },
        { internalType: "string[3]", name: "topNotes", type: "string[3]" },
        { internalType: "string[3]", name: "heartNotes", type: "string[3]" },
        { internalType: "string[3]", name: "baseNotes", type: "string[3]" },
        { internalType: "uint8", name: "concentration", type: "uint8" },
        { internalType: "uint8", name: "rarity", type: "uint8" },
        { internalType: "uint256", name: "createdAt", type: "uint256" },
        { internalType: "address", name: "creator", type: "address" },
        { internalType: "bool", name: "isGenesis", type: "bool" }
      ],
      internalType: "struct ScentProtocolGenesis.Perfume",
      name: "",
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  }
];

const MFW_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPerfume",
    outputs: [{
      components: [
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint8", name: "gender", type: "uint8" },
        { internalType: "uint8", name: "pType", type: "uint8" },
        { internalType: "string[3]", name: "topNotes", type: "string[3]" },
        { internalType: "string[3]", name: "heartNotes", type: "string[3]" },
        { internalType: "string[3]", name: "baseNotes", type: "string[3]" },
        { internalType: "uint8", name: "concentration", type: "uint8" },
        { internalType: "uint8", name: "rarity", type: "uint8" },
        { internalType: "uint256", name: "createdAt", type: "uint256" },
        { internalType: "address", name: "creator", type: "address" },
        { internalType: "bool", name: "hasExclusiveBadge", type: "bool" }
      ],
      internalType: "struct ScentProtocolMFW2026.Perfume",
      name: "",
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  }
];

const VIRAL_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPerfume",
    outputs: [{
      components: [
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint8", name: "gender", type: "uint8" },
        { internalType: "uint8", name: "pType", type: "uint8" },
        { internalType: "string[3]", name: "topNotes", type: "string[3]" },
        { internalType: "string[3]", name: "heartNotes", type: "string[3]" },
        { internalType: "string[3]", name: "baseNotes", type: "string[3]" },
        { internalType: "uint8", name: "concentration", type: "uint8" },
        { internalType: "uint8", name: "rarity", type: "uint8" },
        { internalType: "uint256", name: "createdAt", type: "uint256" },
        { internalType: "address", name: "creator", type: "address" }
      ],
      name: "",
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  }
];

const ALCHEMY_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "hybridId", type: "uint256" }],
    name: "getHybridPerfume",
    outputs: [{
      components: [
        { internalType: "uint256", name: "hybridId", type: "uint256" },
        { internalType: "uint256", name: "parentTokenId1", type: "uint256" },
        { internalType: "uint256", name: "parentTokenId2", type: "uint256" },
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint8", name: "gender", type: "uint8" },
        { internalType: "uint8", name: "pType", type: "uint8" },
        { internalType: "string[3]", name: "topNotes", type: "string[3]" },
        { internalType: "string[3]", name: "heartNotes", type: "string[3]" },
        { internalType: "string[3]", name: "baseNotes", type: "string[3]" },
        { internalType: "uint8", name: "concentration", type: "uint8" },
        { internalType: "uint8", name: "rarity", type: "uint8" },
        { internalType: "uint256", name: "createdAt", type: "uint256" },
        { internalType: "address", name: "alchemist", type: "address" }
      ],
      name: "",
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  }
];

const MARKETPLACE_ABI = [
  "function makeOffer(address nft, uint256 tokenId, uint256 price, uint256 expiry)",
  "function cancelOffer(address nft, uint256 tokenId)",
  "function acceptOffer(address nft, uint256 tokenId, address offerer, uint256 minPrice)",
  "function getOffer(address nft, uint256 tokenId, address offerer) view returns (uint256 price, uint256 expiry, uint16 feeBps)",
  "function listings(address, uint256) view returns (address seller, uint256 price, uint256 expiry, uint16 feeBps)",
  "event OfferMade(address indexed nft, uint256 indexed tokenId, address indexed offerer, uint256 price, uint256 expiry)",
  "event OfferCancelled(address indexed nft, uint256 indexed tokenId, address indexed offerer, uint256 price)",
  "event OfferAccepted(address indexed nft, uint256 indexed tokenId, address seller, address indexed offerer, uint256 price, uint256 fee, uint256 royalty)"
];

const USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

// ============================================================
// CONSTANTS & STYLES
// ============================================================
const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

const GENESIS_STYLE = { bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", border: "border-amber-400/70", badge: "bg-amber-500/50 text-amber-50 border-amber-400/80", text: "text-amber-100", glow: "shadow-[0_0_80px_rgba(251,191,36,0.5),0_0_120px_rgba(245,158,11,0.3)]", hex: "#fbbf24" };
const MFW_STYLE = { bg: "from-purple-900/90 via-indigo-900/80 to-purple-950/90", border: "border-purple-500/50", badge: "bg-purple-500/50 text-purple-50 border-purple-400/80", text: "text-purple-100", glow: "shadow-[0_0_80px_rgba(168,85,247,0.5),0_0_120px_rgba(168,85,247,0.3)]", hex: "#a855f7" };
const VIRAL_STYLE = { bg: "from-fuchsia-900/80 via-pink-900/70 to-purple-900/80", border: "border-fuchsia-500/50", badge: "bg-fuchsia-500/40 text-fuchsia-50 border-fuchsia-400/80", text: "text-fuchsia-100", glow: "shadow-[0_0_80px_rgba(217,70,239,0.5),0_0_120px_rgba(217,70,239,0.3)]", hex: "#d946ef" };
const HYBRID_STYLE = { bg: "from-cyan-900/80 via-teal-900/70 to-slate-900/80", border: "border-cyan-500/50", badge: "bg-cyan-500/40 text-cyan-100 border-cyan-400/60", text: "text-cyan-100", glow: "shadow-[0_0_80px_rgba(34,211,238,0.5),0_0_120px_rgba(34,211,238,0.3)]", hex: "#22d3ee" };

const MFWBottleIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="10" y="6" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
    <path d="M8 9C8 9 7 11 7 13V20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20V13C17 11 16 9 16 9H8Z" fill="currentColor" opacity="0.6"/>
    <path d="M10 12V19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function generateDescription(perfume: any): string {
  const genderLabel = GENDER[perfume.gender];
  const typeLabel = TYPE[perfume.pType];
  const rarityLabel = RARITY[perfume.rarity];
  const top = perfume.topNotes.join(", ");
  const heart = perfume.heartNotes.join(", ");
  const base = perfume.baseNotes.join(", ");
  const seed = perfume.name.length + perfume.topNotes.length + perfume.heartNotes.length;
  
  const openings = [
    `A ${rarityLabel.toLowerCase()} ${genderLabel.toLowerCase()} ${typeLabel.toLowerCase()} that opens with the vibrant sparkle of ${top}.`,
    `This ${rarityLabel.toLowerCase()} composition for ${genderLabel.toLowerCase()}s begins with an invigorating burst of ${top}.`,
    `An exquisite ${typeLabel.toLowerCase()} where ${top} create an unforgettable first impression.`
  ];
  const hearts = [
    `At its heart, ${heart} weave a sophisticated tapestry of emotion and depth.`,
    `The soul of this fragrance reveals itself through ${heart}, offering warmth and intrigue.`,
    `As it evolves, ${heart} emerge, lending an air of timeless elegance.`
  ];
  const bases = [
    `Finally, the base settles into a rich embrace of ${base}, leaving a lasting signature.`,
    `The dry-down is anchored by ${base}, creating a memorable trail that lingers for hours.`,
    `A foundation of ${base} ensures this scent endures, evolving beautifully on the skin.`
  ];

  return `${openings[seed % openings.length]} ${hearts[seed % hearts.length]} ${bases[seed % bases.length]} Crafted at ${perfume.concentration}% concentration, ${perfume.name} is a true masterpiece of digital perfumery.`;
}

// ============================================================
// OFFER FETCHING HELPERS (Robust RPC fallback)
// ============================================================
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.io";
const OFFER_TOPIC = ethers.id("OfferMade(address,uint256,address,uint256,uint256)");
const offerersKey = (nft: string, id: string | number) => `scent-offerers:${nft.toLowerCase()}:${id}`;

function readCachedOfferers(nft: string, id: string | number): string[] {
  try {
    return JSON.parse(localStorage.getItem(offerersKey(nft, id)) || "[]");
  } catch {
    return [];
  }
}

function rememberOfferer(nft: string, id: string | number, offerer: string) {
  const list = new Set(readCachedOfferers(nft, id).map((a) => a.toLowerCase()));
  list.add(offerer.toLowerCase());
  localStorage.setItem(offerersKey(nft, id), JSON.stringify(Array.from(list)));
}

async function fetchOfferers(nft: string, id: string | number, provider: ethers.Provider): Promise<string[]> {
  const found = new Set<string>(readCachedOfferers(nft, id).map((a) => a.toLowerCase()));

  try {
    const params = new URLSearchParams({
      module: "logs", action: "getLogs", fromBlock: "0", toBlock: "latest", address: MARKETPLACE_ADDRESS,
      topic0: OFFER_TOPIC, topic0_1_opr: "and", topic0_2_opr: "and",
      topic1: ethers.zeroPadValue(ethers.getAddress(nft), 32), topic1_2_opr: "and",
      topic2: ethers.zeroPadValue(ethers.toBeHex(BigInt(id)), 32),
    });
    const res = await fetch(`${EXPLORER_URL}/api?${params}`);
    const json = await res.json();
    if (Array.isArray(json.result)) {
      for (const log of json.result) found.add(("0x" + String(log.topics[3]).slice(26)).toLowerCase());
    }
  } catch {
    /* blocked or offline: fall through to the RPC */
  }

  try {
    const latest = await provider.getBlockNumber();
    const CHUNK = 2000;
    const WINDOW = 100_000;
    const topics = [OFFER_TOPIC, ethers.zeroPadValue(ethers.getAddress(nft), 32), ethers.zeroPadValue(ethers.toBeHex(BigInt(id)), 32)];
    const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let end = latest; end > latest - WINDOW; end -= CHUNK) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const logs = await provider.getLogs({ address: MARKETPLACE_ADDRESS, fromBlock: Math.max(0, end - CHUNK + 1), toBlock: end, topics });
          for (const log of logs) found.add(("0x" + log.topics[3].slice(26)).toLowerCase());
          break;
        } catch {
          await pause(300);
        }
      }
      await pause(120);
    }
  } catch {
    /* ignore */
  }

  localStorage.setItem(offerersKey(nft, id), JSON.stringify(Array.from(found)));
  return Array.from(found).map((a) => ethers.getAddress(a));
}

function normalizePerfume(data: any) {
  return {
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
  };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractParam = searchParams.get("contract");
  const { address: userAddress } = useAccount();
  
  const id = Number(params.id);
  const [perfume, setPerfume] = useState<any>(null);
  const [isGenesis, setIsGenesis] = useState(false);
  const [isMFW, setIsMFW] = useState(false);
  const [isViral, setIsViral] = useState(false);
  const [isHybrid, setIsHybrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isOwner, setIsOwner] = useState(false);
  const [offers, setOffers] = useState<{ offerer: string; price: bigint; expiry: number }[]>([]);
  const [myOffer, setMyOffer] = useState<{ price: bigint; expiry: number; expired: boolean } | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDays, setOfferDays] = useState(30); // ✅ Changed default to 30 days
  const [offerLoading, setOfferLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "offers">("details");
  const [showCrestModal, setShowCrestModal] = useState(false);

  // Fetch NFT data
  useEffect(() => {
    if (!id || isNaN(id)) return;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const provider = (typeof window !== "undefined" && (window as any).ethereum)
          ? new ethers.BrowserProvider((window as any).ethereum)
          : new ethers.JsonRpcProvider("https://rpc.mainnet.arc.io");

        let found = false;

        if (contractParam?.toLowerCase() === MFW_CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const data = await new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, provider).getPerfume(id);
            if (data && data.name) {
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
                creator: data.creator 
              });
              setIsMFW(true); 
              setIsGenesis(false); 
              setIsViral(false); 
              setIsHybrid(false);
              found = true;
            }
          } catch (e) {}
        } else if (contractParam?.toLowerCase() === GENESIS_CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const data = await new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider).getPerfume(id);
            if (data && data.name) {
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
                creator: data.creator 
              });
              setIsGenesis(true); 
              setIsMFW(false); 
              setIsViral(false); 
              setIsHybrid(false);
              found = true;
            }
          } catch (e) {}
        } else if (contractParam?.toLowerCase() === VIRAL_CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const data = await new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, provider).getPerfume(id);
            if (data && data.name) {
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
                creator: data.creator 
              });
              setIsViral(true); 
              setIsGenesis(false); 
              setIsMFW(false); 
              setIsHybrid(false);
              found = true;
            }
          } catch (e) {}
        } else if (contractParam?.toLowerCase() === ALCHEMY_CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const data = await new ethers.Contract(ALCHEMY_CONTRACT_ADDRESS, ALCHEMY_ABI, provider).getHybridPerfume(id);
            if (data && data.name) {
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
                creator: data.alchemist 
              });
              setIsHybrid(true); 
              setIsGenesis(false); 
              setIsMFW(false); 
              setIsViral(false);
              found = true;
            }
          } catch (e) {}
        }

        if (!found) {
          try {
            const data = await getContract(provider).getPerfume(id);
            if (data && data.name) {
              setPerfume(normalizePerfume(data));
              setIsGenesis(false); 
              setIsMFW(false); 
              setIsViral(false); 
              setIsHybrid(false);
              found = true;
            }
          } catch (e) {}
        }

        if (!found) {
          setError("Token not found in any contract");
          setPerfume(null);
        }
      } catch (e) {
        console.error("Global fetch error:", e);
        setError("Failed to fetch data");
        setPerfume(null);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id, contractParam]);

  // Check ownership
  useEffect(() => {
    async function checkOwnership() {
      if (!userAddress || !contractParam || !id) return;
      try {
        const provider = (typeof window !== "undefined" && (window as any).ethereum)
          ? new ethers.BrowserProvider((window as any).ethereum)
          : new ethers.JsonRpcProvider("https://rpc.mainnet.arc.io");
        const owner = await new ethers.Contract(contractParam, ERC721_ABI, provider).ownerOf(id);
        setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());
      } catch (e) {
        setIsOwner(false);
      }
    }
    checkOwnership();
  }, [userAddress, contractParam, id]);

  // Fetch active offers (Robust version)
  useEffect(() => {
    async function fetchOffersData() {
      if (!contractParam || !id) return;
      try {
        const provider: ethers.Provider = (typeof window !== "undefined" && (window as any).ethereum)
          ? new ethers.BrowserProvider((window as any).ethereum)
          : new ethers.JsonRpcProvider("https://rpc.mainnet.arc.io");
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
        const offerers = await fetchOfferers(contractParam, id, provider);
        const now = Math.floor(Date.now() / 1000);
        const active: { offerer: string; price: bigint; expiry: number }[] = [];
        let mine: { price: bigint; expiry: number; expired: boolean } | null = null;

        await Promise.all(offerers.map(async (offerer) => {
          try {
            const offer = await marketplace.getOffer(contractParam, id, offerer);
            if (offer.price <= 0n) return;
            const expiry = Number(offer.expiry);
            if (expiry > now) active.push({ offerer, price: offer.price, expiry });
            if (userAddress && offerer.toLowerCase() === userAddress.toLowerCase()) {
              mine = { price: offer.price, expiry, expired: expiry <= now };
            }
          } catch { /* skip */ }
        }));

        active.sort((x, y) => (x.price < y.price ? 1 : -1));
        setOffers(active);
        setMyOffer(mine);
      } catch (e) {
        console.error("Failed to fetch offers:", e);
      }
    }
    fetchOffersData();
  }, [contractParam, id, userAddress]);

  // Offer Handlers
  const handleMakeOffer = async () => {
    if (!userAddress || !contractParam || !id || !offerPrice) return;
    setOfferLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const priceWei = ethers.parseUnits(offerPrice, 6);
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (offerDays * 86400);
      
      if (await usdc.balanceOf(userAddress) < priceWei) throw new Error("Insufficient USDC balance");
      if (await usdc.allowance(userAddress, MARKETPLACE_ADDRESS) < priceWei) {
        await (await usdc.approve(MARKETPLACE_ADDRESS, priceWei)).wait();
      }
      
      await (await marketplace.makeOffer(contractParam, id, priceWei, expiryTimestamp)).wait();
      rememberOfferer(contractParam, id, userAddress);
      alert(`Offer sent. ${offerPrice} USDC is held in escrow by the marketplace until the owner accepts it. You can cancel any time for a full refund.`);
      setOfferPrice("");
      window.location.reload(); 
    } catch (error: any) {
      alert(`Failed to make offer: ${error.message || error.reason}`);
    } finally {
      setOfferLoading(false);
    }
  };

  const handleAcceptOffer = async (offerer: string, price: bigint) => {
    if (!userAddress || !contractParam || !id) return;
    if (!confirm(`Accept offer of ${ethers.formatUnits(price, 6)} USDC?`)) return;
    setOfferLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const nftContract = new ethers.Contract(contractParam, ERC721_ABI, signer);
      
      if (!(await nftContract.isApprovedForAll(userAddress, MARKETPLACE_ADDRESS))) {
        await (await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true)).wait();
      }
      await (await marketplace.acceptOffer(contractParam, id, offerer, price)).wait();
      alert("Offer accepted successfully!");
      router.push("/collection");
    } catch (error: any) {
      alert(`Failed to accept offer: ${error.message || error.reason}`);
    } finally {
      setOfferLoading(false);
    }
  };

  const handleCancelOffer = async () => {
    if (!userAddress || !contractParam || !id) return;
    if (!confirm("Cancel your active offer?")) return;
    setOfferLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      await (await marketplace.cancelOffer(contractParam, id)).wait();
      alert("Offer cancelled successfully!");
      window.location.reload();
    } catch (error: any) {
      alert(`Failed to cancel offer: ${error.message || error.reason}`);
    } finally {
      setOfferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-6 bg-white/10 rounded-lg w-24" />
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error || !perfume || !perfume.name) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Scent not found</h1>
        <p className="text-white/50 mb-6">Token #{id} does not exist or has not been minted yet.</p>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <button onClick={() => router.back()} className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">← Back</button>
      </div>
    );
  }

  const description = generateDescription(perfume);
  const labelColor = isHybrid ? 'text-cyan-300/80' : isViral ? 'text-fuchsia-300/80' : isGenesis ? 'text-amber-300/80' : isMFW ? 'text-purple-300/80' : 'text-white/40';
  const descBg = isHybrid ? 'bg-cyan-950/40 border-cyan-400/60' : isViral ? 'bg-fuchsia-950/40 border-fuchsia-400/60' : isGenesis ? 'bg-amber-950/40 border-amber-400/60' : isMFW ? 'bg-purple-950/40 border-purple-400/60' : 'bg-black/30 border-white/10';
  const style = isHybrid ? HYBRID_STYLE : isViral ? VIRAL_STYLE : isMFW ? MFW_STYLE : (isGenesis ? GENESIS_STYLE : (RARITY_STYLE[perfume.rarity] || RARITY_STYLE[0]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 relative z-10">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">
        ← Back
      </button>

      <div className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500`}>
        
        {(isGenesis || isMFW || isViral || isHybrid) && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: `linear-gradient(90deg, transparent, rgba(${isHybrid ? '34,211,238' : isViral ? '217,70,239' : isMFW ? '168,85,247' : '251,191,36'},0.3), transparent)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s linear infinite",
          }} />
        )}

        {!isGenesis && !isMFW && !isViral && !isHybrid && (
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

        <div className="relative flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="relative cursor-pointer group/crest"
              onClick={() => setShowCrestModal(true)}
              title="Click to view details"
            >
              <ScentCrest 
                seed={`${perfume.creator}-${perfume.name}`} 
                name={perfume.name} 
                rarity={perfume.rarity} 
                size={64} 
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/crest:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
            
            <div>
              {/* ✅ Ultra-compact badges for special collections to match V3 height */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  {isHybrid ? "HYBRID" : isViral ? "VIRAL" : isGenesis ? "GENESIS" : isMFW ? "MFW 2026" : "SCENT"} #{id}
                </p>
                {isGenesis && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-md bg-amber-500/40 text-amber-50 border-amber-400/80 flex items-center gap-1">
                    <svg viewBox="0 0 24 16" className="w-2.5 h-2"><path d="M2 14 Q12 2 22 14" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                    Genesis
                  </span>
                )}
                {isMFW && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-md bg-purple-500/40 text-purple-50 border-purple-400/80 flex items-center gap-1">
                    <MFWBottleIcon className="w-2.5 h-2.5" /> MFW 2026
                  </span>
                )}
                {isViral && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-md bg-fuchsia-500/40 text-fuchsia-50 border-fuchsia-400/80 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Viral
                  </span>
                )}
                {isHybrid && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-md bg-cyan-500/40 text-cyan-50 border-cyan-400/80 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3v6l-6 9h18l-6-9V3H9z"/><path d="M9 9h6"/></svg>
                    Hybrid
                  </span>
                )}
              </div>
              
              <FitTitle 
                text={perfume.name} 
                className="font-bold text-white leading-tight"
                maxRem={1.875}
              />
            </div>
          </div>
          <span className={`relative text-sm font-bold px-3 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
            {RARITY[perfume.rarity]}
          </span>
        </div>

        <div className="relative flex flex-wrap gap-2 text-sm mb-4">
          <span className="px-3 py-1 rounded-full bg-black/30 text-white/80 border border-white/10">{GENDER[perfume.gender]}</span>
          <span className="px-3 py-1 rounded-full bg-black/30 text-white/80 border border-white/10">{TYPE[perfume.pType]}</span>
          <span className="px-3 py-1 rounded-full bg-black/30 text-white/80 border border-white/10">{perfume.concentration}%</span>
        </div>

        <div className="relative space-y-3 mb-4">
          <div>
            <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Top Notes</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {perfume.topNotes.map((n: string) => (
                <span key={n} className="px-2.5 py-1 rounded-md bg-black/30 text-amber-200 text-sm border border-amber-500/30">{n}</span>
              ))}
            </div>
          </div>
          <div>
            <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Heart Notes</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {perfume.heartNotes.map((n: string) => (
                <span key={n} className="px-2.5 py-1 rounded-md bg-black/30 text-rose-200 text-sm border border-rose-500/30">{n}</span>
              ))}
            </div>
          </div>
          <div>
            <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Base Notes</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {perfume.baseNotes.map((n: string) => (
                <span key={n} className="px-2.5 py-1 rounded-md bg-black/30 text-emerald-200 text-sm border border-emerald-500/30">{n}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={`relative rounded-lg p-4 text-white/70 italic border-l-2 mb-4 text-sm leading-relaxed ${descBg}`}>
          {description}
        </div>

        {/* ✅ Compact full player with volume control, without duplicate notes grid */}
        <div className="mb-2">
          <ScentPlayer
            variant="full"
            hideNotes={true}
            tokenId={id}
            perfume={{
              name: perfume.name,
              rarity: perfume.rarity,
              creator: perfume.creator || "",
              topNotes: perfume.topNotes || [],
              heartNotes: perfume.heartNotes || [],
              baseNotes: perfume.baseNotes || [],
            }}
          />
        </div>

        {/* ✅ Ultra-compact footer metadata for special collections */}
        <div className="relative text-xs text-white/40 space-y-0.5">
          <p>Creator: {perfume.creator}</p>
          <p>Minted: {new Date(Number(perfume.createdAt) * 1000).toLocaleString()}</p>
          {isGenesis && (
            <p className="text-amber-300 font-bold flex items-center gap-1.5">
              <img src="/arc-logo.png" alt="Arc" className="w-3.5 h-3.5 inline-block" style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.6))" }} />
              Arc Mainnet Genesis
            </p>
          )}
          {isMFW && (
            <p className="text-purple-300 font-bold flex items-center gap-1.5">
              <MFWBottleIcon className="w-3.5 h-3.5" /> Milan Fashion Week 2026
            </p>
          )}
          {isViral && (
            <p className="text-fuchsia-300 font-bold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Viral Scent Experiment
            </p>
          )}
          {isHybrid && (
            <p className="text-cyan-300 font-bold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3v6l-6 9h18l-6-9V3H9z"/><path d="M9 9h6"/></svg>
              Scent Alchemy Hybrid
            </p>
          )}
        </div>

        <div className="relative mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <Link href={`/nft/${id - 1}`} className={`text-sm text-white/50 hover:text-white transition-colors ${id <= 1 ? "invisible" : ""}`}>
            ← Previous
          </Link>
          <ShareCard tokenId={id} perfume={perfume!} contractAddress={contractParam || ""} />
          <Link href={`/nft/${id + 1}`} className="text-sm text-white/50 hover:text-white transition-colors">
            Next →
          </Link>
        </div>
      </div>

      {/* Marketplace Actions Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex gap-4 border-b border-white/10 mb-4">
          <button 
            onClick={() => setActiveTab("details")}
            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "details" ? "text-amber-400" : "text-white/50 hover:text-white"}`}
          >
            Details
            {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
          <button 
            onClick={() => setActiveTab("offers")}
            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "offers" ? "text-amber-400" : "text-white/50 hover:text-white"}`}
          >
            Offers ({offers.length})
            {activeTab === "offers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
        </div>

        {activeTab === "details" && (
          <div className="text-white/60 text-sm space-y-3">
            <p>This NFT is part of the ScentProtocol ecosystem. You can view its traits, rarity, and origin above.</p>
            {isOwner && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-300 font-medium mb-2 text-base">You own this NFT</p>
                <p className="text-sm mb-3">You can list this item for sale on the marketplace or manage incoming offers in the "Offers" tab.</p>
                <Link href={`/marketplace`} className="inline-block px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors">
                  Go to Marketplace
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "offers" && (
          <div className="space-y-4">
            {!isOwner ? (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Make an Offer</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Your USDC is held in escrow by the marketplace contract, not sent to the owner. The owner is paid only if they accept
                  your offer, and you can cancel at any time for a full refund.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Price (USDC)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="e.g. 5.00"
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Valid (Days)</label>
                    {/* ✅ Updated to include 30, 60, 90 days */}
                    <select 
                      value={offerDays}
                      onChange={(e) => setOfferDays(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value={7}>7 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleMakeOffer}
                  disabled={offerLoading || !offerPrice || Number(offerPrice) <= 0}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {offerLoading ? "Processing..." : "Submit Offer"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Incoming Offers</h3>
                <p className="text-xs text-white/50">The bidder's USDC is already held in escrow. Accepting pays you the price minus the marketplace fee and any creator royalty.</p>
                {offers.length === 0 ? (
                  <p className="text-white/50 text-sm py-3 text-center bg-white/5 rounded-lg border border-white/10">No active offers for this NFT yet.</p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((offer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="text-base font-bold text-emerald-400">{ethers.formatUnits(offer.price, 6)} USDC</p>
                          <p className="text-xs text-white/50">
                            From: {offer.offerer.slice(0, 6)}...{offer.offerer.slice(-4)} • Exp: {new Date(offer.expiry * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleAcceptOffer(offer.offerer, offer.price)}
                          disabled={offerLoading}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          {offerLoading ? "Accepting..." : "Accept"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* ✅ Show cancel button for the user's own offer (even if expired) */}
            {userAddress && myOffer && (
              <div className="pt-3 border-t border-white/10">
                <button 
                  onClick={handleCancelOffer}
                  disabled={offerLoading}
                  className="w-full py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {myOffer.expired ? "Offer expired: cancel and get" : "Cancel my offer and get"} {ethers.formatUnits(myOffer.price, 6)} USDC back
                </button>
                {myOffer.expired && (
                  <p className="mt-2 text-xs text-white/50">An expired offer still holds your USDC in escrow until you cancel it.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCrestModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pt-20"
          onClick={() => setShowCrestModal(false)}
        >
          <div 
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowCrestModal(false)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 z-10"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 flex flex-col items-center justify-center shadow-2xl">
              <ScentCrest 
                seed={`${perfume.creator}-${perfume.name}`} 
                name={perfume.name} 
                rarity={perfume.rarity} 
                size={320} 
              />
              
              <div className="mt-10 text-center space-y-3">
                <FitTitle 
                  text={perfume.name} 
                  className="font-bold text-white"
                  maxRem={1.875}
                />
                <p className="text-white/60 text-base">
                  {isHybrid ? "Alchemy Hybrid" : isViral ? "Viral Scent" : isGenesis ? "Genesis Collection" : isMFW ? "MFW 2026 Exclusive" : "ScentProtocol V3"}
                </p>
                <div className="flex items-center justify-center gap-3 text-white/40 text-sm">
                  <span>Token ID: #{id}</span>
                  <span>•</span>
                  <span>Rarity: {RARITY[perfume.rarity]}</span>
                </div>
                <p className="text-white/40 text-sm mt-6 max-w-md mx-auto leading-relaxed">
                  Each ScentCrest is uniquely generated based on the fragrance's notes, rarity, and creator address. This unique visual signature represents the essence of your digital perfume.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
