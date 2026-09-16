"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getArcSigner } from "@/utils/marketplace";
import { getContract } from "@/utils/contract";

const MARKETPLACE_ADDRESS = ethers.getAddress("0x5CDC0DECc58cD19137fc2851b76A0a8Bc01a2B6c");
const NFT_CONTRACT_ADDRESS = "0x8d456e033FF7220068CDc1C3F08D6BA6641D103e";
const GENESIS_CONTRACT_ADDRESS = "0xcBc9c225495B1086EA0eA3574ceB473C1f4b35c9";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const MARKETPLACE_ABI = [
  "function list(address nftContract, uint256 tokenId, uint256 price)",
  "function cancel(uint256 tokenId)",
  "function buy(uint256 tokenId)",
  "function listings(uint256) view returns (address seller, address nftContract, uint256 price, bool active)",
  "function getActiveListings() view returns (uint256[])",
  "function getActiveCount() view returns (uint256)",
  "function usdc() view returns (address)"
];

const USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
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
  heartNotes: string[];
  baseNotes: string[];
  createdAt: number;
  creator: string;
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

      const activeCount = await marketplace.getActiveCount();
      console.log("Active listings count:", Number(activeCount));

      if (Number(activeCount) === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      const activeIds: bigint[] = await marketplace.getActiveListings();
      console.log("Active IDs:", activeIds.map(id => Number(id)));
      
      const results: ListingData[] = [];
      
      for (const id of activeIds) {
        try {
          const tokenId = Number(id);
          
          const listing = await marketplace.listings(tokenId);
          if (!listing || !listing.active) continue;

          const nftContractAddr = listing.nftContract;
          let perfume: any = null;
          let contractAddress = "";

          if (nftContractAddr.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()) {
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
                  heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [],
                  baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [],
                  createdAt: Number(data.createdAt),
                  creator: data.creator,
                };
                contractAddress = NFT_CONTRACT_ADDRESS;
              }
            } catch (e) {
              console.warn(`Failed to get ScentProtocol data for ${tokenId}:`, e);
            }
          } else if (nftContractAddr.toLowerCase() === GENESIS_CONTRACT_ADDRESS.toLowerCase()) {
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
                  heartNotes: data.heartNotes ? Array.from(data.heartNotes).map((n: any) => String(n)) : [],
                  baseNotes: data.baseNotes ? Array.from(data.baseNotes).map((n: any) => String(n)) : [],
                  createdAt: Number(data.createdAt),
                  creator: data.creator,
                };
                contractAddress = GENESIS_CONTRACT_ADDRESS;
              }
            } catch (e) {
              console.warn(`Failed to get Genesis data for ${tokenId}:`, e);
            }
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
              heartNotes: perfume.heartNotes,
              baseNotes: perfume.baseNotes,
              createdAt: perfume.createdAt,
              creator: perfume.creator,
            });
          }
        } catch (e) {
          console.warn(`Failed to load listing ${id}:`, e);
        }
      }

      console.log("Final listings:", results.length);
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
      case "priceLow": return Number(a.price - b.price);
      case "priceHigh": return Number(b.price - a.price);
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

      console.log("=== 🛒 STARTING PURCHASE ===");
      console.log("Token ID:", listing.tokenId);
      console.log("Price:", ethers.formatUnits(listing.price, 6), "USDC");

      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      // 1. Check USDC balance
      const balance = await usdcContract.balanceOf(userAddress);
      console.log("Buyer USDC balance:", ethers.formatUnits(balance, 6));
      if (balance < listing.price) {
        throw new Error(`Insufficient USDC! Have: ${ethers.formatUnits(balance, 6)}, Need: ${ethers.formatUnits(listing.price, 6)}`);
      }

      // 2. Handle allowance with MaxUint256
      const currentAllowance = await usdcContract.allowance(userAddress, MARKETPLACE_ADDRESS);
      console.log("Current allowance:", currentAllowance.toString());

      if (currentAllowance < listing.price) {
        console.log("⚠️ Allowance insufficient. Sending approve...");
        
        // Reset to 0 first (some ERC20 tokens require this)
        if (currentAllowance > 0n) {
          const resetTx = await usdcContract.approve(MARKETPLACE_ADDRESS, 0n, { gasLimit: 100000 });
          await resetTx.wait();
          await new Promise(r => setTimeout(r, 1500));
        }

        // Approve MaxUint256
        const approveTx = await usdcContract.approve(MARKETPLACE_ADDRESS, ethers.MaxUint256, { gasLimit: 100000 });
        console.log("Approve TX sent:", approveTx.hash);
        await approveTx.wait();
        console.log("✅ Approve confirmed!");

        // Wait for node sync
        await new Promise(r => setTimeout(r, 2000));

        // Re-check allowance
        const newAllowance = await usdcContract.allowance(userAddress, MARKETPLACE_ADDRESS);
        console.log("New allowance:", newAllowance.toString());
        if (newAllowance < listing.price) {
          throw new Error("Allowance did not update after approve. Please refresh and try again.");
        }
      } else {
        console.log("✅ Allowance already sufficient");
      }

      // 3. Execute purchase with fixed gasLimit
      console.log("🚀 Sending buy transaction...");
      const buyTx = await marketplace.buy(listing.tokenId, { gasLimit: 300000 });
      console.log("Buy TX sent:", buyTx.hash);
      await buyTx.wait();
      console.log("✅ Purchase confirmed!");

      alert("Purchase successful!");
      await loadListings();
    } catch (error: any) {
      console.error("=== ❌ PURCHASE FAILED ===", error);
      alert(`Purchase failed: ${error.message || error.reason || "Check console (F12) for details"}`);
    } finally {
      setBuyingId(null);
    }
  };

  const formatPrice = (price: bigint) => {
    return Number(ethers.formatUnits(price, 6)).toFixed(2);
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

      <div className="mb-6 flex flex-wrap items-center gap-3 dropdown-container">
        <div className="relative">
          <button onClick={() => { setShowFilter(!showFilter); setShowSort(false); }} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[160px] justify-between">
            <span>{filterBy === "all" && "All Collections"}{filterBy === "scents" && "ScentProtocol"}{filterBy === "genesis" && "Genesis"}</span>
            <svg className={`w-4 h-4 transition-transform ${showFilter ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showFilter && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl min-w-[180px]">
              <button onClick={() => { setFilterBy("all"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "all" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>All Collections</button>
              <button onClick={() => { setFilterBy("scents"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "scents" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>ScentProtocol</button>
              <button onClick={() => { setFilterBy("genesis"); setShowFilter(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${filterBy === "genesis" ? "text-amber-400 bg-white/5" : "text-white/70"}`}>Genesis</button>
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
            const style = isGenesis 
              ? { 
                  bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", 
                  border: "border-amber-400/70", 
                  badge: "bg-amber-500/50 text-amber-50 border-amber-400/80", 
                  text: "text-amber-100", 
                  glow: "shadow-[0_0_80px_rgba(251,191,36,0.5),0_0_120px_rgba(245,158,11,0.3)]", 
                  hex: "#fbbf24" 
                }
              : (RARITY_STYLE[rarity] || RARITY_STYLE[0]);
            const isBuying = buyingId === listing.tokenId;

            return (
              <Link key={`${listing.contractAddress}-${listing.tokenId}`} href={`/nft/${listing.tokenId}?from=marketplace`} className="block">
                <div className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}>
                  
                  {isGenesis && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                      background: `linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.5s linear infinite",
                    }} />
                  )}

                  {!isGenesis && (
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

                  {!isGenesis && (
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
                      background: `linear-gradient(105deg, transparent 40%, ${style.hex}15 50%, transparent 60%)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.5s infinite",
                    }} />
                  )}

                  <div className="relative flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-white/40 uppercase tracking-wider">
                          {isGenesis ? "Genesis" : "Scent"} #{listing.tokenId}
                        </p>
                        {isGenesis && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-amber-500/40 text-amber-50 border-amber-400/80 flex items-center gap-1">
                            <img src="/arc-logo.png" alt="Arc" className="w-3 h-3 inline-block" style={{ filter: "drop-shadow(0 0 2px rgba(251,191,36,0.8))" }} />
                            Genesis
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {listing.name}
                      </h3>
                    </div>
                    <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                  </div>

                  <div className="relative bg-black/40 rounded-lg px-4 py-2 border border-white/10 mb-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Price</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatPrice(listing.price)} <span className="text-sm text-white/60">USDC</span></p>
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

                  <div className="relative flex items-center justify-between pt-2 gap-2">
                    <span className="text-sm text-white/50">View Details →</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBuy(listing);
                      }}
                      disabled={isBuying}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isBuying ? "Buying..." : "Buy Now"}
                    </button>
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
