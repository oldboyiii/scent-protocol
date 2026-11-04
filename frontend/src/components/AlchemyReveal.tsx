"use client";

import { useEffect, useState } from "react";

interface AlchemyRevealProps {
  parent1Name: string;
  parent2Name: string;
  onComplete: () => void;
}

export default function AlchemyReveal({ parent1Name, parent2Name, onComplete }: AlchemyRevealProps) {
  const [stage, setStage] = useState<"fusing" | "flash" | "success">("fusing");

  useEffect(() => {
    // Stage 1: Fusing (0-2s)
    const t1 = setTimeout(() => setStage("flash"), 2000);
    // Stage 2: Flash/Explosion (2-2.5s)
    const t2 = setTimeout(() => setStage("success"), 2500);
    // Stage 3: Auto-complete after 5 seconds of showing success
    const t3 = setTimeout(() => onComplete(), 7500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-teal-900/20 pointer-events-none" />

      {/* STAGE 1: FUSING */}
      {stage === "fusing" && (
        <div className="relative flex flex-col items-center gap-8 animate-fade-in">
          <div className="flex items-center gap-8">
            {/* Parent 1 Orb */}
            <div className="w-24 h-24 rounded-full bg-slate-800/80 border-2 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-pulse">
              <span className="text-xs text-white/60 text-center px-2 truncate max-w-[80px]">{parent1Name}</span>
            </div>
            
            {/* Alchemy Symbol */}
            <div className="text-4xl text-cyan-400 animate-spin-slow">⚗️</div>
            
            {/* Parent 2 Orb */}
            <div className="w-24 h-24 rounded-full bg-slate-800/80 border-2 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-pulse" style={{ animationDelay: "0.5s" }}>
              <span className="text-xs text-white/60 text-center px-2 truncate max-w-[80px]">{parent2Name}</span>
            </div>
          </div>
          <p className="text-cyan-300 font-semibold tracking-widest uppercase animate-pulse">Fusing Fragrances...</p>
        </div>
      )}

      {/* STAGE 2: FLASH */}
      {stage === "flash" && (
        <div className="absolute inset-0 bg-cyan-400 animate-flash pointer-events-none z-[201]" />
      )}

      {/* STAGE 3: SUCCESS */}
      {stage === "success" && (
        <div className="relative z-[202] flex flex-col items-center animate-scale-in">
          {/* Success Card */}
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-teal-900/60 to-slate-900/80 border border-cyan-500/50 shadow-[0_0_60px_rgba(34,211,238,0.3)] backdrop-blur-xl max-w-sm w-full text-center">
            
            {/* Decorative spinning ring */}
            <div className="absolute -inset-1 rounded-2xl border border-dashed border-cyan-400/30 animate-spin-slow pointer-events-none" />
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                <svg className="w-10 h-10 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Hybrid Forged!</h2>
              <p className="text-cyan-200/80 text-sm mb-6">
                A unique new fragrance has been created from the essence of your previous scents.
              </p>
              
              <div className="p-4 rounded-xl bg-black/30 border border-cyan-500/20 mb-6">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Potential Rarity Upgrade</p>
                <div className="flex justify-center gap-2">
                  <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs border border-cyan-500/40">15% Chance</span>
                </div>
              </div>

              <button
                onClick={onComplete}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
              >
                View in Collection →
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-flash { animation: flash 0.5s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
}
