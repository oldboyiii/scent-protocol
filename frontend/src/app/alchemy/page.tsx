"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { getAlchemyContract, getUSDCContract, getContract, CONTRACT_ADDRESS, PerfumeData } from "@/utils/contract";
import { COLLECTIONS, getCollectionByAddress } from "@/utils/collection";

const ALCHEMY_ADDRESS = "0xd5c962b1dBaa6044E88B4c2bBe2dD5A257702e40";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ALCHEMY_FEE_USDC = "0.1"; // 0.1 USDC

interface SelectedNFT {
  tokenId: number;
  contractAddress: string;
  name: string;
  rarity: number;
}

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

  // Fetch user's NFTs from the main contract when modal opens
  const loadUserNFTs = async () => {
    if (!address) return;
    setIsLoadingNFTs(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const mainContract = getContract(provider);
      
      // Fetch token IDs owned by the user
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
    // Prevent selecting the same NFT in both slots
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

      const feeWei = ethers.parseUnits(ALCHEMY_FEE_USDC, 6);

      // 1. Check USDC Balance
      const balance = await usdcContract.balanceOf(address);
      if (balance < feeWei) {
        throw new Error(`Insufficient USDC. You need at least ${ALCHEMY_FEE_USDC} USDC.`);
      }

      // 2. Approve USDC if needed
      const allowance = await usdcContract.allowance(address, ALCHEMY_ADDRESS);
      if (allowance < feeWei) {
        const approveTx = await usdcContract.approve(ALCHEMY_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      // 3. Ensure NFTs are approved for the Alchemy contract to burn them
      // (Note: In a production app, you'd check isApprovedForAll for each specific contract)
      
      // 4. Execute Blend
      // Using the robust signature: blend(address nft1, uint256 id1, address nft2, uint256 id2)
      // If your contract uses blend(uint256, uint256), adjust accordingly.
      const blendTx = await alchemyContract.blend(
        slot1.contractAddress,
        slot1.tokenId,
        slot2.contractAddress,
        slot2.tokenId,
        { gasLimit: 500000 }
      );
      
      await blendTx.wait();

      // Success: Redirect to the newly minted hybrid (we can fetch the nextHybridId or just redirect to collection)
      alert("🧪 Alchemy Successful! A new Hybrid has been forged.");
      window.location.href = "/collection";
      
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

  const getRarityColor = (rarity: number) => {
    const colors = ["border-slate-500/50", "border-blue-500/50", "border-purple-500/50", "border-amber-500/50"];
    return colors[rarity] || colors[0];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
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

      {/* Alchemy Slots */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 my-12">
        {/* Slot 1 */}
        <AlchemySlot 
          nft={slot1} 
          onClick={() => openSelector(1)} 
          getRarityColor={getRarityColor}
        />
        
        {/* Fusion Icon */}
        <div className="text-4xl text-cyan-400 animate-pulse">⚗️</div>
        
        {/* Slot 2 */}
        <AlchemySlot 
          nft={slot2} 
          onClick={() => openSelector(2)} 
          getRarityColor={getRarityColor}
        />
      </div>

      {/* Action Area */}
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

      {/* NFT Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSelector(false)}>
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Select an NFT from your Wallet</h3>
            
            {isLoadingNFTs ? (
              <div className="text-center py-8 text-white/50">Loading your NFTs...</div>
            ) : userNFTs.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No NFTs found in your wallet. <br/>
                <span className="text-xs">Note: Currently only main ScentProtocol V3 NFTs are shown in this selector.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                  <button
                    key={nft.tokenId}
                    onClick={() => selectNFT(nft)}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-900/20 transition-all text-left group"
                  >
                    <p className="text-xs text-white/40 mb-1">#{nft.tokenId}</p>
                    <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300">{nft.name}</p>
                    <p className="text-xs text-white/50 mt-1">Rarity: {["Common", "Rare", "Epic", "Legendary"][nft.rarity]}</p>
                  </button>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setShowSelector(false)}
              className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for the Slots
function AlchemySlot({ nft, onClick, getRarityColor }: { nft: SelectedNFT | null; onClick: () => void; getRarityColor: (r: number) => string }) {
  const collection = nft ? getCollectionByAddress(nft.contractAddress) : null;

  return (
    <button
      onClick={onClick}
      className={`relative w-64 h-80 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 group
        ${nft 
          ? `bg-slate-900/80 ${getRarityColor(nft.rarity)} border-solid shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:scale-105` 
          : "border-white/20 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-900/10"
        }`}
    >
      {nft ? (
        <>
          <div className="text-4xl">🧴</div>
          <div className="text-center px-4">
            <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">{collection?.name || "Scent"} #{nft.tokenId}</p>
            <p className="text-lg font-bold text-white leading-tight">{nft.name}</p>
            <p className="text-xs text-white/50 mt-2">Click to change</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
            <svg className="w-8 h-8 text-white/40 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-white/60 font-medium">Select NFT</p>
        </>
      )}
    </button>
  );
}
