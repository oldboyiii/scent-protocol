"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { getContract } from "@/utils/contract";
import { useWallet } from "@/context/WalletContext";
import ShareCard from "@/components/ShareCard";

const MARKETPLACE_ADDRESS = "0x23d2F6655F23D245348ce6Db11e07eab823E6D66";
const NFT_CONTRACT_ADDRESS = "0x423DCe4Fd7073b0E33B96354bC706ecc9c3B0bd1";

const MARKETPLACE_ABI = [
  "function list(uint256 tokenId, uint256 price)",
  "function listings(uint256) view returns (address seller, uint256 price, bool active)"
];

const NFT_ABI = [
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

interface StoredScent {
  tokenId: number;
  name?: string;
  rarity?: number;
  timestamp: number;
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

export default function CollectionPage() {
  const [scents, setScents] = useState<StoredScent[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
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
        let contract;
        const w = window as any;
        if (w.ethereum) {
          const browserProvider = new ethers.BrowserProvider(w.ethereum);
          contract = getContract(browserProvider);
        } else {
          const fallbackProvider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
          contract = getContract(fallbackProvider);
        }

        const balance = await contract.balanceOf(currentAddress);
        const balanceNum = Number(balance);

        if (balanceNum === 0) {
          setScents([]);
          setLoading(false);
          return;
        }

        const results: StoredScent[] = [];
        let foundCount = 0;
        const maxId = 60;

        for (let tokenId = 1; tokenId <= maxId && foundCount < balanceNum; tokenId++) {
          try {
            const perfume = await contract.getPerfume(tokenId);
            
            if (perfume.creator && perfume.creator.toLowerCase() === currentAddress.toLowerCase()) {
              results.push({
                tokenId,
                name: perfume.name,
                rarity: Number(perfume.rarity),
                timestamp: Number(perfume.createdAt) * 1000,
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
                description: undefined,
              });
              foundCount++;
            }
          } catch (e) {}
          
          await new Promise(r => setTimeout(r, 50));
        }

        setScents(results.sort((a, b) => b.tokenId - a.tokenId));
      } catch (e) {
        console.error("Collection fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCollection();
  }, [walletReady, address]);

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

      // Check if marketplace is approved
      const isApproved = await nftContract.isApprovedForAll(userAddress, MARKETPLACE_ADDRESS);
      
      if (!isApproved) {
        console.log("Approving marketplace...");
        const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await approveTx.wait();
      }

      // List the NFT
      setListingStatus("listing");
      const priceInUSDC = ethers.parseUnits(listingModal.price, 6);
      console.log("Listing NFT...");
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

  if (!walletReady || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">
          My Collection
        </h1>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
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
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 to-rose-500 bg-clip-text text-transparent text-center leading-[1.3] pb-4">
        My Collection
      </h1>
      <p className="text-center text-white/50">
        {scents.length} scent{scents.length !== 1 ? "s" : ""} collected
      </p>

      {scents.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <p className="text-lg mb-4">No scents in your collection yet.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Mint Your First Scent →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {scents.map((s) => {
            const hasFullData = !!s.perfume && s.perfume.topNotes;
            const perfume = hasFullData ? s.perfume! : null;
            const rarity = perfume?.rarity ?? s.rarity ?? 0;
            const style = RARITY_STYLE[rarity] || RARITY_STYLE[0];

            return (
              <div
                key={s.tokenId}
                className={`group relative rounded-2xl p-6 space-y-4 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.glow} border ${style.border} overflow-hidden transition-all duration-500 hover:scale-[1.02]`}
              >
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

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">
                      Scent #{s.tokenId}
                    </p>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {perfume?.name || s.name || `Scent #${s.tokenId}`}
                    </h3>
                  </div>
                  <span
                    className={`relative text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${style.badge}`}
                  >
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
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Heart Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.heartNotes.map((n) => (
                            <span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-rose-200 text-xs border border-rose-500/30">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider">Base Notes</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {perfume!.baseNotes.map((n) => (
                            <span key={n} className="px-2 py-0.5 rounded-md bg-black/30 text-emerald-200 text-xs border border-emerald-500/30">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {s.description && (
                      <div className="relative bg-black/30 rounded-lg p-3 text-sm text-white/70 italic border-l-2 border-white/10">
                        {s.description}
                      </div>
                    )}

                    <div className="relative text-xs text-white/30 space-y-0.5">
                      <p>Creator: {perfume!.creator}</p>
                      <p>Minted: {new Date(perfume!.createdAt * 1000).toLocaleString()}</p>
                    </div>

                    <div className="relative flex items-center justify-between pt-2 gap-2">
                      <Link href={`/nft/${s.tokenId}`} className="text-sm text-white/50 hover:text-white transition-colors">
                        View Details →
                      </Link>
                      <div className="flex gap-2">
                        <ShareCard tokenId={s.tokenId} perfume={perfume!} />
                        <button
                          onClick={() => handleListClick(s.tokenId)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
                        >
                          List for Sale
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative text-sm text-white/40">
                    <p>Legacy entry — full details not available.</p>
                    <p className="text-xs mt-1">Minted: {new Date(s.timestamp).toLocaleString()}</p>
                    <div className="flex items-center justify-between pt-4">
                      <Link href={`/nft/${s.tokenId}`} className="text-sm text-white/50 hover:text-white transition-colors">
                        View Details →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Modal */}
      {listingModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setListingModal({ open: false, tokenId: null, price: "" })}>
          <div className="glass-card w-full max-w-sm mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">List Scent #{listingModal.tokenId}</h3>
            <p className="text-white/40 text-sm mb-5">Set your price in USDC</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Price (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 10.00"
                  value={listingModal.price}
                  onChange={(e) => setListingModal({ ...listingModal, price: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>

              {listingStatus === "approving" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
                  <p className="text-sm text-white/70">Approving marketplace...</p>
                  <p className="text-xs text-white/40 mt-1">Please confirm in your wallet</p>
                </div>
              )}

              {listingStatus === "listing" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-sm text-white/70">Creating listing...</p>
                  <p className="text-xs text-white/40 mt-1">Please confirm in your wallet</p>
                </div>
              )}

              {listingStatus === "success" && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">✓</div>
                  <p className="text-emerald-400 font-bold">Successfully listed!</p>
                  <p className="text-xs text-white/40 mt-1">Redirecting...</p>
                </div>
              )}

              {listingStatus === "idle" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setListingModal({ open: false, tokenId: null, price: "" })}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleListConfirm}
                    disabled={!listingModal.price || parseFloat(listingModal.price) <= 0}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    List NFT
                  </button>
                </div>
              )}
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
