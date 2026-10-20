"use client";

import { useState } from "react";
import Link from "next/link"; // <-- Добавлен импорт для ссылки
import MintForm from "@/components/MintForm";
import MintReveal from "@/components/MintReveal";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import Logo from "@/components/Logo";
import Confetti from "@/components/Confetti";
import AIAdvisor, { MintContext } from "@/components/AIAdvisor";
import RoadmapSection from "@/components/RoadmapSection";
import { PerfumeData } from "@/utils/contract";

interface MintedPerfume {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
  mood?: string;
}

export default function Home() {
  const [minted, setMinted] = useState<MintedPerfume[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyMinted, setNewlyMinted] = useState<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [advisorContext, setAdvisorContext] = useState<MintContext | null>(null);

  const handleMinted = (tokenId: number, perfume: PerfumeData, desc: string, mood?: string) => {
    const newMint: MintedPerfume = { tokenId, perfume, description: desc, mood };
    setMinted((prev) => [newMint, ...prev]);

    const existing = JSON.parse(localStorage.getItem("scent_collection") || "[]");
    const updated = [
      {
        tokenId,
        name: perfume.name,
        rarity: perfume.rarity,
        timestamp: Date.now(),
        mood: mood,
        perfume: {
          name: perfume.name,
          gender: perfume.gender,
          pType: perfume.pType,
          topNotes: perfume.topNotes,
          heartNotes: perfume.heartNotes,
          baseNotes: perfume.baseNotes,
          concentration: perfume.concentration,
          rarity: perfume.rarity,
          createdAt: perfume.createdAt,
          creator: perfume.creator,
        },
        description: desc,
      },
      ...existing.filter((s: any) => s.tokenId !== tokenId),
    ];
    localStorage.setItem("scent_collection", JSON.stringify(updated));

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);

    setNewlyMinted(tokenId);
    setIsFadingOut(false);
  };

  const handleAdvisorSelect = (context: MintContext) => {
    setAdvisorContext(context);
    document.getElementById("mint-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col items-center gap-16 pb-20 w-full">
      <Confetti active={showConfetti} />

      {/* Header Section */}
      <div className="w-full max-w-4xl px-4 animate-fade-up">
        <div className="glass-card flex items-center justify-between px-6 py-4">
          <Logo size={36} />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">ScentProtocol</p>
              <p className="text-xs text-white/50">Built on Arc</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto px-4 animate-fade-up pt-4">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent mb-8 pb-4 leading-none">
          Digital Perfume House
        </h1>
        
        <p className="text-lg text-white/70 mb-8">
          Create unique AI-generated fragrances. Built on Arc. Every formula is an NFT certificate of ownership.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50 mt-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            USDC = gas
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
            Sub-second finality
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
            AI descriptions
          </span>
        </div>
      </section>

      {/* Info Section */}
      <div className="w-full max-w-4xl px-4 animate-fade-up-delay">
        <InfoSection />
      </div>

      {/* Mint Form / Reveal Section */}
      <div id="mint-form" className="w-full max-w-xl px-4 animate-fade-up-delay">
        {newlyMinted !== null && minted.length > 0 && minted[0].tokenId === newlyMinted ? (
          <MintReveal
            tokenId={minted[0].tokenId}
            perfume={minted[0].perfume}
            description={minted[0].description}
            onComplete={() => {
              setNewlyMinted(null);
              setIsFadingOut(false);
            }}
          />
        ) : (
          <MintForm 
            onMinted={handleMinted} 
            advisorContext={advisorContext ?? undefined}
          />
        )}
      </div>

      {/* AI Advisor Section */}
      <div className="w-full max-w-4xl px-4 animate-fade-up-delay">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Not sure what to create?</h2>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Let our Scent AI Advisor find your perfect fragrance profile based on your mood or occasion.
          </p>
        </div>
        <div className="flex justify-center">
          <AIAdvisor onSelect={handleAdvisorSelect} />
        </div>
      </div>

      {/* 🚀 NEW: Viral Wallet Scent Banner 🚀 */}
      <Link href="/wallet-scent" className="w-full max-w-4xl px-4 group animate-fade-up-delay">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20 p-1 transition-all duration-300 hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]">
          
          {/* Decorative background glows */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Inner glass card */}
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl bg-[#0a0a1a]/60 backdrop-blur-xl p-6 md:p-8">
            
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
                <span>🔮</span> Viral Experiment
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What's Your Wallet's Scent?
              </h3>
              <p className="text-white/60 text-sm md:text-base max-w-lg">
                We analyzed millions of transactions to create a unique fragrance profile for your wallet. 
                Discover your crypto archetype (Degen, Diamond Hands, Whale...) and mint it as a limited NFT.
              </p>
            </div>

            {/* CTA Button */}
            <div className="relative z-10 flex-shrink-0">
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all duration-300">
                <span>Analyze My Wallet</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {/* 🚀 END: Viral Wallet Scent Banner 🚀 */}

      {/* Recent Creations Section */}
      {minted.length > 1 && (
        <div className="w-full max-w-md px-4 space-y-4 animate-fade-up-delay">
          <h3 className="text-xl font-bold text-white text-center mb-4">Your Recent Creations</h3>
          {minted.slice(1).map((item) => (
            <PerfumeCard
              key={item.tokenId}
              tokenId={item.tokenId}
              perfume={item.perfume}
              aiDescription={item.description}
            />
          ))}
        </div>
      )}

      {/* Roadmap Section */}
      <div className="w-full animate-fade-up-delay">
        <RoadmapSection />
      </div>
    </div>
  );
}
