"use client";

import { useState } from "react";
import WalletButton from "@/components/WalletButton";
import MintForm from "@/components/MintForm";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import { PerfumeData } from "@/utils/contract";

interface MintedPerfume {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
}

export default function Home() {
  const [perfumes, setPerfumes] = useState<MintedPerfume[]>([]);

  const handleMinted = (tokenId: number, perfume: PerfumeData, description: string) => {
    setPerfumes((prev) => [{ tokenId, perfume, description }, ...prev]);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-scent-gold to-scent-oud flex items-center justify-center text-lg font-bold">
              🜂
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ScentProtocol</h1>
              <p className="text-xs text-white/50">Built on Arc</p>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-scent-gold via-white to-scent-rose bg-clip-text text-transparent">
          Digital Perfume House
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
          Create unique AI-generated fragrances. Built on Arc.
          Every formula is an NFT certificate of ownership.
        </p>
        <div className="flex justify-center gap-4 text-sm text-white/40">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            USDC = gas
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Sub-second finality
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            AI descriptions
          </span>
        </div>
      </section>

      <InfoSection />

      {/* Mint Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16 flex justify-center">
        <MintForm onMinted={handleMinted} />
      </section>

      {/* Collection */}
      {perfumes.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <h3 className="text-2xl font-bold mb-8 text-center">Your Collection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perfumes.map((p) => (
              <PerfumeCard
                key={p.tokenId}
                tokenId={p.tokenId}
                perfume={p.perfume}
                aiDescription={p.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/30">
        <p>ScentProtocol • Built on Arc • 2026</p>
      </footer>
    </main>
  );
}
