"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";
import { useWallet } from "@/context/WalletContext";
import ShareCard from "@/components/ShareCard";

const MARKETPLACE_ADDRESS = "0xBC7669036F8af720A85569448FD3DB198C52468C";
const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";
const GENESIS_CONTRACT_ADDRESS = "0x32b8a68ba95F156FE902008c2f7d4692583Da4bf";

const MARKETPLACE_ABI = [
  "function list(address nft, uint256 tokenId, uint256 price)",
  "function cancel(uint256 tokenId)",
  "function listings(uint256) view returns (address seller, uint256 price, bool active)",
  "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price, address indexed nftContract)",
  "event Cancelled(uint256 indexed tokenId, address indexed seller)"
];

const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function getPerfume(uint256 tokenId) view returns (string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator)"
];

const GENESIS_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
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

interface StoredScent {
  tokenId: number;
  contractAddress: string;
  name?: string;
  rarity?: number;
  timestamp: number;
  isListed?: boolean;
  perfume?: {
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
  };
  description?: string;
}

type SortOption = "newest" | "oldest" | "name" | "rarity";
type CollectionFilter = "all" | "scents" | "genesis";

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

export default function CollectionPage() {
  const [scents, setScents] = useState<StoredScent[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<CollectionFilter>("all");
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [listingModal, setListingModal] = useState<{ open: boolean; tokenId: number | null; contractAddress: string | null; price: string }>({
    open: false,
    tokenId: null,
    contractAddress: null,
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
        const provider = w.ethereum ? new ethers.BrowserProvider(w.ethereum) : new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
        
        // Get all active listings by checking events
        const listedFilter = marketplace.filters.Listed();
        const cancelledFilter = marketplace.filters.Cancelled();
        
        const [listedEvents, cancelledEvents] = await Promise.all([
          marketplace.queryFilter(listedFilter, 0, 'latest'),
          marketplace.queryFilter(cancelledFilter, 0, 'latest')
        ]);

        console.log("Listed events:", listedEvents.length);
        console.log("Cancelled events:", cancelledEvents.length);

        // Build set of active listings
        const activeListingIds = new Set<number>();
        const cancelledIds = new Set<number>();

        cancelledEvents.forEach(event => {
          const tokenId = Number(event.args?.tokenId);
          if (!isNaN(tokenId)) {
            cancelledIds.add(tokenId);
          }
        });

        listedEvents.forEach(event => {
          const tokenId = Number(event.args?.tokenId);
          if (!isNaN(tokenId) && !cancelledIds.has(tokenId)) {
            activeListingIds.add(tokenId);
          }
        });

        console.log("Active listing IDs from events:", Array.from(activeListingIds));

        const results: StoredScent[] = [];

        // PART 1: Fetch ScentProtocol NFTs
        try {
          let contract;
          if (w.ethereum) {
            contract = getContract(new ethers.BrowserProvider(w.ethereum));
          } else {
            contract = getContract(new ethers.JsonRpcProvider("https://rpc.testnet.arc.network"));
          }

          const balance = await contract.balanceOf(currentAddress);
          const balanceNum = Number(balance);
          console.log("ScentProtocol balance:", balanceNum);

          if (balanceNum > 0) {
            let foundCount = 0;
            const maxId = 100;

            for (let tokenId = 1; tokenId <= maxId && foundCount < balanceNum; tokenId++) {
              try {
                const owner = await contract.ownerOf(tokenId);
                if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                  const perfume = await contract.getPerfume(tokenId);
                  const isListed = activeListingIds.has(tokenId);
                  console.log(`ScentProtocol token ${tokenId} isListed:`, isListed);

                  results.push({
                    tokenId,
                    contractAddress: NFT_CONTRACT_ADDRESS,
                    name: perfume.name,
                    rarity: Number(perfume.rarity),
                    timestamp: Number(perfume.createdAt) * 1000,
                    isListed,
                    perfume: {
                      name: perfume.name,
                      gender: Number(perfume.gender),
                      pType: Number(perfume.pType),
                      topNotes: Array.from(perfume.topNotes || []) as string[],
                      heartNotes: Array.from(perfume.heartNotes || []) as string[],
                      baseNotes: Array.from(perfume.baseNotes || []) as string[],
                      concentration: Number(perfume.concentration),
                      rarity: Number(perfume.rarity),
                      createdAt: Number(perfume.createdAt),
                      creator: perfume.creator,
                    },
                    description: undefined,
                  });
                  foundCount++;
                }
              } catch (e) {}
              await new Promise(r => setTimeout(r, 50));
            }
          }
        } catch (e) {
          console.error("ScentProtocol fetch error:", e);
        }

        // PART 2: Fetch Genesis NFTs
        try {
          const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
          const genesisBalance = await genesisContract.balanceOf(currentAddress);
          const genesisBalanceNum = Number(genesisBalance);
          console.log("Genesis balance:", genesisBalanceNum);

          if (genesisBalanceNum > 0) {
            let foundCount = 0;
            const maxId = 100;

            for (let tokenId = 1; tokenId <= maxId && foundCount < genesisBalanceNum; tokenId++) {
              try {
                const owner = await genesisContract.ownerOf(tokenId);
                if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                  const data = await genesisContract.getPerfume(tokenId);
                  const isListed = activeListingIds.has(tokenId);
                  console.log(`Genesis token ${tokenId} isListed:`, isListed);

                  results.push({
                    tokenId,
                    contractAddress: GENESIS_CONTRACT_ADDRESS,
                    name: data.name,
                    rarity: Number(data.rarity),
                    timestamp: Number(data.createdAt) * 1000,
                    isListed,
                    perfume: {
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
                    },
                    description: undefined,
                  });
                  foundCount++;
                }
              } catch (e) {}
              await new Promise(r => setTimeout(r, 50));
            }
          }
        } catch (e) {
          console.error("Genesis fetch error:", e);
        }

        console.log("Total results:", results.length);
        setScents(results);
      } catch (e) {
        console.error("Collection fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    // Get all active listings by checking events
const listedFilter = marketplace.filters.Listed();
const cancelledFilter = marketplace.filters.Cancelled();

const [listedEvents, cancelledEvents] = await Promise.all([
  marketplace.queryFilter(listedFilter, 0, 'latest'),
  marketplace.queryFilter(cancelledFilter, 0, 'latest')
]);

console.log("Listed events:", listedEvents.length);
console.log("Cancelled events:", cancelledEvents.length);

// Build set of active listings
const activeListingIds = new Set<number>();
const cancelledIds = new Set<number>();

// Process cancelled events with proper typing
cancelledEvents.forEach((event: any) => {
  if (event.args) {
    const tokenId = Number(event.args.tokenId);
    if (!isNaN(tokenId)) {
      cancelledIds.add(tokenId);
    }
  }
});

// Process listed events with proper typing
listedEvents.forEach((event: any) => {
  if (event.args) {
    const tokenId = Number(event.args.tokenId);
    if (!isNaN(tokenId) && !cancelledIds.has(tokenId)) {
      activeListingIds.add(tokenId);
    }
  }
});

console.log("Active listing IDs from events:", Array.from(activeListingIds));
      
      const listTx = await marketplaceContract.list(
        listingModal.contractAddress,
        listingModal.tokenId,
        priceInUSDC
      );
      await listTx.wait();

      console.log("Listing successful!");
      setListingStatus("success");
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

      console.log("Canceling listing for token:", tokenId);
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
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">My Collection</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />))}</div>
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
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">My Collection</h1>
      <p className="text-center text-white/50">{scents.length} scent{scents.length !== 1 ? "s" : ""} collected</p>

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
          <button onClick={() => { setShowSort(!showSort); setShowFilter(false); }} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/10 transition-colors min-w-[160px] justify-between">
            <span>{sortBy === "newest" && "Newest First"}{sortBy === "oldest" && "Oldest First"}{sortBy === "name" && "Name (A-Z)"}{sortBy === "rarity" && "Rarity (High to Low)"}</span>
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

        <span className="text-white/30 text-sm ml-auto">{sortedScents.length} item{sortedScents.length !== 1 ? "s" : ""}</span>
      </div>

      {sortedScents.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <p className="text-lg mb-4">No NFTs in your collection yet.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">Mint Your First Scent →</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedScents.map((s) => {
            const hasFullData = !!s.perfume && s.perfume.topNotes;
            const perfume = hasFullData ? s.perfume! : null;
            const rarity = perfume?.rarity ?? s.rarity ?? 0;
            const isGenesis = s.contractAddress === GENESIS_CONTRACT_ADDRESS;
            
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

            return (
              <div key={`${s.contractAddress}-${s.tokenId}`} className={`group relative rounded-2xl p-6 space-y-4 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}>
                
                {isGenesis && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                    background: `linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2.5s linear infinite",
                  }} />
                )}

                {!isGenesis && (
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
                )}

                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {!isGenesis && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(105deg, transparent 40%, ${style.hex}15 50%, transparent 60%)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2.5s infinite",
                    }}
                  />
                )}

                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-white/40 uppercase tracking-wider">
                        {isGenesis ? "Genesis" : "Scent"} #{s.tokenId}
                      </p>
                      {isGenesis && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md bg-amber-500/40 text-amber-50 border-amber-400/80 flex items-center gap-1">
                          <img src="/arc-logo.png" alt="Arc" className="w-3 h-3 inline-block" style={{ filter: "drop-shadow(0 0 2px rgba(251,191,36,0.8))" }} />
                          Genesis
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {perfume?.name || s.name || `Scent #${s.tokenId}`}
                    </h3>
                  </div>
                  <span className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
                    {RARITY[rarity]}
                  </span>
                </div>

                {hasFullData ? (
                  <>
                    <div className="relative flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{GENDER[perfume!.gender]}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{TYPE[perfume!.pType]}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">{perfume!.concentration}%</span>
                    </div>

                    <div className="relative space-y-2 text-sm">
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Top Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.topNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-amber-200 text-xs border border-amber-500/30">{n}</span>))}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Heart Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.heartNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-rose-200 text-xs border border-rose-500/30">{n}</span>))}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Base Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.baseNotes.map((n) => (<span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-emerald-200 text-xs border border-emerald-500/30">{n}</span>))}
                        </div>
                      </div>
                    </div>

                    <div className="relative text-xs text-white/30 space-y-0.5">
                      <p>Creator: {perfume!.creator}</p>
                      <p>Minted: {new Date(perfume!.createdAt * 1000).toLocaleString()}</p>
                    </div>

                    <div className="relative flex items-center justify-between pt-2 gap-2">
                      <Link href={`/nft/${s.tokenId}?from=collection`} className="text-sm text-white/50 hover:text-white transition-colors">View Details →</Link>
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
                            onClick={() => handleListClick(s.tokenId, s.contractAddress)} 
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
                          >
                            List for Sale
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative text-sm text-white/40">
                    <p>Legacy entry — full details not available.</p>
                    <p className="text-xs mt-1">Minted: {new Date(s.timestamp).toLocaleString()}</p>
                    <div className="flex items-center justify-between pt-4">
                      <Link href={`/nft/${s.tokenId}?from=collection`} className="text-sm text-white/50 hover:text-white transition-colors">View Details →</Link>
                    </div>
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
        const isGenesisModal = currentScent?.contractAddress === GENESIS_CONTRACT_ADDRESS;
        const style = isGenesisModal
          ? { 
              bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", 
              border: "border-amber-400/70", 
              badge: "bg-amber-500/50 text-amber-50 border-amber-400/80", 
              text: "text-amber-100", 
              glow: "shadow-[0_0_80px_rgba(251,191,36,0.5),0_0_120px_rgba(245,158,11,0.3)]", 
              hex: "#fbbf24" 
            }
          : (RARITY_STYLE[rarity] || RARITY_STYLE[0]);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setListingModal({ open: false, tokenId: null, contractAddress: null, price: "" })}>
            <div className={`w-full max-w-sm mx-4 p-6 relative rounded-2xl backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${style.hex}40, transparent)`, backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite", padding: "2px", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {isGenesisModal ? "List Genesis" : "List Scent"} #{listingModal.tokenId}
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>{RARITY[rarity]}</span>
                </div>
                <p className="text-white/60 text-sm mb-5">Set your price in USDC</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Price (USDC)</label>
                    <input type="number" step="0.01" min="0.01" placeholder="e.g. 10.00" value={listingModal.price} onChange={(e) => setListingModal({ ...listingModal, price: e.target.value })} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/30" />
                  </div>
                  {listingStatus === "approving" && (<div className="text-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div><p className="text-sm text-white/80 font-medium">Approving marketplace...</p></div>)}
                  {listingStatus === "listing" && (<div className="text-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div><p className="text-sm text-white/80 font-medium">Creating listing...</p></div>)}
                  {listingStatus === "success" && (<div className="text-center py-4"><div className="text-4xl mb-2">✓</div><p className="text-emerald-400 font-bold">Successfully listed!</p></div>)}
                  {listingStatus === "idle" && (
                    <div className="flex gap-2">
                      <button onClick={() => setListingModal({ open: false, tokenId: null, contractAddress: null, price: "" })} className="flex-1 py-3 bg-black/30 border border-white/10 text-white/70 rounded-lg hover:bg-black/40 transition-colors font-medium">Cancel</button>
                      <button onClick={handleListConfirm} disabled={!listingModal.price || parseFloat(listingModal.price) <= 0} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">List NFT</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
