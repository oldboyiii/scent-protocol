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
            if (accounts && accounts.length > 0) setWalletReady(true);
          } catch {}
        }
      };
      checkDirectly();
      setTimeout(() => setWalletReady(true), 2000);
    }
  }, [address]);

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
        const results: StoredScent[] = [];

        // Fetch ScentProtocol
        try {
          const contract = w.ethereum ? getContract(new ethers.BrowserProvider(w.ethereum)) : getContract(new ethers.JsonRpcProvider("https://rpc.testnet.arc.network"));
          const balance = await contract.balanceOf(currentAddress);
          const balanceNum = Number(balance);

          if (balanceNum > 0) {
            let foundCount = 0;
            for (let tokenId = 1; tokenId <= 100 && foundCount < balanceNum; tokenId++) {
              try {
                const owner = await contract.ownerOf(tokenId);
                if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                  const perfume = await contract.getPerfume(tokenId);
                  let isListed = false;
                  try {
                    const listing = await marketplace.listings(tokenId);
                    isListed = listing && listing.active;
                  } catch (e) {}

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
                      topNotes: Array.from(perfume.topNotes || []),
                      heartNotes: Array.from(perfume.heartNotes || []),
                      baseNotes: Array.from(perfume.baseNotes || []),
                      concentration: Number(perfume.concentration),
                      rarity: Number(perfume.rarity),
                      createdAt: Number(perfume.createdAt),
                      creator: perfume.creator,
                    },
                  });
                  foundCount++;
                }
              } catch (e) {}
              await new Promise(r => setTimeout(r, 100));
            }
          }
        } catch (e) {
          console.error("ScentProtocol error:", e);
        }

        // Fetch Genesis
        try {
          const genesisContract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, provider);
          const genesisBalance = await genesisContract.balanceOf(currentAddress);
          const genesisBalanceNum = Number(genesisBalance);

          if (genesisBalanceNum > 0) {
            let foundCount = 0;
            for (let tokenId = 1; tokenId <= 100 && foundCount < genesisBalanceNum; tokenId++) {
              try {
                const owner = await genesisContract.ownerOf(tokenId);
                if (owner.toLowerCase() === currentAddress.toLowerCase()) {
                  const data = await genesisContract.getPerfume(tokenId);
                  let isListed = false;
                  try {
                    const listing = await marketplace.listings(tokenId);
                    isListed = listing && listing.active;
                  } catch (e) {}

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
                      topNotes: Array.from(data.topNotes || []),
                      heartNotes: Array.from(data.heartNotes || []),
                      baseNotes: Array.from(data.baseNotes || []),
                      concentration: Number(data.concentration),
                      rarity: Number(data.rarity),
                      createdAt: Number(data.createdAt),
                      creator: data.creator,
                    },
                  });
                  foundCount++;
                }
              } catch (e) {}
              await new Promise(r => setTimeout(r, 100));
            }
          }
        } catch (e) {
          console.error("Genesis error:", e);
        }

        setScents(results);
      } catch (e) {
        console.error("Collection error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [walletReady, address]);

  const filteredScents = scents.filter(s => {
    if (filterBy === "all") return true;
    if (filterBy === "genesis") return s.contractAddress === GENESIS_CONTRACT_ADDRESS;
    return s.contractAddress === NFT_CONTRACT_ADDRESS;
  });

  const sortedScents = [...filteredScents].sort((a, b) => {
    switch (sortBy) {
      case "newest": return b.tokenId - a.tokenId;
      case "oldest": return a.tokenId - b.tokenId;
      case "name": return (a.perfume?.name || "").localeCompare(b.perfume?.name || "");
      case "rarity": return (b.perfume?.rarity ?? 0) - (a.perfume?.rarity ?? 0);
      default: return 0;
    }
  });

  const handleListClick = (tokenId: number, contractAddress: string) => {
    setListingModal({ open: true, tokenId, contractAddress, price: "" });
    setListingStatus("idle");
  };

  const handleListConfirm = async () => {
    if (!listingModal.tokenId || !listingModal.price || !listingModal.contractAddress) return;
    try {
      setListingStatus("approving");
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const nftContract = new ethers.Contract(listingModal.contractAddress, NFT_ABI, signer);
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const isApproved = await nftContract.isApprovedForAll(userAddress, MARKETPLACE_ADDRESS);
      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await approveTx.wait();
      }

      setListingStatus("listing");
      const priceInUSDC = ethers.parseUnits(listingModal.price, 6);
      const listTx = await marketplaceContract.list(listingModal.contractAddress, listingModal.tokenId, priceInUSDC);
      await listTx.wait();

      setListingStatus("success");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error("Listing failed:", error);
      alert(error.code === 4001 ? "Rejected" : error.shortMessage || error.message);
      setListingStatus("idle");
    }
  };

  const handleCancelListing = async (tokenId: number) => {
    if (!confirm(`Remove Scent #${tokenId}?`)) return;
    try {
      setListingStatus("listing");
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const cancelTx = await marketplaceContract.cancel(tokenId);
      await cancelTx.wait();

      alert("Removed!");
      setListingStatus("idle");
      window.location.reload();
    } catch (error: any) {
      console.error("Cancel failed:", error);
      alert(error.shortMessage || error.message);
      setListingStatus("idle");
    }
  };

  if (!walletReady || loading) {
    return <div className="max-w-6xl mx-auto px-4 py-12"><h1 className="text-4xl font-bold text-center mb-8">My Collection</h1><div className="grid gap-6 md:grid-cols-3">{Array(6).fill(0).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)}</div></div>;
  }

  if (!address) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><h1 className="text-3xl font-bold mb-4">Connect Wallet</h1><p className="text-white/50">Connect to see your collection</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center">My Collection</h1>
      <p className="text-center text-white/50">{scents.length} collected</p>

      <div className="flex gap-3 justify-center flex-wrap">
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as CollectionFilter)} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
          <option value="all">All</option>
          <option value="scents">ScentProtocol</option>
          <option value="genesis">Genesis</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rarity">Rarity</option>
        </select>
      </div>

      {sortedScents.length === 0 ? (
        <div className="text-center py-20"><p className="text-white/40 text-lg">No NFTs yet</p><Link href="/" className="text-amber-400 hover:underline">Mint now →</Link></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedScents.map((s) => {
            const perfume = s.perfume!;
            const rarity = perfume.rarity;
            const isGenesis = s.contractAddress === GENESIS_CONTRACT_ADDRESS;
            const style = isGenesis ? { bg: "from-amber-950/90 via-orange-900/80 to-amber-950/90", border: "border-amber-400/70", badge: "bg-amber-500/50 text-amber-50", glow: "shadow-[0_0_80px_rgba(251,191,36,0.5)]", hex: "#fbbf24" } : RARITY_STYLE[rarity] || RARITY_STYLE[0];

            return (
              <div key={`${s.contractAddress}-${s.tokenId}`} className={`group relative rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow} hover:scale-105 transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-white/40">{isGenesis ? "Genesis" : "Scent"} #{s.tokenId}</p>
                    <h3 className="text-xl font-bold text-white">{perfume.name}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.badge}`}>{RARITY[rarity]}</span>
                </div>

                <div className="flex gap-2 text-xs mb-4">
                  <span className="px-2 py-0.5 rounded bg-black/30">{GENDER[perfume.gender]}</span>
                  <span className="px-2 py-0.5 rounded bg-black/30">{TYPE[perfume.pType]}</span>
                  <span className="px-2 py-0.5 rounded bg-black/30">{perfume.concentration}%</span>
                </div>

                <div className="text-xs text-white/30 space-y-1 mb-4">
                  <p>Top: {perfume.topNotes.join(", ")}</p>
                  <p>Creator: {perfume.creator.slice(0, 6)}...{perfume.creator.slice(-4)}</p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/nft/${s.tokenId}`} className="text-sm text-white/50 hover:text-white flex-1 text-center">Details →</Link>
                  {s.isListed ? (
                    <button onClick={() => handleCancelListing(s.tokenId)} disabled={listingStatus === "listing"} className="px-3 py-1.5 rounded bg-rose-500 text-white text-xs font-bold disabled:opacity-50">
                      {listingStatus === "listing" ? "..." : "Remove"}
                    </button>
                  ) : (
                    <button onClick={() => handleListClick(s.tokenId, s.contractAddress)} className="px-3 py-1.5 rounded bg-emerald-500 text-white text-xs font-bold">
                      List
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {listingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setListingModal({ open: false, tokenId: null, contractAddress: null, price: "" })}>
          <div className="bg-slate-900 p-6 rounded-2xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">List #{listingModal.tokenId}</h3>
            <input type="number" step="0.01" min="0.01" placeholder="Price (USDC)" value={listingModal.price} onChange={(e) => setListingModal({...listingModal, price: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setListingModal({ open: false, tokenId: null, contractAddress: null, price: "" })} className="flex-1 py-2 bg-white/10 rounded">Cancel</button>
              <button onClick={handleListConfirm} disabled={!listingModal.price} className="flex-1 py-2 bg-emerald-500 rounded font-bold disabled:opacity-50">List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
