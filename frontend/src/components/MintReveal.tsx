"use client";

import { useEffect, useState } from "react";
import PerfumeCard from "./PerfumeCard";
import { PerfumeData } from "@/utils/contract";

interface MintRevealProps {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
  onComplete: () => void;
}

export default function MintReveal({ tokenId, perfume, description, onComplete }: MintRevealProps) {
  const [stage, setStage] = useState<"envelope" | "opening" | "revealed" | "dissolving">("envelope");
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);

  useEffect(() => {
    // Stage 1: Envelope appears (0-1s)
    const t1 = setTimeout(() => setStage("opening"), 1000);
    
    // Stage 2: Card reveals from envelope (1-2.5s)
    const t2 = setTimeout(() => setStage("revealed"), 2500);
    
    // Stage 3: Start dissolving after 10 seconds of showing
    const t3 = setTimeout(() => {
      setStage("dissolving");
      // Generate particles for atom effect
      const colors = ["#fbbf24", "#c084fc", "#60a5fa", "#f472b6", "#34d399"];
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    }, 12500);

    // Stage 4: Complete after dissolve animation
    const t4 = setTimeout(() => onComplete(), 15500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Particles for atom effect */}
      {stage === "dissolving" && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full animate-particle"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                animationDelay: `${p.delay}s`,
                animationDuration: "3s",
                "--tx": `${p.x}px`,
                "--ty": `${p.y}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Envelope */}
      <div
        className={`relative transition-all duration-1000 ${
          stage === "envelope" ? "opacity-100 scale-100" :
          stage === "opening" ? "opacity-100 scale-105" :
          stage === "revealed" ? "opacity-0 scale-75" :
          "opacity-0 scale-50"
        }`}
      >
        <div className="relative w-full aspect-[1.6/1] max-w-md mx-auto">
          {/* Envelope body */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-lg shadow-2xl border-2 border-amber-600/50">
            {/* Envelope pattern */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)`
            }} />
            
            {/* Envelope flap */}
            <div className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-purple-800 to-purple-900 border-b-2 border-amber-600/50 origin-top transition-transform duration-1000 ${
              stage === "opening" ? "rotate-x-180" : ""
            }`} style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transform: stage === "opening" ? "rotateX(180deg)" : "rotateX(0deg)",
            }} />
            
            {/* Wax seal */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg border-4 border-amber-900 flex items-center justify-center transition-all duration-500 ${
              stage === "opening" ? "scale-0 opacity-0 rotate-180" : "scale-100 opacity-100"
            }`}>
              <div className="text-amber-200 font-bold text-2xl">SP</div>
            </div>
            
            {/* Envelope text */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-amber-400/80 text-sm font-serif italic">ScentProtocol</p>
              <p className="text-amber-300/60 text-xs font-serif">Exclusive Delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Card */}
      <div
        className={`relative transition-all duration-1000 ${
          stage === "envelope" ? "opacity-0 scale-50 translate-y-20" :
          stage === "opening" ? "opacity-0 scale-75 translate-y-10" :
          stage === "revealed" ? "opacity-100 scale-100 translate-y-0 animate-card-glow" :
          "opacity-0 scale-110 blur-lg"
        }`}
      >
        {stage !== "envelope" && stage !== "opening" && (
          <>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-2">Mint Successful!</h3>
              <p className="text-white/60 text-sm">Your unique fragrance has been created</p>
            </div>
            <PerfumeCard
              tokenId={tokenId}
              perfume={perfume}
              aiDescription={description}
              highlight={true}
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes card-glow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.2);
          }
          50% {
            box-shadow: 0 0 50px rgba(251, 191, 36, 0.5), 0 0 100px rgba(251, 191, 36, 0.3);
          }
        }
        .animate-card-glow {
          animation: card-glow 2s ease-in-out infinite;
        }
        
        @keyframes particle {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
            opacity: 0;
          }
        }
        .animate-particle {
          animation: particle 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
