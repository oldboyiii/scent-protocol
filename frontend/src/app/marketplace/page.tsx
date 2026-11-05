"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";
import { getContract } from "@/utils/contract";
import { useAccount } from "wagmi";
import ScentCrest from "@/components/ScentCrest";

// ============================================================
// CONTRACT ADDRESSES
// ============================================================
const MARKETPLACE_ADDRESS = ethers.getAddress("0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120");
const NFT_CONTRACT_ADDRESS = "0x87950a56456Df786A249F484e9E56dF00fF207cb"; // V3
const GENESIS_CONTRACT_ADDRESS = "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6";
const MFW_CONTRACT_ADDRESS = "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20";
const VIRAL_CONTRACT_ADDRESS = "0x55A3527C87190fa8456De46247b52214287e8688";
const ALCHEMY_CONTRACT_ADDRESS = "0xd5c962b1dBaa6044E88B4c2bBe2dD5A257702e40";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// ============================================================
// CONTRACT ABIs
// ============================================================
const MARKETPLACE_ABI = [
  "function list(address nft, uint256 tokenId, uint256 price, uint256 expiry)",
  "function cancelListing(address nft, uint256 tokenId)",
  "function buy(address nft, uint256 tokenId, uint256 expectedPrice)",
  // FIXED: Changed from 'listings' to 'getListing' to match the actual contract
  "function getListing(address nft, uint256 tokenId) view returns (address seller, uint256 price, uint256 expiry, uint16 feeBps)",
  "function getActiveListings(address nft) view returns (uint256[])",
  "function usdc() view returns (address)"
];

const USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const NFT_ABI = [
  "function getPerfume(uint256 tokenId) view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool isAlchemy, uint256 parentTokenA, uint256 parentTokenB))"
];

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

// ============================================================
// TYPES & INTERFACES
// ============================================================
type SortOption = "priceLow" | "priceHigh" | "rarity" | "newest";
type CollectionFilter = "all" | "scents" | "genesis" | "mfw" | "viral" | "hybrid";

interface ListingData {
  tokenId: number;
  contractAddress: string;
  seller: string;
  price: bigint;
  expiry: number;
  active: boolean;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  createdAt: number;
  creator: string;
}

// ============================================================
// CONSTANTS & STYLES
// ============================================================
const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["", "♂", "♀", ""];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

const MFW_STYLE = {
  bg: "from-purple-900/80 via-indigo-900/70 to-slate-900/80",
  border: "border-purple-500/50",
  badge: "bg-purple-500/40 text-purple-100 border-purple-400/60",
  text: "text-purple-100",
  glow: "shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]",
  hex: "#a855f7",
};

const VIRAL_STYLE = {
  bg: "from-fuchsia-900/80 via-pink-900/70 to-purple-900/80",
  border: "border-fuchsia-500/50",
  badge: "bg-fuchsia-500/40 text-fuchsia-50 border-fuchsia-400/80",
  text: "text-fuchsia-100",
  glow: "shadow-[0_0_40px_rgba(217,70,239,0.4)] hover:shadow-[0_0_60px_rgba(217,70,239,0.6)]",
  hex: "#d946ef",
};

const HYBRID_STYLE = {
  bg: "from-cyan-900/80 via-teal-900/70 to-slate-900/80",
  border: "border-cyan-500/50",
  badge: "bg-cyan-500/40 text-cyan-100 border-cyan-400/60",
  text: "text-cyan-100",
  glow: "shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]",
  hex: "#22d3ee",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MarketplacePage() {
  const { address: userAddress } = useAccount();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("priceLow");
  const [filterBy, setFilterBy] = useState<CollectionFilter>("all");
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Fetch all active listings from the marketplace
  const loadListings = async () => {
    try {
      setLoading(true);
      setError("");
      const signer = await getArcSigner();
      const provider = signer.provider;
      if (!provider) throw new Error("Provider not found");

      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
      const nftContract = getContract(provider);
      const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
      const mfwContract = new ethers.Contract(MFW_CONTRACT_ADDRESS, MFW_ABI, provider);
      const viralContract = new ethers.Contract(VIRAL_CONTRACT_ADDRESS, VIRAL_ABI, provider);
      const alchemyContract = new ethers.Contract(ALCHEMY_CONTRACT_ADDRESS, ALCHEMY_ABI, provider);

      const collections = [
        NFT_CONTRACT_ADDRESS, 
        GENESIS_CONTRACT_ADDRESS, 
        MFW_CONTRACT_ADDRESS, 
        VIRAL_CONTRACT_ADDRESS, 
        ALCHEMY_CONTRACT_ADDRESS
      ];
      
      const results: ListingData[] = [];
      const now = Math.floor(Date.now() / 1000);

      // Fetch active listings for each collection individually
      for (const col of collections) {
        try {
          const activeIds: bigint[] = await marketplace.getActiveListings(col);
          
          for (const id of activeIds) {
            try {
              const tokenId = Number(id);
              // FIXED: Changed from 'listings' to 'getListing'
              const listingData = await marketplace.getListing(col, tokenId);
              
              // Skip if listing is empty or expired
              if (listingData.seller === ethers.ZeroAddress) continue;
              if (Number(listingData.expiry) <= now) continue;

              let perfume: any = null;

              // Fetch perfume metadata based on collection
              if (col.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()) {
                const data: any = await nftContract.getPerfume(tokenId);
                if (data && data.name) {
                  perfume = { 
                    name: data.name, gender: Number(data.gender), pType: Number(data.pType), 
                    concentration: Number(data.concentration), rarity: Number(data.rarity), 
                    topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [], 
                    heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [], 
                    baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [], 
                    createdAt: Number(data.createdAt), creator: data.creator 
                  };
                }
              } else if (col.toLowerCase() === GENESIS_CONTRACT_ADDRESS.toLowerCase()) {
                const data: any = await genesisContract.getPerfume(tokenId);
                if (data && data.name) {
                  perfume = { 
                    name: data.name, gender: Number(data.gender), pType: Number(data.pType), 
                    concentration: Number(data.concentration), rarity: Number(data.rarity), 
                    topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [], 
                    heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [], 
                    baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [], 
                    createdAt: Number(data.createdAt), creator: data.creator 
                  };
                }
              } else if (col.toLowerCase() === MFW_CONTRACT_ADDRESS.toLowerCase()) {
                const data: any = await mfwContract.getPerfume(tokenId);
                if (data && data.name) {
                  perfume = { 
                    name: data.name, gender: Number(data.gender), pType: Number(data.pType), 
                    concentration: Number(data.concentration), rarity: Number(data.rarity), 
                    topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [], 
                    heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [], 
                    baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [], 
                    createdAt: Number(data.createdAt), creator: data.creator 
                  };
                }
              } else if (col.toLowerCase() === VIRAL_CONTRACT_ADDRESS.toLowerCase()) {
                const data: any = await viralContract.getPerfume(tokenId);
                if (data && data.name) {
                  perfume = { 
                    name: data.name, gender: Number(data.gender), pType: Number(data.pType), 
                    concentration: Number(data.concentration), rarity: Number(data.rarity), 
                    topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [], 
                    heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [], 
                    baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [], 
                    createdAt: Number(data.createdAt), creator: data.creator 
                  };
                }
              } else if (col.toLowerCase() === ALCHEMY_CONTRACT_ADDRESS.toLowerCase()) {
                const data: any = await alchemyContract.getHybridPerfume(tokenId);
                if (data && data.name) {
                  perfume = { 
                    name: data.name, gender: Number(data.gender), pType: Number(data.pType), 
                    concentration: Number(data.concentration), rarity: Number(data.rarity), 
                    topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [], 
                    heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [], 
                    baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [], 
                    createdAt: Number(data.createdAt), creator: data.alchemist 
                  };
                }
              }

              if (perfume) {
                results.push({
                  tokenId,
                  contractAddress: col,
                  seller: listingData.seller,
                  price: listingData.price,
                  expiry: Number(listingData.expiry),
                  active: true,
                  name: perfume.name,
                  rarity: perfume.rarity,
                  gender: perfume.gender,
                  pType: perfume.pType,
                  concentration: perfume.concentration,
                  topNotes: perfume.topNotes,
                  heartNotes: perfume.heartNotes,
                  baseNotes: perfume.baseNotes,
                  createdAt: perfume.createdAt,
                  creator: perfume.creator,
                });
              }
            } catch (e) {
              console.warn(`Failed to load listing for token ${id} in collection ${col}:`, e);
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch active listings for collection ${col}:`, e);
        }
      }

      setListings(results);
    } catch (error: any) {
      console.error("Failed to fetch listings:", error);
      setError(error.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // Close dropdowns when clicking outside
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

  // Filter logic
  const filteredListings = listings.filter(listing => {
    if (filterBy === "all") return true;
    if (filterBy === "genesis") return listing.contractAddress === GENESIS_CONTRACT_ADDRESS;
    if (filterBy === "mfw") return listing.contractAddress === MFW_CONTRACT_ADDRESS;
    if (filterBy === "viral") return listing.contractAddress === VIRAL_CONTRACT_ADDRESS;
    if (filterBy === "hybrid") return listing.contractAddress === ALCHEMY_CONTRACT_ADDRESS;
    return listing.contractAddress === NFT_CONTRACT_ADDRESS;
  });

  // Sort logic
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case "priceLow": return Number(a.price - b.price);
      case "priceHigh": return Number(b.price - a.price);
      case "rarity": return b.rarity - a.rarity;
      case "newest": return b.createdAt - a.createdAt;
      default: return 0;
    }
  });

  // Handle buying an NFT
  const handleBuy = async (listing: ListingData) => {
    try {
      setActionId(listing.tokenId);
      const signer = await getArcSigner();
      const currentUserAddress = await signer.getAddress();

      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const balance = await usdcContract.balanceOf(currentUserAddress);
      if (balance < listing.price) {
        throw new Error(`Insufficient USDC! Have: ${ethers.formatUnits(balance, 6)}, Need: ${ethers.formatUnits(listing.price, 6)}`);
      }

      const currentAllowance = await usdcContract.allowance(currentUserAddress, MARKETPLACE_ADDRESS);
      if (currentAllowance < listing.price) {
        if (currentAllowance > 0n) {
          const resetTx = await usdcContract.approve(MARKETPLACE_ADDRESS, 0n, { gasLimit: 100000 });
          await resetTx.wait();
          await new Promise(r => setTimeout(r, 1500));
        }
        const approveTx = await usdcContract.approve(MARKETPLACE_ADDRESS, ethers.MaxUint256, { gasLimit: 100000 });
        await approveTx.wait();
        await new Promise(r => setTimeout(r, 2000));
      }

      const buyTx = await marketplace.buy(listing.contractAddress, listing.tokenId, listing.price, { gasLimit: 300000 });
      await buyTx.wait();

      alert("Purchase successful!");
      await loadListings();
    } catch (error: any) {
      console.error("Purchase failed:", error);
      alert(`Purchase failed: ${error.message || error.reason || "Check console"}`);
    } finally {
      setActionId(null);
    }
  };

  // Handle cancelling a listing
  const handleCancelListing = async (listing: ListingData) => {
    if (!confirm("Are you sure you want to cancel this listing?")) return;
    try {
      setActionId(listing.tokenId);
      const signer = await getArcSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const tx = await marketplace.cancelListing(listing.contractAddress, listing.tokenId, { gasLimit: 200000 });
      await tx.wait();

      alert("Listing cancelled successfully!");
      await loadListings();
    } catch (error: any) {
      console.error("Cancel failed:", error);
      alert(`Cancel failed: ${error.message || error.reason || "Check console"}`);
    } finally {
      setActionId(null);
    }
  };

  // Helper: Format price from bigint to readable USDC string
  const formatPrice = (price: bigint) => {
    return Number(ethers.formatUnits(price, 6)).toFixed(2);
  };

  // Helper: Calculate and format time left until expiry
  const getTimeLeft = (expiry: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const sortOptions = [
    { value: "priceLow", label: "Price: Low to High" },
    { value: "priceHigh", label: "Price: High to Low" },
    { value: "rarity", label: "Rarity (High to Low)" },
    { value: "newest", label: "Newest First" },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">Marketplace</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />))}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">Marketplace</h1>
      <p className="text-center text-white/50">{listings.length} NFT{listings.length !== 1 ? "s" : ""} listed for sale</p>

      {/* FILTERS AND SORT ROW */}
      <div className="mb-6 flex flex-wrap items-center gap-3 dropdown-container">
        <div className="relative">
          <button onClick={() => { setShowFilter(!showFilter); setShowSort(false); }} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[160px] justify-between">
            <span>
              {filterBy === "all" && "All Collections"}
              {filterBy === "scents" && "ScentProtocol"}
              {filterBy === "genesis" && "Genesis"}
              {filterBy === "mfw" && "MFW 2026"}
              {filterBy === "viral" && "Viral Scent"}
              {filterBy === "hybrid" && "Alchemy Hybrids"}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showFilter ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showFilter && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl min-w-[180px]">
              <button onClick={() => { setFilterBy("all"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "all" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>All Collections</button>
              <button onClick={() => { setFilterBy("scents"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "scents" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>ScentProtocol</button>
              <button onClick={() => { setFilterBy("genesis"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "genesis" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>Genesis</button>
              <button onClick={() => { setFilterBy("mfw"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "mfw" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>MFW 2026</button>
              <button onClick={() => { setFilterBy("viral"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "viral" ? "text-fuchsia-400 bg-white/5" : "text-white/70"}`}>Viral Scent</button>
              <button onClick={() => { setFilterBy("hybrid"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "hybrid" ? "text-cyan-400 bg-white/5" : "text-white/70"}`}>Alchemy Hybrids</button>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => { setShowSort(!showSort); setShowFilter(false); }} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[180px] justify-between">
            <span>{sortBy === "priceLow" && "Price: Low to High"}{sortBy === "priceHigh" && "Price: High to Low"}{sortBy === "rarity" && "Rarity (High to Low)"}{sortBy === "newest" && "Newest First"}</span>
            <svg className={`w-4 h-4 transition-transform ${showSort ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showSort && (
            <div className="absolute top-full mt-1 left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
              {sortOptions.map((option) => (
                <button key={option.value} onClick={() => { setSortBy(option.value as SortOption); setShowSort(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${sortBy === option.value ? "text-amber-400 bg-white/5" : "text-white/70"}`}>{option.label}</button>
              ))}
            </div>
          )}
        </div>

        <span className="text-white/30 text-sm ml-auto">{sortedListings.length} item{sortedListings.length !== 1 ? "s" : ""}</span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {sortedListings.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <p className="text-lg mb-4">No NFTs listed for sale yet.</p>
          <Link href="/collection" className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">List Your First NFT →</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedListings.map((listing) => {
            const rarity = listing.rarity;
            const isGenesis = listing.contractAddress === GENESIS_CONTRACT_ADDRESS;
            const isMFW = listing.contractAddress === MFW_CONTRACT_ADDRESS;
            const isViral = listing.contractAddress === VIRAL_CONTRACT_ADDRESS;
            const isHybrid = listing.contractAddress === ALCHEMY_CONTRACT_ADDRESS;
            const isOwner = userAddress?.toLowerCase() === listing.seller.toLowerCase();
            
            const style = isHybrid 
              ? HYBRID_STYLE
              : isViral 
                ? VIRAL_STYLE
                : isMFW 
                  ? MFW_STYLE
                  : isGenesis 
                    ? { bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", border: "border-amber-400/70", badge: "bg-amber-500/50 text-amber-50 border-amber-400/80", text: "text-amber-100", glow: "shadow-[0_0_80px_rgba(251,191,36,0.5),0_0_120px_rgba(245,158,11,0.3)]", hex: "#fbbf24" }
                    : (RARITY_STYLE[rarity] || RARITY_STYLE[0]);
                  
            const isActioning = actionId === listing.tokenId;

            return (
              <Link 
                key={`${listing.contractAddress}-${listing.tokenId}`} 
                href={`/nft/${listing.tokenId}?from=marketplace&contract=${listing.contractAddress}`}
                className="block"
              >
                <div className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}>
                  
                  {isGenesis && (<div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2.5s linear infinite" }} />)}
                  {isMFW && (<div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2.5s linear infinite" }} />)}
                  {isViral && (<div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(217,70,239,0.3), transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2.5s linear infinite" }} />)}
                  {isHybrid && (<div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2.5s linear infinite" }} />)}

                  {!isGenesis && !isMFW && !isViral && !isHybrid && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${style.hex}30, transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite", padding: "2px", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {!isGenesis && !isMFW && !isViral && !isHybrid && (
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(105deg, transparent 40%, ${style.hex}15 50%, transparent 60%)`, backgroundSize: "200% 100%", animation: "shimmer 2.5s infinite" }} />
                  )}

                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <ScentCrest seed={`${listing.creator}-${listing.name}`} name={listing.name} rarity={rarity} size={60} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-xs text-white/40 uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                            {isHybrid ? "Hybrid" : isViral ? "Viral" : isGenesis ? "Genesis" : isMFW ? "MFW 2026" : "Scent"} #{listing.tokenId}
                          </p>
                          {isGenesis && (<span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-amber-500/40 text-amber-50 border-amber-400/80 flex items-center gap-1 whitespace-nowrap flex-shrink-0"><img src="/arc-logo.png" alt="Arc" className="w-3 h-3 flex-shrink-0" style={{ filter: "drop-shadow(0 0 2px rgba(251,191,36,0.8))" }} /> Genesis</span>)}
                          {isMFW && (
  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-md bg-purple-500/40 text-purple-50 border-purple-400/80 flex items-center gap-0.5 whitespace-nowrap flex-shrink-0">
    <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="10" y="6" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
      <path d="M8 9C8 9 7 11 7 13V20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20V13C17 11 16 9 16 9H8Z" fill="currentColor" opacity="0.6"/>
      <path d="M10 12V19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
    MFW 2026
  </span>
)}
                          {isViral && (<span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-fuchsia-500/40 text-fuchsia-50 border-fuchsia-400/80 flex items-center gap-1 whitespace-nowrap flex-shrink-0"><svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Viral</span>)}
                          {isHybrid && (<span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-cyan-500/40 text-cyan-50 border-cyan-400/80 flex items-center gap-1 whitespace-nowrap flex-shrink-0"><svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3v6l-6 9h18l-6-9V3H9z"/><path d="M9 9h6"/></svg> Hybrid</span>)}
                        </div>
                        <h3 className="text-xl font-bold text-white mt-1 truncate" title={listing.name}>{listing.name}</h3>
                      </div>
                    </div>
                    <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge} flex-shrink-0`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                  </div>

                  {/* Price and Expiry Box */}
                  <div className="relative bg-black/40 rounded-lg px-4 py-3 border border-white/10 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Price</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatPrice(listing.price)} <span className="text-sm text-white/60">USDC</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Expires</p>
                        <p className="text-sm font-medium text-white/80">{getTimeLeft(listing.expiry)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex flex-wrap gap-2 text-xs mb-4">
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{GENDER_ICONS[listing.gender] || "Unisex"}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{TYPE_LABELS[listing.pType]}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{listing.concentration}%</span>
                  </div>

                  {listing.topNotes.length > 0 && (
                    <div className="relative space-y-2 text-sm mb-4">
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Top Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {listing.topNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-amber-200 text-xs border border-amber-500/30">{n}</span>))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="relative flex items-center justify-between pt-2 gap-2">
                    <Link 
                      href={`/nft/${listing.tokenId}?from=marketplace&contract=${listing.contractAddress}`} 
                      className="text-sm text-white/50 hover:text-white transition-colors flex-1 truncate"
                    >
                      View Details & Offers →
                    </Link>
                    
                    {isOwner ? (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelListing(listing); }}
                        disabled={isActioning}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                      >
                        {isActioning ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <Link 
                          href={`/nft/${listing.tokenId}?contract=${listing.contractAddress}`}
                          className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all whitespace-nowrap"
                        >
                          Make Offer
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuy(listing); }}
                          disabled={isActioning}
                          className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                        >
                          {isActioning ? "Buying..." : "Buy Now"}
                        </button>
                      </div>
                    )}
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
