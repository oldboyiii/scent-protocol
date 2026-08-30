"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { fetchActiveListings, buyNFT } from "@/utils/marketplace";
// Import your wallet hook/provider here, e.g., useAccount from wagmi or custom hook
// import { useWallet } from "@/context/WalletContext"; 

interface Listing {
  tokenId: number;
  seller: string;
  price: bigint;
  active: boolean;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  // const { signer, provider, address } = useWallet(); // Replace with your wallet logic

  useEffect(() => {
    const loadListings = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      try {
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
    // const signer = await (provider as any).getSigner();
    // try {
    //   await buyNFT(signer, listing.tokenId, ethers.formatUnits(listing.price, 6));
    //   alert("Purchase successful!");
    //   window.location.reload();
    // } catch (error) {
    //   console.error("Buy failed:", error);
    // }
    alert(`Buy logic for Token #${listing.tokenId} at ${ethers.formatUnits(listing.price, 6)} USDC`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading Marketplace...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4">Scent Marketplace</h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Buy and sell unique AI-generated digital perfumes. The first secondary market on Arc Network.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center text-white/50 py-20">
            <p className="text-xl">No active listings yet. Be the first to list a scent!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.tokenId} className="glass-card-luxury rounded-2xl p-6 relative group hover:scale-[1.02] transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/50">
                    Legendary
                  </span>
                  <span className="text-white/40 text-xs">#{listing.tokenId}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Scent #{listing.tokenId}</h3>
                <p className="text-white/50 text-sm mb-6 truncate">Seller: {listing.seller}</p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs text-white/40 uppercase">Price</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {ethers.formatUnits(listing.price, 6)} USDC
                    </span>
                  </div>
                  <button 
                    onClick={() => handleBuy(listing)}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all"
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
