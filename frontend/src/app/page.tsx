"use client";

import { useState } from "react";
import MintForm from "@/components/MintForm";
import MintReveal from "@/components/MintReveal";
import PerfumeCard from "@/components/PerfumeCard";
import InfoSection from "@/components/InfoSection";
import Logo from "@/components/Logo";
import Confetti from "@/components/Confetti";
import AIAdvisor, { MintContext } from "@/components/AIAdvisor"; // <-- Added MintContext import
import RoadmapSection from "@/components/RoadmapSection";
import { PerfumeData } from "@/utils/contract";

// Interface defining the structure of a newly minted perfume in the local session state
interface MintedPerfume {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
  mood?: string; // Added to store the context mood
}

export default function Home() {
  // State to store all perfumes minted during the current user session
  const [minted, setMinted] = useState<MintedPerfume[]>([]);
  // State to trigger the confetti animation on a successful mint
  const [showConfetti, setShowConfetti] = useState(false);
  // State to hold the token ID of the most recently minted perfume to display the reveal animation
  const [newlyMinted, setNewlyMinted] = useState<number | null>(null);
  // State to handle the fade-out transition of the reveal card
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // NEW: Single state to hold the full MintContext from AI Advisor (replaces separate gender/pType states)
  const [advisorContext, setAdvisorContext] = useState<MintContext | null>(null);

  // Callback function triggered when a new perfume is successfully minted
  const handleMinted = (tokenId: number, perfume: PerfumeData, desc: string, mood?: string) => {
    // 1. Add the new perfume to the beginning of the local session state array
    const newMint: MintedPerfume = { tokenId, perfume, description: desc, mood };
    setMinted((prev) => [newMint, ...prev]);

    // 2. Update local storage to persist the user's collection across page reloads
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
      // Filter out any existing entry with the same tokenId to prevent duplicates
      ...existing.filter((s: any) => s.tokenId !== tokenId),
    ];
    localStorage.setItem("scent_collection", JSON.stringify(updated));

    // 3. Trigger confetti animation for 5 seconds
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);

    // 4. Set the newly minted ID to display the reveal animation instead of the mint form
    setNewlyMinted(tokenId);
    setIsFadingOut(false);
  };

  // NEW: Callback function triggered when the user selects preferences in the AI Advisor
  // Now accepts the full MintContext object instead of separate gender and pType numbers
  const handleAdvisorSelect = (context: MintContext) => {
    // Store the full context (gender, pType, mood, notes, seedString)
    setAdvisorContext(context);
    
    // Smoothly scroll the user down to the Mint Form section
    document.getElementById("mint-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col items-center gap-16 pb-20 w-full">
      {/* Confetti animation component, controlled by the showConfetti state */}
      <Confetti active={showConfetti} />

      {/* Header Section: Contains the Logo and project branding */}
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

      {/* Hero Section: Main title, description, and key network features */}
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

      {/* Info Section: Additional details about the project */}
      <div className="w-full max-w-4xl px-4 animate-fade-up-delay">
        <InfoSection />
      </div>

      {/* Conditional Rendering: Shows the Mint Reveal animation for the newest mint, otherwise shows the Mint Form */}
      <div id="mint-form" className="w-full max-w-xl px-4 animate-fade-up-delay">
        {newlyMinted !== null && minted.length > 0 && minted[0].tokenId === newlyMinted ? (
          // Display the envelope reveal animation for the most recently minted NFT
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
          // Display the standard minting form, passing the full advisor context
          <MintForm 
            onMinted={handleMinted} 
            advisorContext={advisorContext ?? undefined} // <-- Updated prop
          />
        )}
      </div>

      {/* AI Advisor Section: Helps users choose their fragrance profile */}
      <div className="w-full max-w-4xl px-4 animate-fade-up-delay">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Not sure what to create?</h2>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Let our Scent AI Advisor find your perfect fragrance profile based on your mood or occasion.
          </p>
        </div>
        <div className="flex justify-center">
          {/* AIAdvisor now passes the full MintContext object */}
          <AIAdvisor onSelect={handleAdvisorSelect} />
        </div>
      </div>

      {/* Recent Creations Section: Displays a list of previously minted perfumes in the current session (if more than one) */}
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

      {/* Roadmap Section: Displays the project's future development phases */}
      <div className="w-full animate-fade-up-delay">
        <RoadmapSection />
      </div>
    </div>
  );
}
