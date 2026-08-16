"use client";

import { useState } from "react";
import MintForm from "@/components/MintForm";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import Logo from "@/components/Logo";
import WalletButton from "@/components/WalletButton";
import Confetti from "@/components/Confetti";
import { PerfumeData } from "@/utils/contract";

interface MintedPerfume {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
}

export default function Home() {
  const [minted, setMinted] = useState<MintedPerfume[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleMinted = (tokenId: number, perfume: PerfumeData, desc: string) => {
    setMinted((prev) => [...prev, { tokenId, perfume, description: desc }]);

      // === СОХРАНЕНИЕ В localStorage (полная карточка) ===
  const existing = JSON.parse(localStorage.getItem("scent_collection") || "[]");
  const updated = [
    {
      tokenId,
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
      timestamp: Date.now(),
    },
    ...existing.filter((s: any) => s.tokenId !== tokenId),
  ];
  localStorage.setItem("scent_collection", JSON.stringify(updated));
  // =====================================================

    // Конфетти
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  return (
    <div className="flex flex-col items-center gap-8 pt-20">
      <Confetti active={showConfetti} />

      {/* Inner Header */}
      <div className="w-full max-w-4xl animate-fade-up">
        <div className="glass-card flex items-center justify-between px-6 py-4">
          <Logo size={36} />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">ScentProtocol</p>
              <p className="text-xs text-white/50">Built on Arc</p>
            </div>
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="text-center max-w-2xl mx-auto mt-8 animate-fade-up overflow-visible">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent mb-6 leading-[1.5] pb-3 block overflow-visible">
          Digital Perfume House
        </h1>
        <p className="text-lg text-white/70 mb-6">
          Create unique AI-generated fragrances. Built on Arc. Every formula is an NFT certificate of ownership.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            USDC = gas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Sub-second finality
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            AI descriptions
          </span>
        </div>
      </section>

      {/* Info Section */}
      <div className="w-full animate-fade-up-delay">
        <InfoSection />
      </div>

      {/* Mint Form */}
      <div className="animate-fade-up-delay">
        <MintForm onMinted={handleMinted} />
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
    </div>
  );
}
