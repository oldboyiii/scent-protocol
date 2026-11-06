"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { getAlchemyContract, getUSDCContract, getContract, CONTRACT_ADDRESS } from "@/utils/contract";
import { getCollectionByAddress } from "@/utils/collection";
import AlchemyReveal from "@/components/AlchemyReveal";
import ScentCrest from "@/components/ScentCrest";

const ALCHEMY_ADDRESS = "0xd5c962b1dBaa6044E88B4c2bBe2dD5A257702e40";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ALCHEMY_FEE_USDC = "0.1";

interface SelectedNFT {
  tokenId: number;
  contractAddress: string;
  name: string;
  rarity: number;
  gender: number;
  pType: number;
  concentration: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  creator: string;
}

const GENDER = ["Male", "Female", "Unisex"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];
const RARITY = ["Common", "Rare", "Epic", "Legendary"];

const RARITY_STYLE: Record<number, { bg: string; border: string; badge: string; text: string; glow: string; hex: string; }> = {
  0: { bg: "from-slate-800/80 via-slate-700/60 to-slate-900/80", border: "border-slate-500/40", badge: "bg-slate-500/30 text-slate-200 border-slate-400/50", text: "text-slate-200", glow: "shadow-[0_0_30px_rgba(148,163,184,0.15)]", hex: "#94a3b8" },
  1: { bg: "from-blue-800/80 via-blue-600/60 to-indigo-900/80", border: "border-blue-400/50", badge: "bg-blue-500/30 text-blue-100 border-blue-400/50", text: "text-blue-100", glow: "shadow-[0_0_40px_rgba(96,165,250,0.25)]", hex: "#60a5fa" },
  2: { bg: "from-purple-800/80 via-fuchsia-600/60 to-purple-900/80", border: "border-purple-400/50", badge: "bg-purple-500/30 text-purple-100 border-purple-400/50", text: "text-purple-100", glow: "shadow-[0_0_40px_rgba(192,132,252,0.25)]", hex: "#c084fc" },
  3: { bg: "from-amber-700/90 via-orange-600/70 to-amber-900/90", border: "border-amber-400/60", badge: "bg-amber-500/40 text-amber-100 border-amber-400/60", text: "text-amber-100", glow: "shadow-[0_0_50px_rgba(251,191,36,0.35)]", hex: "#fbbf24" },
};

export default function AlchemyPage() {
  const { address, isConnected } = useAccount();
  const [slot1, setSlot1] = useState<SelectedNFT | null>(null);
  const [slot2, setSlot2] = useState<SelectedNFT | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const [userNFTs, setUserNFTs] = useState<SelectedNFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const loadUserNFTs = async () => {
    if (!address) return;
    setIsLoadingNFTs(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const mainContract = getContract(provider);
      
      const tokenIds = await mainContract.getOwnerTokens(address);
      const nfts: SelectedNFT[] = [];

      for (const id of tokenIds) {
        try {
          const perfume = await mainContract.getPerfume(id);
          if (perfume && perfume.name) {
            nfts.push({
              tokenId: Number(id),
              contractAddress: CONTRACT_ADDRESS,
              name: perfume.name,
              rarity: Number(perfume.rarity),
              gender: Number(perfume.gender),
              pType: Number(perfume.pType),
              concentration: Number(perfume.concentration),
              topNotes: Array.from(perfume.topNotes || []).map((n: any) => String(n)),
              heartNotes: Array.from(perfume.heartNotes || []).map((n: any) => String(n)),
              baseNotes: Array.from(perfume.baseNotes || []).map((n: any) => String(n)),
              creator: perfume.creator,
            });
          }
        } catch (e) { /* skip invalid */ }
      }
      setUserNFTs(nfts);
    } catch (err) {
      console.error("Failed to load user NFTs:", err);
      setError("Failed to load your NFTs. Please try again.");
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const openSelector = (slot: 1 | 2) => {
    setActiveSlot(slot);
    setShowSelector(true);
    loadUserNFTs();
  };

  const selectNFT = (nft: SelectedNFT) => {
    if (activeSlot === 1 && slot2?.tokenId === nft.tokenId && slot2?.contractAddress === nft.contractAddress) {
      setError("Cannot use the same NFT in both slots.");
      return;
    }
    if (activeSlot === 2 && slot1?.tokenId === nft.tokenId && slot1?.contractAddress === nft.contractAddress) {
      setError("Cannot use the same NFT in both slots.");
      return;
    }

    if (activeSlot === 1) setSlot1(nft);
    else setSlot2(nft);
    
    setShowSelector(false);
    setError(null);
  };

  const handleAlchemy = async () => {
    if (!isConnected || !address || !slot1 || !slot2) return;
    if (slot1.tokenId === slot2.tokenId && slot1.contractAddress === slot2.contractAddress) {
      setError("You cannot blend an NFT with itself.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const alchemyContract = getAlchemyContract(signer);
      const usdcContract = getUSDCContract(signer);
      const mainContract = getContract(signer);

      const feeWei = ethers.parseUnits(ALCHEMY_FEE_USDC, 6);

      const balance = await usdcContract.balanceOf(address);
      if (balance < feeWei) {
        throw new Error(`Insufficient USDC. You need at least ${ALCHEMY_FEE_USDC} USDC.`);
      }

      const allowance = await usdcContract.allowance(address, ALCHEMY_ADDRESS);
      if (allowance < feeWei) {
        const approveUsdcTx = await usdcContract.approve(ALCHEMY_ADDRESS, ethers.MaxUint256);
        await approveUsdcTx.wait();
      }

      const isApproved = await mainContract.isApprovedForAll(address, ALCHEMY_ADDRESS);
      if (!isApproved) {
        const approveNftTx = await mainContract.setApprovalForAll(ALCHEMY_ADDRESS, true);
        await approveNftTx.wait();
      }

      const blendTx = await alchemyContract.blend(
        slot1.tokenId,
        slot2.tokenId,
        { gasLimit: 500000 }
      );
      
      await blendTx.wait();
      setShowReveal(true);
      
    } catch (err: any) {
      console.error("Alchemy failed:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user.");
      } else {
        setError(err.reason || err.message || "Alchemy failed. Check console.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 relative z-10">
      <Link href="/collection" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-colors">
        ← Back to Collection
      </Link>

      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-500 bg-clip-text text-transparent">
          Scent Alchemy Lab
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Fuse two existing fragrance NFTs to forge a completely new <span className="text-cyan-400 font-semibold">Hybrid</span>. 
          The process is irreversible: the parent NFTs will be permanently burned.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 my-12">
        <AlchemySlot nft={slot1} onClick={() => openSelector(1)} />
        <div className="text-4xl text-cyan-400 animate-pulse">⚗️</div>
        <AlchemySlot nft={slot2} onClick={() => openSelector(2)} />
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
          <p className="text-sm text-white/60">Alchemy Fee</p>
          <p className="text-2xl font-bold text-cyan-400">{ALCHEMY_FEE_USDC} USDC</p>
          <p className="text-xs text-white/40">+ Burning of the 2 selected NFTs</p>
        </div>

        <button
          onClick={handleAlchemy}
          disabled={!isConnected || !slot1 || !slot2 || isProcessing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isProcessing ? "Forging Hybrid..." : "Initiate Alchemy (Burn & Forge)"}
        </button>
        
        {!isConnected && (
          <p className="text-center text-sm text-white/40">Connect your wallet to begin.</p>
        )}
      </div>

      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowSelector(false)}>
          <div className="relative w-full max-w-5xl bg-slate-900/95 border border-white/10 rounded-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Select an NFT from your Wallet</h3>
              <button onClick={() => setShowSelector(false)} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            
            {isLoadingNFTs ? (
              <div className="text-center py-12 text-white/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                Loading your NFTs...
              </div>
            ) : userNFTs.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                No NFTs found in your wallet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                  <button
                    key={nft.tokenId}
                    onClick={() => selectNFT(nft)}
                    className="text-left group"
                  >
                    <NFTCard nft={nft} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showReveal && slot1 && slot2 && (
        <AlchemyReveal 
          parent1Name={slot1.name} 
          parent2Name={slot2.name} 
          onComplete={() => {
            window.location.href = "/collection";
          }} 
        />
      )}
    </div>
  );
}

function AlchemySlot({ nft }: { nft: SelectedNFT | null; onClick: () => void }) {
  const style = nft ? RARITY_STYLE[nft.rarity] || RARITY_STYLE[0] : RARITY_STYLE[0];

  return (
    <button
      onClick={onClick}
      className={`relative w-72 h-96 rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden group
        ${nft 
          ? `${style.border} border-solid shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:scale-105` 
          : "border-white/20 border-dashed bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-900/10"
        }`}
    >
      {nft ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-90`} />
      ) : null}
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {nft ? (
          <>
            <div className="mb-4">
              <ScentCrest 
                seed={`${nft.creator}-${nft.name}`} 
                name={nft.name} 
                rarity={nft.rarity} 
                size={80} 
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                ScentProtocol #{nft.tokenId}
              </p>
              <p className="text-xl font-bold text-white leading-tight mb-2">{nft.name}</p>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
                  {RARITY[nft.rarity]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs justify-center">
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
                  {GENDER[nft.gender]}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
                  {TYPE[nft.pType]}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
                  {nft.concentration}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors mb-4">
              <svg className="w-10 h-10 text-white/40 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-white/60 font-medium text-lg">Select NFT</p>
            <p className="text-white/40 text-sm mt-2">Click to choose</p>
          </>
        )}
      </div>
    </button>
  );
}

function NFTCard({ nft }: { nft: SelectedNFT }) {
  const style = RARITY_STYLE[nft.rarity] || RARITY_STYLE[0];

  return (
    <div className={`relative rounded-xl p-4 backdrop-blur-xl bg-gradient-to-br ${style.bg} ${style.border} border overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex items-start gap-3 mb-3">
        <ScentCrest 
          seed={`${nft.creator}-${nft.name}`} 
          name={nft.name} 
          rarity={nft.rarity} 
          size={50} 
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 uppercase tracking-wider">Scent #{nft.tokenId}</p>
          <h4 className="text-lg font-bold text-white truncate">{nft.name}</h4>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full border backdrop-blur-md ${style.badge}`}>
          {RARITY[nft.rarity]}
        </span>
      </div>

      <div className="relative flex flex-wrap gap-1.5 text-xs mb-3">
        <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
          {GENDER[nft.gender]}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
          {TYPE[nft.pType]}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-black/30 text-white/70 border border-white/10">
          {nft.concentration}%
        </span>
      </div>

      <div className="relative space-y-2">
        <div>
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Top Notes</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {nft.topNotes.slice(0, 2).map((note, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-black/30 text-amber-200 text-[10px] border border-amber-500/30">
                {note}
              </span>
            ))}
            {nft.topNotes.length > 2 && (
              <span className="px-1.5 py-0.5 text-[10px] text-white/40">+{nft.topNotes.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-white/50">Click to select</span>
        <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </div>
    </div>
  );
}
