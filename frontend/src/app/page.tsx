"use client";

import { useState } from "react";
import MintForm from "@/components/MintForm";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import Logo from "@/components/Logo";
import Confetti from "@/components/Confetti";
import AIAdvisor from "@/components/AIAdvisor";
import RoadmapSection from "@/components/RoadmapSection";
import { PerfumeData } from "@/utils/contract";

interface MintedPerfume {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
}

export default function Home() {
  const [minted, setMinted] = useState<MintedPerfume[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyMinted, setNewlyMinted] = useState<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [advisorGender, setAdvisorGender] = useState<number | null>(null);
  const [advisorType, setAdvisorType] = useState<number | null>(null);

  const handleMinted = (tokenId: number, perfume: PerfumeData, desc: string) => {
    const newMint: MintedPerfume = { tokenId, perfume, description: desc };
    setMinted((prev) => [newMint, ...prev]);

    const existing = JSON.parse(localStorage.getItem("scent_collection") || "[]");
    const updated = [
      {
        tokenId,
        name: perfume.name,
        rarity: perfume.rarity,
        timestamp: Date.now(),
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

    // Show newly minted card with animation
    setNewlyMinted(tokenId);
    setIsFadingOut(false);

    // Auto-hide after 10 seconds with smooth fade-out
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setNewlyMinted(null);
        setIsFadingOut(false);
      }, 1000);
    }, 10000);
  };

  const handleAdvisorSelect = (gender: number, pType: number) => {
    setAdvisorGender(gender);
    setAdvisorType(pType);
    document.getElementById("mint-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col items-center gap-16 pb-20 w-full">
      <Confetti active={showConfetti} />

      {/* Header */}
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

      {/* Mint Form */}
      <div id="mint-form" className="w-full max-w-xl px-4 animate-fade-up-delay">
        <MintForm 
          onMinted={handleMinted} 
          defaultGender={advisorGender ?? undefined}
          defaultType={advisorType ?? undefined}
        />
      </div>

      {/* Newly Minted NFT - Appears RIGHT AFTER mint form with smooth animation */}
      {newlyMinted !== null && minted.length > 0 && minted[0].tokenId === newlyMinted && (
        <div 
          className={`w-full max-w-xl px-4 transition-all duration-1000 ease-in-out ${
            isFadingOut 
              ? "opacity-0 translate-y-8 scale-95 blur-sm" 
              : "opacity-100 translate-y-0 scale-100 animate-reveal"
          }`}
        >
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center animate-pulse">
                <svg 
                  className="w-12 h-12 text-emerald-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-emerald-400 mb-2">Mint Successful!</h3>
            <p className="text-white/60 text-sm">Your unique fragrance has been created and secured on-chain</p>
            <p className="text-white/40 text-xs mt-2">This card will disappear in 10 seconds</p>
          </div>
          <PerfumeCard
            tokenId={minted[0].tokenId}
            perfume={minted[0].perfume}
            aiDescription={minted[0].description}
            highlight={true}
          />
        </div>
      )}

      {/* AI Advisor */}
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

      {/* All Minted Cards - Only show if more than 1 mint */}
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

      {/* Roadmap */}
      <div className="w-full animate-fade-up-delay">
        <RoadmapSection />
      </div>

      <style>{`
        @keyframes reveal {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.9);
            filter: blur(10px);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .animate-reveal {
          animation: reveal 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
