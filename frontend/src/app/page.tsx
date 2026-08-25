"use client";

import { useState } from "react";
import MintForm from "@/components/MintForm";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import Logo from "@/components/Logo";
import WalletButton from "@/components/WalletButton";
import Confetti from "@/components/Confetti";
import AIAdvisor from "@/components/AIAdvisor";
import RoadmapSection from "@/components/RoadmapSection";
import HeroSection from "@/components/HeroSection";
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
    document.getElementById("mint-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <Confetti active={showConfetti} />

      {/* Inner Header */}
      <div className="w-full max-w-4xl animate-fade-up">
        <div className="glass-card flex items-center justify-between px-6 py-4">
          <Logo size={36} showText />
          <div className="flex items-center gap-4">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Hero with animated logo */}
      <HeroSection />

      {/* AI Advisor */}
      <div className="w-full flex justify-center animate-fade-up-delay">
        <AIAdvisor onSelect={handleAdvisorSelect} />
      </div>

      {/* Info Section */}
      <div className="w-full animate-fade-up-delay">
        <InfoSection />
      </div>

      {/* Mint Form */}
      <div id="mint-form" className="animate-fade-up-delay w-full flex justify-center">
        <MintForm 
          onMinted={handleMinted} 
          defaultGender={advisorGender ?? undefined}
          defaultType={advisorType ?? undefined}
        />
      </div>

      {/* Minted Cards */}
      {minted.length > 0 && (
        <div className="w-full max-w-md space-y-4">
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
      <RoadmapSection />
    </div>
  );
}
