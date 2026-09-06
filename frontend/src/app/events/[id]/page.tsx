"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [minting, setMinting] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [timeLeft, setTimeLeft] = useState<any>(null);

  // Mock data — заменим на реальные данные из контракта
  const event = {
    id: "genesis",
    name: "Genesis Collection",
    contractAddress: "0x...", // после деплоя
    maxSupply: 1000,
    price: "1",
    endTime: Math.floor(new Date("2025-09-18T00:00:00Z").getTime() / 1000),
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      if (now < event.endTime) {
        const diff = event.endTime - now;
        setTimeLeft({
          days: Math.floor(diff / 86400),
          hours: Math.floor((diff % 86400) / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleMint = async () => {
    setMinting(true);
    try {
      // Здесь будет логика минта через контракт
      // const contract = new ethers.Contract(event.contractAddress, ABI, signer);
      // const tx = await contract.mint({ value: ethers.parseUnits(event.price, 6) });
      // await tx.wait();
      
      alert("Mint successful! Check your Collection.");
      setMintedCount((prev) => prev + 1);
      setUserMinted((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mint failed:", error);
      alert(error.message || "Mint failed");
    } finally {
      setMinting(false);
    }
  };

  const progress = (mintedCount / event.maxSupply) * 100;

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 relative z-10">
      {/* Back button */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      {/* Hero */}
      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30 mb-4">
          Live Now
        </span>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent leading-[1.2] pb-4">
          {event.name}
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          The first 1000 AI-generated fragrances on Arc Mainnet. 
          Limited edition with enhanced Legendary drop rate.
        </p>
      </div>

      {/* Countdown */}
      {timeLeft && (
        <div className="mb-12">
          <p className="text-center text-xs text-white/40 uppercase tracking-wider mb-4">
            Event ends in
          </p>
          <div className="flex justify-center gap-4 max-w-2xl mx-auto">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="flex-1 bg-black/30 rounded-2xl p-6 border border-amber-500/20">
                <div className="text-4xl md:text-5xl font-bold text-amber-400 text-center">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="text-xs text-white/40 text-center mt-2 uppercase">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mint Card */}
      <div className="bg-gradient-to-br from-slate-900/90 via-purple-900/50 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 mb-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-white/60">Minted</span>
            <span className="text-white/60">
              {mintedCount} / {event.maxSupply}
            </span>
          </div>
          <div className="h-4 bg-black/30 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2 text-center">
            {progress.toFixed(1)}% minted • {event.maxSupply - mintedCount} remaining
          </p>
        </div>

        {/* Price & Action */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-black/20 rounded-2xl border border-white/10">
          <div className="text-center md:text-left">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Price per NFT</p>
            <p className="text-4xl font-bold text-white">
              {event.price} <span className="text-xl text-emerald-400">USDC</span>
            </p>
            <p className="text-xs text-white/40 mt-2">Max 3 per wallet • You minted: {userMinted}/3</p>
          </div>

          <button
            onClick={handleMint}
            disabled={minting || userMinted >= 3}
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {minting ? "Minting..." : userMinted >= 3 ? "Max Reached" : "Mint Now"}
          </button>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">15% Legendary</p>
            <p className="text-xs text-white/60">Enhanced drop rate vs 5% standard</p>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Genesis Badge</p>
            <p className="text-xs text-white/60">Exclusive badge on all NFTs</p>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
            <p className="text-amber-400 text-sm font-bold mb-1">Priority Access</p>
            <p className="text-xs text-white/60">Early access to future drops</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">What is Genesis Collection?</h3>
          <p className="text-sm text-white/60 leading-relaxed">
            Genesis Collection marks the launch of ScentProtocol on Arc Mainnet. 
            Each NFT is a unique AI-generated fragrance formula with enhanced rarity rates. 
            Holders receive lifetime priority access to all future drops and events.
          </p>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">Where to view my NFTs?</h3>
          <p className="text-sm text-white/60 leading-relaxed">
            All minted NFTs appear in your <Link href="/collection" className="text-amber-400 hover:underline">Collection</Link> page. 
            Genesis NFTs are marked with a special badge and can be listed on the <Link href="/marketplace" className="text-amber-400 hover:underline">Marketplace</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
