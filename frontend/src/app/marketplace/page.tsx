"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { fetchActiveListings, buyNFT, getArcSigner } from "@/utils/marketplace";

interface Listing {
  tokenId: number;
  seller: string;
  price: bigint;
  active: boolean;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const signer = await getArcSigner();
        const provider = signer.provider;
        
        if (!provider) throw new Error("Provider not found");
        
        const data = await fetchActiveListings(provider);
        setListings(data);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const handleBuy = async (listing: Listing) => {
    try {
      const signer = await getArcSigner();
      
      await buyNFT(signer, listing.tokenId, ethers.formatUnits(listing.price, 6));
      
      alert("Purchase successful!");
      window.location.reload(); 
    } catch (error: any) {
      console.error("Buy failed:", error);
      if (error.code === 4001) {
        alert("Transaction rejected by user.");
      } else {
        alert(`Purchase failed: ${error.message || "Check console"}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="animate-pulse text-xl font-bold tracking-wider">Loading Marketplace...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-4">
            Scent Marketplace
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Buy and sell unique AI-generated digital perfumes. The first secondary market on Arc Network.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center text-white/50 py-20 glass-card-luxury rounded-2xl p-8 border border-white/10">
            <p className="text-xl">No active listings yet.</p>
            <p className="mt-2 text-sm">Be the first to list a scent from your collection!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div 
                key={listing.tokenId} 
                className="glass-card-luxury rounded-2xl p-6 relative group hover:scale-[1.02] transition-all duration-300 border border-white/10 bg-slate-900/40 backdrop-blur-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/50">
                    Legendary
                  </span>
                  <span className="text-white/40 text-xs">#{listing.tokenId}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Scent #{listing.tokenId}</h3>
                <p className="text-white/50 text-sm mb-6 truncate">
                  Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs text-white/40 uppercase">Price</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {ethers.formatUnits(listing.price, 6)} USDC
                    </span>
                  </div>
                  <button 
                    onClick={() => handleBuy(listing)}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
