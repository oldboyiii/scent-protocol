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
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    delay: number;
    note: string;
  }>>([]);

  useEffect(() => {
    // Stage 1: Envelope appears (0-1.5s)
    const t1 = setTimeout(() => setStage("opening"), 1500);
    
    // Stage 2: Seal breaks and card reveals (1.5-4s)
    const t2 = setTimeout(() => setStage("revealed"), 4000);
    
    // Stage 3: Start dissolving after 10 seconds
    const t3 = setTimeout(() => {
      setStage("dissolving");
      // Generate scent molecule particles
      const colors = ["#fbbf24", "#c084fc", "#60a5fa", "#f472b6", "#34d399", "#fb923c"];
      const newParticles = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 1.5,
        note: perfume.topNotes[i % 3] || perfume.heartNotes[i % 3] || perfume.baseNotes[i % 3],
      }));
      setParticles(newParticles);
    }, 14000);

    // Stage 4: Complete after dissolve
    const t4 = setTimeout(() => onComplete(), 18000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete, perfume]);

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[600px] flex items-center justify-center">
      {/* Particles for scent molecule effect */}
      {stage === "dissolving" && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full animate-scent-molecule"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}40`,
                animationDelay: `${p.delay}s`,
                animationDuration: "4s",
                "--tx": `${p.x}px`,
                "--ty": `${p.y}px`,
                "--rotation": `${Math.random() * 360}deg`,
              } as React.CSSProperties}
            >
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-white/60 whitespace-nowrap opacity-0 animate-molecule-label">
                {p.note}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Retro Envelope */}
      <div
        className={`relative transition-all duration-1000 ${
          stage === "envelope" ? "opacity-100 scale-100" :
          stage === "opening" ? "opacity-100 scale-100" :
          stage === "revealed" ? "opacity-0 scale-90" :
          "opacity-0 scale-75"
        }`}
      >
        <div className="relative w-[400px] h-[280px]">
          {/* Envelope body with paper texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 rounded-lg shadow-2xl border-4 border-amber-800/30">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }} />
            
            {/* Envelope flap */}
            <div 
              className={`absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-amber-200 to-amber-300 border-b-4 border-amber-800/30 origin-top transition-all duration-2000 ease-in-out ${
                stage === "opening" ? "seal-breaking" : ""
              }`}
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transform: stage === "opening" ? "rotateX(180deg)" : "rotateX(0deg)",
                zIndex: 30,
              }}
            >
              {/* Wax seal */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-all duration-1000 ${
                stage === "opening" ? "seal-breaking" : ""
              }`}>
                {/* Seal outer ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-800 via-red-900 to-red-950 shadow-lg border-4 border-red-950">
                  {/* Seal inner design */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                    <span className="text-amber-200 font-bold text-3xl font-serif">SP</span>
                  </div>
                  {/* Seal edge detail */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-950/50" />
                </div>
                {/* Seal breaking pieces */}
                {stage === "opening" && (
                  <>
                    <div className="absolute top-0 left-1/2 w-8 h-8 bg-red-900 rounded-full animate-seal-piece-1" />
                    <div className="absolute bottom-0 right-1/2 w-6 h-6 bg-red-800 rounded-full animate-seal-piece-2" />
                    <div className="absolute top-1/2 left-0 w-6 h-6 bg-red-950 rounded-full animate-seal-piece-3" />
                  </>
                )}
              </div>
            </div>
            
            {/* Envelope front pattern */}
            <div className="absolute bottom-0 left-4 right-4 top-20">
              <div className="absolute inset-0 border-2 border-amber-800/20 rounded" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-900/30 font-serif text-lg">
                ScentProtocol
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Card - emerges from envelope */}
      <div
        className={`absolute transition-all duration-2000 ${
          stage === "envelope" ? "opacity-0 scale-50 translate-y-32 z-0" :
          stage === "opening" ? "opacity-0 scale-75 translate-y-16 z-10" :
          stage === "revealed" ? "opacity-100 scale-100 translate-y-0 z-20 animate-card-float" :
          "opacity-0 scale-110 translate-y-0 z-10 blur-md"
        }`}
      >
        {stage !== "envelope" && (
          <div className="relative">
            {/* Success message */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-emerald-400 mb-2">Mint Successful!</h3>
              <p className="text-white/60 text-sm">Your unique fragrance has been created</p>
            </div>
            
            <PerfumeCard
              tokenId={tokenId}
              perfume={perfume}
              aiDescription={description}
              highlight={true}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes seal-breaking {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
        }
        .seal-breaking {
          animation: seal-breaking 1.5s ease-in forwards;
        }
        
        @keyframes seal-piece-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(50px, -80px) scale(0.3); opacity: 0; }
        }
        .animate-seal-piece-1 {
          animation: seal-piece-1 1.5s ease-out forwards;
        }
        
        @keyframes seal-piece-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-40px, 60px) scale(0.3); opacity: 0; }
        }
        .animate-seal-piece-2 {
          animation: seal-piece-2 1.5s ease-out 0.2s forwards;
        }
        
        @keyframes seal-piece-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-60px, -40px) scale(0.3); opacity: 0; }
        }
        .animate-seal-piece-3 {
          animation: seal-piece-3 1.5s ease-out 0.3s forwards;
        }
        
        @keyframes card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-card-float {
          animation: card-float 3s ease-in-out infinite;
        }
        
        @keyframes scent-molecule {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.2) rotate(var(--rotation));
            opacity: 0;
          }
        }
        .animate-scent-molecule {
          animation: scent-molecule 4s ease-out forwards;
        }
        
        @keyframes molecule-label {
          0%, 30% {
            opacity: 0;
            transform: translateY(0);
          }
          50%, 80% {
            opacity: 0.8;
            transform: translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        .animate-molecule-label {
          animation: molecule-label 4s ease-out forwards;
          animation-delay: inherit;
        }
      `}</style>
    </div>
  );
}
