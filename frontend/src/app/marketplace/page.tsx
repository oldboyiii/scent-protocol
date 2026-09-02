"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";

const MARKETPLACE_ADDRESS = "0x23d2F6655F23D245348ce6Db11e07eab823E6D66";
const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

const MARKETPLACE_ABI = [
  "function getActiveListings() view returns (uint256[])",
  "function listings(uint256) view returns (address seller, uint256 price, bool active)",
  "function buy(uint256 tokenId)",
  "function usdc() view returns (address)",
  "function nft() view returns (address)"
];

const NFT_ABI = [
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

interface ListingData {
  tokenId: number;
  seller: string;
  price: bigint;
  active: boolean;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
}

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER_ICONS = ["", "♂", "♀"];
const TYPE_LABELS = ["Parfum", "EDP", "EDT", "EDC"];

const RARITY_STYLE: Record<number, { 
  bg: string; 
  border: string; 
  badge: string; 
  glow: string;
}> = {
  0: {
    bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80",
    border: "border-slate-500/40",
    badge: "bg-slate-500/30 text-slate-200 border-slate-400/50",
    glow: "hover:shadow-[0_0_30px_rgba(148,163,184,0.15)]",
  },
  1: {
    bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80",
    border: "border-blue-400/50",
    badge: "bg-blue-500/30 text-blue-100 border-blue-400/50",
    glow: "hover:shadow-[0_0_40px_rgba(96,165,250,0.25)]",
  },
  2: {
    bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80",
    border: "border-purple-400/50",
    badge: "bg-purple-500/30 text-purple-100 border-purple-400/50",
    glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.25)]",
  },
  3: {
    bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90",
    border: "border-amber-400/60",
    badge: "bg-amber-500/40 text-amber-100 border-amber-400/60",
    glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.35)]",
  },
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [usdcAddress, setUsdcAddress] = useState<string>("");

  useEffect(() => {
    const loadListings = async () => {
      try {
        const signer = await getArcSigner();
        const provider = signer.provider;
        if (!provider) throw new Error("Provider not found");

        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);

        // Get USDC address for later use
        const usdcAddr = await marketplace.usdc();
        setUsdcAddress(usdcAddr);

        // ONE call to get all active listing IDs
        const activeIds: bigint[] = await marketplace.getActiveListings();
        
        if (activeIds.length === 0) {
          setListings([]);
          setLoading(false);
          return;
        }

        // Fetch metadata for each active listing
        const results: ListingData[] = [];
        for (const id of activeIds) {
          try {
            const tokenId = Number(id);
            const [listing, perfume] = await Promise.all([
              marketplace.listings(tokenId),
              nftContract.getPerfume(tokenId)
            ]);

            if (listing.active && perfume.name) {
              results.push({
                tokenId,
                seller: listing.seller,
                price: listing.price,
                active: listing.active,
                name: perfume.name,
                rarity: Number(perfume.rarity),
                gender: Number(perfume.gender),
                pType: Number(perfume.pType),
              });
            }
          } catch (e) {
            console.warn(`Failed to load listing metadata`, e);
          }
        }

        setListings(results);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const handleBuy = async (listing: ListingData) => {
    try {
      setBuyingId(listing.tokenId);
      const signer = await getArcSigner();
      const userAddress = await signer.getAddress();

      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      // Step 1: Check if user has approved enough USDC
      const currentAllowance: bigint = await usdcContract.allowance(userAddress, MARKETPLACE_ADDRESS);
      
      if (currentAllowance < listing.price) {
        console.log("Approving USDC...");
        const approveTx = await usdcContract.approve(MARKETPLACE_ADDRESS, listing.price);
        await approveTx.wait();
      }

      // Step 2: Execute buy
      console.log("Buying NFT...");
      const buyTx = await marketplace.buy(listing.tokenId);
      await buyTx.wait();

      alert("Purchase successful!");
      window.location.reload();
    } catch (error: any) {
      console.error("Buy failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(`Purchase failed: ${error.shortMessage || error.message || "Check console"}`);
      }
    } finally {
      setBuyingId(null);
    }
  };

  const formatPrice = (price: bigint) => {
    return Number(ethers.formatUnits(price, 6)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent leading-[1.3] pb-3">
          Marketplace
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent leading-[1.3] pb-3">
          Marketplace
        </h1>
        <p className="text-white/50">
          Buy and sell unique AI-generated digital perfumes on Arc Network.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 text-white/40 glass-card rounded-2xl p-8 border border-white/10">
          <p className="text-xl mb-2">No active listings yet.</p>
          <p className="text-sm">Be the first to list a scent from your collection!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((listing) => {
            const style = RARITY_STYLE[listing.rarity] || RARITY_STYLE[0];
            const isBuying = buyingId === listing.tokenId;

            return (
              <div
                key={listing.tokenId}
                className={`group relative rounded-2xl p-5 backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
              >
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-mono text-white/40">#{listing.tokenId}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border backdrop-blur-sm ${style.badge}`}>
                    {RARITY_LABELS[listing.rarity]}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white truncate mb-2 group-hover:text-amber-300 transition-colors">
                  {listing.name}
                </h3>

                <p className="text-xs text-white/40 mb-4 truncate">
                  Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </p>

                <div className="flex items-center gap-3 text-xs text-white/50 border-t border-white/5 pt-3 mb-4">
                  <span>{GENDER_ICONS[listing.gender]}</span>
                  <span>{TYPE_LABELS[listing.pType]}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase">Price</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatPrice(listing.price)} USDC
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuy(listing)}
                    disabled={isBuying}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isBuying ? "Buying..." : "Buy"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
