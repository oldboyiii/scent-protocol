"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";

const GENESIS_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // ЗАМЕНИТЬ ПОСЛЕ ДЕПЛОЯ

const GENESIS_ABI = [
  "function mint() external payable",
  "function totalMinted() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function mintedPerWallet(address) view returns (uint256)",
  "function maxPerWallet() view returns (uint256)",
];

export default function GenesisEventPage() {
  const { address } = useWallet();
  const [minting, setMinting] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [userMinted, setUserMinted] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  const maxSupply = 1000;
  const maxPerWallet = 3;

  // Обратный отсчёт до 16 сентября 2025 (или убери, если уже LIVE)
  useEffect(() => {
    const targetDate = new Date("2025-09-16T00:00:00Z").getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft(null); // Когда время придёт, меняем статус на LIVE
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMint = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    setMinting(true);
    try {
      const w = window as any;
      const provider = new ethers.BrowserProvider(w.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(GENESIS_CONTRACT_ADDRESS, GENESIS_ABI, signer);

      const tx = await contract.mint({ value: 0 }); // Free mint
      await tx.wait();

      alert("Mint successful! Check your Collection.");
      setTotalMinted((prev) => prev + 1);
      setUserMinted((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mint failed:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        alert("Transaction rejected by user.");
      } else {
        alert(error.message || "Mint failed");
      }
    } finally {
      setMinting(false);
    }
  };

  const progress = (totalMinted / maxSupply) * 100;

  return (
    <div className="relative min-h-screen py-16 px-4 overflow-hidden">
      {/* 1. BACKGROUND WATERMARK: Огромная едва заметная арка на фоне */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-[800px] h-[480px] text-amber-500 opacity-[0.03]">
          <path d="M20 100 Q100 -40 180 100" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back button */}
        <Link href="/events" className="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 mb-8 transition-colors group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        {/* 2. HERO SECTION с боковыми акцентами-арками */}
        <div className="text-center mb-12 relative">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-500/20 mb-6">
            {timeLeft ? "Coming Soon" : "Live Now"}
          </span>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 tracking-tight">
              GENESIS
            </h1>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
          
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            The first 1000 AI-generated fragrances on Arc Mainnet. 
            <span className="text-amber-400/80 font-medium"> Free mint </span> 
            to celebrate the launch with an enhanced 15% Legendary drop rate.
          </p>
        </div>

        {/* 3. CENTRAL ARCH & STATS: Арка как обрамление для цифры 1000 */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative w-64 h-32 flex items-end justify-center mb-4">
            {/* Светящаяся арка */}
            <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full text-amber-500/40 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <path d="M10 110 Q100 -20 190 110" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
            {/* Цифра внутри арки */}
            <span className="relative z-10 text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-500/80 pb-2 drop-shadow-lg">
              1000
            </span>
          </div>

          {/* Прогресс-бар как "фундамент" арки */}
          <div className="w-full max-w-md px-4">
            <div className="flex justify-between text-xs text-white/50 mb-2 uppercase tracking-wider">
              <span>Minted: {totalMinted}</span>
              <span>Remaining: {maxSupply - totalMinted}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-amber-400/80 mt-2 font-medium">
              {progress.toFixed(1)}% of the Genesis collection claimed
            </p>
          </div>
        </div>

        {/* 4. MINT ACTION CARD */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-8 border border-amber-500/20 shadow-2xl shadow-black/50 mb-12 relative overflow-hidden">
          {/* Внутреннее свечение карточки */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Mint Price</p>
              <p className="text-4xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                Free
              </p>
              <p className="text-sm text-white/50 mt-2">
                Max <span className="text-white font-medium">{maxPerWallet}</span> per wallet 
                <span className="mx-2 text-white/20">•</span> 
                You minted: <span className="text-amber-400 font-medium">{userMinted}</span>/{maxPerWallet}
              </p>
            </div>

            <button
              onClick={handleMint}
              disabled={minting || userMinted >= maxPerWallet || !!timeLeft}
              className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
            >
              {/* Блик на кнопке */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center gap-3">
                {minting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Minting...
                  </>
                ) : userMinted >= maxPerWallet ? (
                  "Max Reached"
                ) : timeLeft ? (
                  "Notify Me"
                ) : (
                  <>
                    {/* Мини-арка внутри кнопки */}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/90" fill="none">
                      <path d="M4 20 Q12 4 20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Mint Now
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "15% Legendary", desc: "Enhanced drop rate vs 5% standard" },
              { title: "Genesis Badge", desc: "Exclusive visual marker on all NFTs" },
              { title: "Priority Access", desc: "Early whitelist for future drops" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <div>
                  <p className="text-sm font-bold text-white/90">{feature.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. INFO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 hover:border-amber-500/20 transition-colors">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full" />
              What is Genesis?
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Genesis Collection marks the official launch of ScentProtocol on Arc Mainnet. 
              Each NFT is a unique, AI-generated fragrance formula. Holders receive lifetime 
              priority access to all future events and collaborations.
            </p>
          </div>

          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 hover:border-amber-500/20 transition-colors">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full" />
              Where to view?
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              All minted NFTs instantly appear in your{" "}
              <Link href="/collection" className="text-amber-400 hover:text-amber-300 underline decoration-amber-500/30 underline-offset-4">
                Collection
              </Link>{" "}
              page. They are marked with a special Genesis badge and can be freely traded on the{" "}
              <Link href="/marketplace" className="text-amber-400 hover:text-amber-300 underline decoration-amber-500/30 underline-offset-4">
                Marketplace
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
