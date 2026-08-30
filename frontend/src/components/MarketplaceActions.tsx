"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { checkIfListed, listNFT, buyNFT, cancelListing, getArcProvider } from "@/utils/marketplace";

interface MarketplaceActionsProps {
  tokenId: number;
  nftContractAddress: string;
  ownerAddress: string;
  userAddress: string | undefined;
  signer: ethers.Signer | null;
}

export default function MarketplaceActions({ 
  tokenId, 
  nftContractAddress, 
  ownerAddress,
  userAddress,
  signer
}: MarketplaceActionsProps) {
  const [isListed, setIsListed] = useState(false);
  const [listingPrice, setListingPrice] = useState<string>("");
  const [showListForm, setShowListForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = userAddress?.toLowerCase() === ownerAddress?.toLowerCase();

  useEffect(() => {
    const checkListing = async () => {
      try {
        // Use the Arc-specific provider that disables ENS
        const provider = getArcProvider();
        const data = await checkIfListed(provider, tokenId);
        setIsListed(data.active);
        if (data.active) {
          setListingPrice(ethers.formatUnits(data.price, 6));
        }
      } catch (error) {
        console.error("Failed to check listing:", error);
      }
    };
    checkListing();
  }, [tokenId]);

  const handleList = async () => {
    if (!signer || !listingPrice || parseFloat(listingPrice) <= 0) return;
    setLoading(true);
    try {
      await listNFT(signer, nftContractAddress, tokenId, listingPrice);
      setIsListed(true);
      setShowListForm(false);
      alert(`Successfully listed Scent #${tokenId} for ${listingPrice} USDC!`);
    } catch (error) {
      console.error("Listing failed:", error);
      alert("Failed to list. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!signer || !listingPrice) return;
    setLoading(true);
    try {
      await buyNFT(signer, tokenId, listingPrice);
      alert(`Successfully purchased Scent #${tokenId}!`);
      window.location.reload(); 
    } catch (error) {
      console.error("Buy failed:", error);
      alert("Purchase failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      await cancelListing(signer, tokenId);
      setIsListed(false);
      alert(`Successfully cancelled listing for Scent #${tokenId}`);
    } catch (error) {
      console.error("Cancel failed:", error);
      alert("Failed to cancel. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (!userAddress) {
    return (
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-center text-white/40 text-sm italic">
          Connect your wallet to view marketplace actions.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <span>🏪</span> Marketplace Actions
      </h3>
      
      {isOwner && !isListed && showListForm && (
        <div className="space-y-3 p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
          <label className="text-sm text-white/60">Set Price (USDC)</label>
          <input 
            type="number" 
            step="0.01"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none transition-colors"
            placeholder="e.g., 15.50"
          />
          <div className="flex gap-2">
            <button 
              onClick={handleList}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Confirm List"}
            </button>
            <button 
              onClick={() => { setShowListForm(false); setListingPrice(""); }}
              className="px-4 py-2.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isOwner && !isListed && !showListForm && (
        <button 
          onClick={() => setShowListForm(true)}
          className="w-full py-3 rounded-xl bg-white/5 border border-amber-500/30 text-amber-300 font-semibold hover:bg-amber-500/10 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2"
        >
          <span>🏷️</span> List for Sale
        </button>
      )}

      {isOwner && isListed && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-emerald-300 font-medium">Listed for {listingPrice} USDC</span>
            <span className="text-xs text-emerald-400/60 bg-emerald-500/20 px-2 py-1 rounded">Active</span>
          </div>
          <button 
            onClick={handleCancel}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : "Cancel Listing"}
          </button>
        </div>
      )}

      {!isOwner && isListed && (
        <button 
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? "Processing..." : ` Buy for ${listingPrice} USDC`}
        </button>
      )}

      {!isOwner && !isListed && (
        <p className="text-center text-white/40 text-sm italic py-2">
          This scent is not currently listed for sale.
        </p>
      )}
    </div>
  );
}
