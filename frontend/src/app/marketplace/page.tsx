"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";
import { getContract } from "@/utils/contract";

const MARKETPLACE_ADDRESS = "0xBC7669036F8af720A85569448FD3DB198C52468C";
const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const GENESIS_CONTRACT_ADDRESS = "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf";

const MARKETPLACE_ABI = [
  "function listings(uint256) view returns (address seller, uint256 price, bool active)",
  "function list(address nft, uint256 tokenId, uint256 price)",
  "function buy(uint256 tokenId)",
  "function cancel(uint256 tokenId)",
  "function usdc() view returns (address)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const NFT_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

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

type SortOption = "priceLow" | "priceHigh" | "rarity" | "newest";
type CollectionFilter = "all" | "scents" | "genesis";

interface ListingData {
  tokenId: number;
  contractAddress: string;
  seller: string;
  price: bigint;
  active: boolean;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["", "♂", "♀", ""];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [usdcAddress, setUsdcAddress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("priceLow");
  const [filterBy, setFilterBy] = useState<CollectionFilter>("all");
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

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

      const usdcAddr = await marketplace.usdc();
      setUsdcAddress(usdcAddr);

      const results: ListingData[] = [];
      const maxTokenId = 50;
      
      for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
        try {
          const listing = await marketplace.listings(tokenId);
          
          if (!listing || !listing.active || listing.seller === "0x0000000000000000000000000000000000000000") {
            continue;
          }

          let perfume: any = null;
          let contractAddress = "";

          try {
            const data: any = await nftContract.getPerfume(tokenId);
            if (data && data.name) {
              perfume = {
                name: data.name,
                gender: Number(data.gender),
                pType: Number(data.pType),
                concentration: Number(data.concentration),
                rarity: Number(data.rarity),
                topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [],
              };
              contractAddress = NFT_CONTRACT_ADDRESS;
            }
          } catch (e) {
            try {
              const data: any = await genesisContract.getPerfume(tokenId);
              if (data && data.name) {
                perfume = {
                  name: data.name,
                  gender: Number(data.gender),
                  pType: Number(data.pType),
                  concentration: Number(data.concentration),
                  rarity: Number(data.rarity),
                  topNotes: data.topNotes ? Array.from(data.topNotes).map((n: any) => String(n)) : [],
                };
                contractAddress = GENESIS_CONTRACT_ADDRESS;
              }
            } catch (e2) {}
          }

          if (perfume) {
            results.push({
              tokenId,
              contractAddress,
              seller: listing.seller,
              price: listing.price,
              active: listing.active,
              name: perfume.name,
              rarity: perfume.rarity,
              gender: perfume.gender,
              pType: perfume.pType,
              concentration: perfume.concentration,
              topNotes: perfume.topNotes,
            });
          }
          
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.warn(`Error checking token ${tokenId}:`, e);
        }
      }

      console.log("Marketplace listings found:", results.length);
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

  const filteredListings = listings.filter(listing => {
    if (filterBy === "all") return true;
    if (filterBy === "genesis") return listing.contractAddress === GENESIS_CONTRACT_ADDRESS;
    return listing.contractAddress === NFT_CONTRACT_ADDRESS;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case "priceLow": return a.price < b.price ? -1 : a.price > b.price ? 1 : 0;
      case "priceHigh": return a.price < b.price ? 1 : a.price > b.price ? -1 : 0;
      case "rarity": return b.rarity - a.rarity;
      case "newest": return b.tokenId - a.tokenId;
      default: return 0;
    }
  });

  const handleBuy = async (listing: ListingData) => {
    try {
      setBuyingId(listing.tokenId);
      const signer = await getArcSigner();
      const userAddress = await signer.getAddress();

      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const currentAllowance: bigint = await usdcContract.allowance(userAddress, MARKETPLACE_ADDRESS);
      
      if (currentAllowance < listing.price) {
        const approveTx = await usdcContract.approve(MARKETPLACE_ADDRESS, listing.price);
        await approveTx.wait();
      }

      const buyTx = await marketplace.buy(listing.tokenId);
      await buyTx.wait();

      alert("Purchase successful!");
      await loadListings();
    } catch (error: any) {
      console.error("Buy failed:", error);
      alert(error.code === 4001 ? "Rejected" : error.shortMessage || error.message);
    } finally {
      setBuyingId(null);
    }
  };

  const formatPrice = (price: bigint) => {
    return Number(ethers.formatUnits(price, 6)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center">Marketplace</h1>
        <div className="grid gap-6 md:grid-cols-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center">Marketplace</h1>
      <p className="text-center text-white/50">{listings.length} NFTs listed</p>

      <div className="flex gap-3 justify-center flex-wrap dropdown-container">
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as CollectionFilter)} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
          <option value="all">All Collections</option>
          <option value="scents">ScentProtocol</option>
          <option value="genesis">Genesis</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="rarity">Rarity</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {error && <div className="text-center text-red-400">{error}</div>}

      {sortedListings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-lg mb-4">No NFTs listed for sale</p>
          <Link href="/collection" className="text-amber-400 hover:underline">List your first NFT →</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedListings.map((listing) => {
            const rarity = listing.rarity;
            const isGenesis = listing.contractAddress === GENESIS_CONTRACT_ADDRESS;
            const style = isGenesis ? { bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", border: "border-amber-400/70", badge: "bg-amber-500/50 text-amber-50", glow: "shadow-[0_0_80px_rgba(251,191,36,0.5)]", hex: "#fbbf24" } : RARITY_STYLE[rarity] || RARITY_STYLE[0];
            const isBuying = buyingId === listing.tokenId;

            return (
              <Link key={`${listing.contractAddress}-${listing.tokenId}`} href={`/nft/${listing.tokenId}?from=marketplace`} className="block">
                <div className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} hover:scale-105 transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-white/40">{isGenesis ? "Genesis" : "Scent"} #{listing.tokenId}</p>
                      <h3 className="text-xl font-bold text-white">{listing.name}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.badge}`}>{RARITY_LABELS[rarity]}</span>
                  </div>

                  <div className="bg-black/40 rounded-lg px-4 py-2 mb-4">
                    <p className="text-xs text-white/40">Price</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatPrice(listing.price)} <span className="text-sm text-white/60">USDC</span></p>
                  </div>

                  <div className="flex gap-2 text-xs mb-4">
                    <span className="px-2 py-0.5 rounded bg-black/30">{GENDER_ICONS[listing.gender] || "Unisex"}</span>
                    <span className="px-2 py-0.5 rounded bg-black/30">{TYPE_LABELS[listing.pType]}</span>
                    <span className="px-2 py-0.5 rounded bg-black/30">{listing.concentration}%</span>
                  </div>

                  {listing.topNotes.length > 0 && (
                    <div className="text-xs text-white/40 mb-4">
                      <p>Top: {listing.topNotes.slice(0, 2).join(", ")}{listing.topNotes.length > 2 ? "..." : ""}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <span className="text-sm text-white/50 flex-1">Details →</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBuy(listing);
                      }}
                      disabled={isBuying}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold disabled:opacity-50"
                    >
                      {isBuying ? "..." : "Buy"}
                    </button>
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
