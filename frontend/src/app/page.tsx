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
  const [advisorGender, setAdvisorGender] = useState<number | null>(null);
  const [advisorType, setAdvisorType] = useState<number | null>(null);

  const handleMinted = (tokenId: number, perfume: PerfumeData, desc: string) => {
    setMinted((prev) => [...prev, { tokenId, perfume, description: desc }]);

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
  };

  const handleAdvisorSelect = (gender: number, pType: number) => {
    setAdvisorGender(gender);
    setAdvisorType(pType);
    // Smooth scroll to the mint form
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
<section className="text-center max-w-3xl mx-auto px-4 animate-fade-up">
  {/* Added pb-4 and increased gap to prevent letter clipping */}
  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent mb-6 pb-2 leading-none">
    Digital Perfume House
  </h1>
  
  {/* Increased gap from mb-6 to mb-8 */}
  <p className="text-lg text-white/70 mb-8">
    Create unique AI-generated fragrances. Built on Arc. Every formula is an NFT certificate of ownership.
  </p>
  
  {/* Added mt-4 for extra spacing */}
  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50 mt-4">
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

      {/* Info Section (Explains the project first) */}
      <div className="w-full max-w-4xl px-4 animate-fade-up-delay">
        <InfoSection />
      </div>

      {/* Mint Form (Primary Call to Action) */}
      <div id="mint-form" className="w-full max-w-xl px-4 animate-fade-up-delay">
        <MintForm 
          onMinted={handleMinted} 
          defaultGender={advisorGender ?? undefined}
          defaultType={advisorType ?? undefined}
        />
      </div>

      {/* AI Advisor (Helper tool, placed AFTER the main form) */}
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

      {/* Minted Cards (Recent Activity) */}
      {minted.length > 0 && (
        <div className="w-full max-w-md px-4 space-y-4 animate-fade-up-delay">
          <h3 className="text-xl font-bold text-white text-center mb-4">Your Recent Creations</h3>
          {minted.map((item) => (
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
    </div>
  );
}
