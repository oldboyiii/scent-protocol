"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";
import { useWallet } from "@/context/WalletContext";
import ShareCard from "@/components/ShareCard";
import { getCollectionByAddress, getAllCollections } from "@/config/collections";

const MARKETPLACE_ADDRESS = "0x23d2F6655F23D245348ce6Db11e07eab823E6D66";
const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const GENESIS_CONTRACT_ADDRESS = "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf";

const MARKETPLACE_ABI = [
  "function list(uint256 tokenId, uint256 price)",
  "function cancel(uint256 tokenId)",
  "function listings(uint256) view returns (address seller, uint256 price, bool active)"
];

const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

const GENESIS_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function getPerfume(uint256 tokenId) view returns (uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool isGenesis)"
];

interface PerfumeInfo {
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
  createdAt: number;
  creator: string;
}

interface StoredScent {
  tokenId: number;
  contractAddress: string;
  collection: ReturnType<typeof getCollectionByAddress>;
  name?: string;
  rarity?: number;
  timestamp: number;
  isListed?: boolean;
  perfume?: PerfumeInfo;
  description?: string;
}

type SortOption = "newest" | "oldest" | "name" | "rarity";
type FilterOption = "all" | string;

const GENDER = ["Unisex", "Male", "Female"];
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

export default function CollectionPage() {
  const [scents, setScents] = useState<StoredScent[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [listingModal, setListingModal] = useState<{ open: boolean; tokenId: number | null; price: string }>({
    open: false,
    tokenId: null,
    price: ""
  });
  const [listingStatus, setListingStatus] = useState<"idle" | "approving" | "listing" | "success">("idle");
  const { address } = useWallet();

  useEffect(() => {
    if (address) {
      setWalletReady(true);
    } else {
      const checkDirectly = async () => {
        const w = window as any;
        if (w.ethereum) {
          try {
            const accounts = await w.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setWalletReady(true);
            }
          } catch {}
        }
      };
      checkDirectly();
      const timer = setTimeout(() => setWalletReady(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [address]);

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

  useEffect(() => {
    async function fetchCollection() {
      if (!walletReady) return;

      let currentAddress = address;
      if (!currentAddress) {
        const w = window as any;
        if (w.ethereum) {
          try {
            const accounts = await w.ethereum.request({ method: 'eth_accounts' });
            currentAddress = accounts?.[0];
          } catch {}
        }
      }

      if (!currentAddress) {
        setLoading(false);
        return;
      }

      try {
        const w = window as any;
        const provider = w.ethereum 
          ? new ethers.BrowserProvider(w.ethereum)
          : new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

        const allCollections = [
          { address: NFT_CONTRACT_ADDRESS, abi: NFT_ABI, name: "ScentProtocol" },
          { address: GENESIS_CONTRACT_ADDRESS, abi: GENESIS_ABI, name: "Genesis" }
        ];
        
        const results: StoredScent[] = [];

        for (const collectionInfo of allCollections) {
          const collectionContract = new ethers.Contract(collectionInfo.address, collectionInfo.abi, provider);
          const collection = getCollectionByAddress(collectionInfo.address);
          
          console.log(`Checking ${collectionInfo.name} at ${collectionInfo.address}...`);
          
          try {
            const balance = await collectionContract.balanceOf(currentAddress);
            const balanceNum = Number(balance);
            console.log(`${collectionInfo.name} balance:`, balanceNum);

            if (balanceNum === 0) continue;

            let foundCount = 0;
            const maxId = 100;

            for (let tokenId = 1; tokenId <= maxId && foundCount < balanceNum; tokenId++) {
              try {
                const owner = await collectionContract.ownerOf(tokenId);
                
                if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                  console.log(`Found token ${tokenId} in ${collectionInfo.name}`);
                  
                  let perfume: PerfumeInfo | undefined;
                  try {
                    const perfumeData = await collectionContract.getPerfume(tokenId);
                    
                    // Explicit type casting for string arrays to fix TypeScript errors
                    const topNotes = Array.from(perfumeData.topNotes || []) as string[];
                    const heartNotes = Array.from(perfumeData.heartNotes || []) as string[];
                    const baseNotes = Array.from(perfumeData.baseNotes || []) as string[];
                    
                    perfume = {
                      name: perfumeData.name,
                      gender: Number(perfumeData.gender),
                      pType: Number(perfumeData.pType),
                      topNotes: topNotes,
                      heartNotes: heartNotes,
                      baseNotes: baseNotes,
                      concentration: Number(perfumeData.concentration),
                      rarity: Number(perfumeData.rarity),
                      createdAt: Number(perfumeData.createdAt),
                      creator: perfumeData.creator,
                    };
                  } catch (e) {
                    console.warn(`Could not fetch perfume data for token ${tokenId}`, e);
                  }
                  
                  let isListed = false;
                  try {
                    const listing = await marketplace.listings(tokenId);
                    isListed = listing.active;
                  } catch (e) {
                    console.warn(`Could not check listing for token ${tokenId}`, e);
                  }

                  results.push({
                    tokenId,
                    contractAddress: collectionInfo.address,
                    collection,
                    name: perfume?.name,
                    rarity: perfume?.rarity,
                    timestamp: perfume?.createdAt ? Number(perfume.createdAt) * 1000 : Date.now(),
                    isListed,
                    perfume,
                    description: undefined,
                  });
                  foundCount++;
                }
              } catch (e) {
                // Token not minted yet
              }
              
              await new Promise(r => setTimeout(r, 50));
            }
          } catch (e) {
            console.error(`Error fetching from ${collectionInfo.name}:`, e);
          }
        }

        console.log("Total NFTs found:", results.length);
        setScents(results);
      } catch (e) {
        console.error("Collection fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCollection();
  }, [walletReady, address]);

  const filteredScents = scents.filter(s => {
    if (filterBy === "all") return true;
    return s.contractAddress.toLowerCase() === filterBy.toLowerCase();
  });

  const sortedScents = [...filteredScents].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.tokenId - a.tokenId;
      case "oldest":
        return a.tokenId - b.tokenId;
      case "name":
        return (a.perfume?.name || a.name || "").localeCompare(b.perfume?.name || b.name || "");
      case "rarity":
        return (b.perfume?.rarity ?? b.rarity ?? 0) - (a.perfume?.rarity ?? a.rarity ?? 0);
      default:
        return 0;
    }
  });

  const collections = getAllCollections();

  const handleListClick = (tokenId: number) => {
    setListingModal({ open: true, tokenId, price: "" });
    setListingStatus("idle");
  };

  const handleListConfirm = async () => {
    if (!listingModal.tokenId || !listingModal.price) return;
    
    try {
      setListingStatus("approving");
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const isApproved = await nftContract.isApprovedForAll(userAddress, MARKETPLACE_ADDRESS);
      
      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await approveTx.wait();
      }

      setListingStatus("listing");
      const priceInUSDC = ethers.parseUnits(listingModal.price, 6);
      const listTx = await marketplaceContract.list(listingModal.tokenId, priceInUSDC);
      await listTx.wait();

      setListingStatus("success");
      setTimeout(() => {
        setListingModal({ open: false, tokenId: null, price: "" });
        setListingStatus("idle");
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Listing failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(`Listing failed: ${error.shortMessage || error.message || "Check console"}`);
      }
      setListingStatus("idle");
    }
  };

  const handleCancelListing = async (tokenId: number) => {
    if (!confirm(`Remove Scent #${tokenId} from the marketplace?`)) return;
    
    try {
      setListingStatus("listing");
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const cancelTx = await marketplaceContract.cancel(tokenId);
      await cancelTx.wait();

      alert("Listing removed successfully!");
      setListingStatus("idle");
      window.location.reload();
    } catch (error: any) {
      console.error("Cancel failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(`Cancel failed: ${error.shortMessage || error.message || "Check console"}`);
      }
      setListingStatus("idle");
    }
  };

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "name", label: "Name (A-Z)" },
    { value: "rarity", label: "Rarity (High to Low)" },
  ];

  if (!walletReady || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">
          My Collection
        </h1>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
        <p className="text-white/50 mb-8">Connect your wallet to see your collection.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">
        My Collection
      </h1>
      <p className="text-center text-white/50">
        {scents.length} NFT{scents.length !== 1 ? "s" : ""} collected
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3 dropdown-container">
        <div className="relative">
          <button
            onClick={() => {
              setShowFilter(!showFilter);
              setShowSort(false);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[180px] justify-between"
          >
            <span>
              {filterBy === "all" 
                ? "All Collections" 
                : (getCollectionByAddress(filterBy)?.badgeIcon || "") + " " + (getCollectionByAddress(filterBy)?.name || "Unknown")}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showFilter ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showFilter && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl min-w-[200px]">
              <button
                onClick={() => {
                  setFilterBy("all");
                  setShowFilter(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                  filterBy === "all" ? "text-amber-400 bg-white/5" : "text-white/70"
                }`}
              >
                All Collections
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    setFilterBy(col.contractAddress);
                    setShowFilter(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                    filterBy === col.contractAddress ? "text-amber-400 bg-white/5" : "text-white/70"
                  }`}
                >
                  {col.badgeIcon} {col.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowSort(!showSort);
              setShowFilter(false);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[160px] justify-between"
          >
            <span>
              {sortBy === "newest" && "Newest First"}
              {sortBy === "oldest" && "Oldest First"}
              {sortBy === "name" && "Name (A-Z)"}
              {sortBy === "rarity" && "Rarity (High to Low)"}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showSort ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSort && (
            <div className="absolute top-full mt-1 left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value as SortOption);
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                    sortBy === option.value ? "text-amber-400 bg-white/5" : "text-white/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <span className="text-white/30 text-sm ml-auto">
          {filteredScents.length} item{filteredScents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filteredScents.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <p className="text-lg mb-4">
            {scents.length === 0 ? "No NFTs in your collection yet." : "No NFTs in this collection."}
          </p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            Mint Your First Scent →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedScents.map((s) => {
            const hasFullData = !!s.perfume && s.perfume.topNotes;
            const perfume = hasFullData ? s.perfume! : null;
            const rarity = perfume?.rarity ?? s.rarity ?? 0;
            const style = RARITY_STYLE[rarity] || RARITY_STYLE[0];
            const collection = s.collection;

            return (
              <div
                key={`${s.contractAddress}-${s.tokenId}`}
                className={`group relative rounded-2xl p-6 space-y-4 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${collection?.borderColor || style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}
              >
                {collection && (
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${collection.badgeColor} ${collection.borderColor}`}>
                      {collection.badgeIcon} {collection.name}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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

                <div className="relative">
                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    {collection?.name || "Scent"} #{s.tokenId}
                  </p>
                  <h3 className="text-xl font-bold text-white mt-1 pr-24">
                    {perfume?.name || s.name || `Scent #${s.tokenId}`}
                  </h3>
                </div>

                <div className="relative flex items-start justify-between">
                  <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
                    {RARITY[rarity]}
                  </span>
                </div>

                {hasFullData ? (
                  <>
                    <div className="relative flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
                        {GENDER[perfume!.gender]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
                        {TYPE[perfume!.pType]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
                        {perfume!.concentration}%
                      </span>
                    </div>

                    <div className="relative space-y-2 text-sm">
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Top Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.topNotes.map((n) => (
                            <span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-amber-200 text-xs border border-amber-500/30">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-between pt-2 gap-2">
                      <Link href={`/nft/${s.tokenId}`} className="text-sm text-white/50 hover:text-white transition-colors">
                        View Details →
                      </Link>
                      <div className="flex gap-2">
                        <ShareCard tokenId={s.tokenId} perfume={perfume!} />
                        {s.isListed ? (
                          <button
                            onClick={() => handleCancelListing(s.tokenId)}
                            disabled={listingStatus === "listing"}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {listingStatus === "listing" ? "Removing..." : "Remove"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleListClick(s.tokenId)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
                          >
                            List
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative text-sm text-white/40">
                    <p>Legacy entry — full details not available.</p>
                    <Link href={`/nft/${s.tokenId}`} className="text-sm text-white/50 hover:text-white transition-colors inline-block mt-2">
                      View Details →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {listingModal.open && (() => {
        const currentScent = scents.find(s => s.tokenId === listingModal.tokenId);
        const rarity = currentScent?.perfume?.rarity ?? currentScent?.rarity ?? 0;
        const style = RARITY_STYLE[rarity] || RARITY_STYLE[0];
        
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setListingModal({ open: false, tokenId: null, price: "" })}>
            <div 
              className={`w-full max-w-sm mx-4 p-6 relative rounded-2xl backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <h3 className="text-xl font-bold text-white mb-4">List Scent #{listingModal.tokenId}</h3>
                <p className="text-white/60 text-sm mb-5">Set your price in USDC</p>

                <div className="space-y-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 10.00"
                    value={listingModal.price}
                    onChange={(e) => setListingModal({ ...listingModal, price: e.target.value })}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/30"
                  />

                  {listingStatus === "listing" && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                      <p className="text-sm text-white/80">Creating listing...</p>
                    </div>
                  )}

                  {listingStatus === "success" && (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-2">✓</div>
                      <p className="text-emerald-400 font-bold">Successfully listed!</p>
                    </div>
                  )}

                  {listingStatus === "idle" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setListingModal({ open: false, tokenId: null, price: "" })}
                        className="flex-1 py-3 bg-black/30 border border-white/10 text-white/70 rounded-lg hover:bg-black/40 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleListConfirm}
                        disabled={!listingModal.price || parseFloat(listingModal.price) <= 0}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
                      >
                        List NFT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
