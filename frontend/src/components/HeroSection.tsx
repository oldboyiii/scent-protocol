"use client";

import Logo from "./Logo";

export default function HeroSection() {
  return (
    <section className="relative text-center max-w-2xl mx-auto py-12 overflow-visible">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-1 h-1 bg-amber-400 rounded-full top-[20%] left-[15%] opacity-60 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full top-[40%] left-[80%] opacity-40 animate-[float_12s_ease-in-out_infinite_2s]" />
        <div className="absolute w-1 h-1 bg-amber-400 rounded-full top-[70%] left-[25%] opacity-50 animate-[float_10s_ease-in-out_infinite_1s]" />
        <div className="absolute w-2 h-2 bg-blue-400 rounded-full top-[15%] left-[60%] opacity-30 animate-[float_14s_ease-in-out_infinite_3s]" />
        <div className="absolute w-1 h-1 bg-amber-400 rounded-full top-[85%] left-[70%] opacity-40 animate-[float_9s_ease-in-out_infinite_4s]" />
      </div>

      {/* Big animated Logo */}
      <div className="flex justify-center mb-8">
        <Logo size={140} animate />
      </div>

      <h1 className="text-5xl md:text-6xl font-bold text-gold mb-6 leading-normal pb-1">
        Digital Perfume House
      </h1>
      <p className="text-lg text-white/60 mb-8 max-w-lg mx-auto leading-relaxed">
        Create unique AI-generated fragrances. Built on Arc. Every formula is an NFT certificate of ownership.
      </p>

      {/* Gold divider */}
      <div className="gold-line w-32 mx-auto mb-8" />

      <div className="flex items-center justify-center gap-6 text-sm text-white/50">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          USDC = gas
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
          Sub-second finality
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
          AI descriptions
        </span>
      </div>
    </section>
  );
}
