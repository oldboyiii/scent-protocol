"use client";

import { useState } from "react";
import MintForm from "@/components/MintForm";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import WalletButton from "@/components/WalletButton";
import { PerfumeData } from "@/utils/contract";

interface MintedPerfume {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
}

export default function Home() {
  const [minted, setMinted] = useState<MintedPerfume[]>([]);

  const handleMinted = (tokenId: number, perfume: PerfumeData, desc: string) => {
    setMinted((prev) => [...prev, { tokenId, perfume, description: desc }]);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Inner Header — как было */}
      <div className="w-full max-w-4xl">
        <div className="glass-card flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="50%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <filter id="logoGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M35 25 L65 25 L65 30 L60 35 L60 75 C60 82 55 88 50 88 C45 88 40 82 40 75 L40 35 L35 30 Z"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="3"
                filter="url(#logoGlow)"
              />
              <rect x="42" y="18" width="16" height="7" rx="2" fill="url(#logoGrad)" />
              <circle cx="50" cy="12" r="4" fill="url(#logoGrad)" />
              <path
                d="M50 50 C50 50 42 62 42 68 C42 73 46 77 50 77 C54 77 58 73 58 68 C58 62 50 50 50 50Z"
                fill="url(#logoGrad)"
                opacity="0.6"
              />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-white">ScentProtocol</span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">AI Perfume House</span>
            </div>
          </div>
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
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent mb-6">
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

      <MintForm onMinted={handleMinted} />

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

      <InfoSection />
    </div>
  );
}
