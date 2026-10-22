"use client";

import { useEffect, useState } from "react";
import { PerfumeData } from "@/utils/contract";
import ScentCrest from "@/components/ScentCrest"; // NEW: Import the crest component

interface MintRevealProps {
  tokenId: number;
  perfume: PerfumeData;
  description: string;
  onComplete: () => void;
}

// Helper constants for the premium card styling
const RARITY_HEX: Record<number, string> = { 0: "#94a3b8", 1: "#60a5fa", 2: "#c084fc", 3: "#fbbf24" };
const RARITY_BG: Record<number, string> = { 0: "#0f172a", 1: "#0c1222", 2: "#110c22", 3: "#1a1005" };
const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"];
const GENDER = ["Unisex", "Male", "Female"];
const TYPE = ["Parfum", "EDP", "EDT", "EDC"];

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
    
    // Stage 3: Start dissolving after 10 seconds of being revealed (14s total)
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

    // Stage 4: Complete after dissolve (18s total)
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
          {/* Envelope body with paper texture - NOBLE COLORS */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 rounded-lg shadow-2xl border-4 border-amber-700/50">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }} />
            
            {/* Envelope flap */}
            <div 
              className={`absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-purple-800 to-indigo-900 border-b-4 border-amber-700/50 origin-top transition-all duration-2000 ease-in-out ${
                stage === "opening" ? "seal-breaking" : ""
              }`}
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transform: stage === "opening" ? "rotateX(180deg)" : "rotateX(0deg)",
                zIndex: 30,
              }}
            >
              {/* Wax seal - NO LETTERS */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-all duration-1000 ${
                stage === "opening" ? "seal-breaking" : ""
              }`}>
                {/* Seal outer ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-900 via-red-950 to-red-950 shadow-lg border-4 border-red-950">
                  {/* Wax texture overlay */}
                  <div className="absolute inset-0 rounded-full opacity-30" style={{
                    backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,200,150,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(100,50,50,0.3) 0%, transparent 40%)`,
                  }} />
                  {/* Inner decorative circle - NO LETTERS */}
                  <div className="absolute inset-3 rounded-full border-2 border-red-950/50" />
                  <div className="absolute inset-5 rounded-full border border-red-900/30" />
                </div>
                {/* Seal breaking pieces */}
                {stage === "opening" && (
                  <>
                    <div className="absolute top-2 left-1/2 w-8 h-8 bg-red-900 rounded-full animate-seal-piece-1 shadow-lg" />
                    <div className="absolute bottom-3 right-1/2 w-6 h-6 bg-red-800 rounded-full animate-seal-piece-2 shadow-lg" />
                    <div className="absolute top-1/2 left-2 w-7 h-7 bg-red-950 rounded-full animate-seal-piece-3 shadow-lg" />
                    <div className="absolute bottom-1 left-1/3 w-5 h-5 bg-red-900 rounded-full animate-seal-piece-4 shadow-lg" />
                  </>
                )}
              </div>
            </div>
            
            {/* Envelope front */}
            <div className="absolute bottom-0 left-0 right-0 top-[140px]">
              <div className="absolute inset-2 border-2 border-amber-700/20 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Premium NFT Card - emerges from envelope */}
      <div
        className={`absolute transition-all duration-2000 ${
          stage === "envelope" ? "opacity-0 scale-50 translate-y-32 z-0" :
          stage === "opening" ? "opacity-0 scale-75 translate-y-10 z-10" :
          stage === "revealed" ? "opacity-100 scale-100 translate-y-0 z-20 animate-card-float" :
          "opacity-0 scale-110 translate-y-0 z-10 blur-md"
        }`}
      >
        {stage !== "envelope" && (
          <div
            className="relative rounded-2xl p-6 w-[380px] text-left overflow-hidden backdrop-blur-md border"
            style={{
              background: `linear-gradient(135deg, ${RARITY_HEX[perfume.rarity]}15 0%, ${RARITY_BG[perfume.rarity]} 100%)`,
              borderColor: `${RARITY_HEX[perfume.rarity]}50`,
              boxShadow: `0 0 40px ${RARITY_HEX[perfume.rarity]}30`
            }}
          >
            {/* Shimmer overlay */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                background: `linear-gradient(105deg, transparent 40%, ${RARITY_HEX[perfume.rarity]}15 50%, transparent 60%)`, 
                backgroundSize: "200% 100%", 
                animation: "shimmer 2.5s infinite" 
              }} 
            />

            <div className="relative flex items-center gap-4 mb-4">
              <ScentCrest
                seed={`${perfume.creator}-${perfume.name}`}
                name={perfume.name}
                rarity={perfume.rarity}
                size={60}
              />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Scent #{tokenId}</p>
                <h4 className="text-xl font-bold text-white">{perfume.name}</h4>
              </div>
            </div>

            <div className="relative flex flex-wrap gap-2 text-xs mb-4">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">{GENDER[perfume.gender]}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">{TYPE[perfume.pType]}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">{perfume.concentration}%</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-semibold" style={{ color: RARITY_HEX[perfume.rarity], borderColor: `${RARITY_HEX[perfume.rarity]}40` }}>
                {RARITY_LABELS[perfume.rarity]}
              </span>
            </div>

            <div className="relative space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-white/40 text-xs w-14 shrink-0 uppercase">Top</span>
                <span className="text-white/80 text-xs">{perfume.topNotes.join(", ")}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white/40 text-xs w-14 shrink-0 uppercase">Heart</span>
                <span className="text-white/80 text-xs">{perfume.heartNotes.join(", ")}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white/40 text-xs w-14 shrink-0 uppercase">Base</span>
                <span className="text-white/80 text-xs">{perfume.baseNotes.join(", ")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes seal-breaking {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          40% { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(0) rotate(-15deg); opacity: 0; }
        }
        .seal-breaking { animation: seal-breaking 1.5s ease-in forwards; }
        
        @keyframes seal-piece-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(60px, -100px) scale(0.2); opacity: 0; }
        }
        .animate-seal-piece-1 { animation: seal-piece-1 1.5s ease-out 0.3s forwards; }
        
        @keyframes seal-piece-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50px, 80px) scale(0.2); opacity: 0; }
        }
        .animate-seal-piece-2 { animation: seal-piece-2 1.5s ease-out 0.4s forwards; }
        
        @keyframes seal-piece-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-80px, -50px) scale(0.2); opacity: 0; }
        }
        .animate-seal-piece-3 { animation: seal-piece-3 1.5s ease-out 0.5s forwards; }
        
        @keyframes seal-piece-4 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(40px, 60px) scale(0.2); opacity: 0; }
        }
        .animate-seal-piece-4 { animation: seal-piece-4 1.5s ease-out 0.6s forwards; }
        
        @keyframes card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-card-float { animation: card-float 3s ease-in-out infinite; }
        
        @keyframes scent-molecule {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          20% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.2) rotate(var(--rotation)); opacity: 0; }
        }
        .animate-scent-molecule { animation: scent-molecule 4s ease-out forwards; }
        
        @keyframes molecule-label {
          0%, 30% { opacity: 0; transform: translateY(0); }
          50%, 80% { opacity: 0.8; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-molecule-label { animation: molecule-label 4s ease-out forwards; animation-delay: inherit; }
      `}</style>
    </div>
  );
}
