"use client";

import Link from "next/link";

/** Decorative bottle. It shows no data, only the mood of the house. */
function HeroBottle() {
  return (
    <div className="relative mx-auto h-[340px] w-[260px] select-none" aria-hidden>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-400/20 via-rose-500/10 to-transparent blur-3xl" />
      <svg viewBox="0 0 220 300" className="hh-float relative h-full w-full drop-shadow-[0_20px_40px_rgba(251,146,60,0.25)]">
        <defs>
          <linearGradient id="hh-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="hh-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fcd34d" />
            <stop offset="0.55" stopColor="#fb923c" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="moleculeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <clipPath id="hh-body">
            <rect x="40" y="96" width="140" height="180" rx="30" />
          </clipPath>
        </defs>
        <rect x="88" y="26" width="44" height="30" rx="6" fill="#d4af37" />
        <rect x="96" y="54" width="28" height="42" rx="4" fill="url(#hh-glass)" stroke="#ffffff" strokeOpacity="0.25" />
        <rect x="40" y="96" width="140" height="180" rx="30" fill="url(#hh-glass)" stroke="#ffffff" strokeOpacity="0.3" />
        <g clipPath="url(#hh-body)">
          <rect x="40" y="150" width="140" height="130" fill="url(#hh-liquid)" opacity="0.9" />
          <path className="hh-wave" d="M0 152 Q 27 140 55 152 T 110 152 T 165 152 T 220 152 V 290 H 0 Z" fill="#fff" opacity="0.14" />
        </g>
        <path d="M58 118 q-6 40 0 120" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
        
        {/* МОЛЕКУЛА АРОМАТА */}
        <g className="molecule-pulse">
          {/* Связи между атомами */}
          <line x1="110" y1="183" x2="110" y2="165" stroke="#fbbf24" strokeWidth="2" opacity="0.7" />
          <line x1="117" y1="200" x2="130" y2="210" stroke="#fbbf24" strokeWidth="2" opacity="0.7" />
          <line x1="103" y1="200" x2="90" y2="210" stroke="#fbbf24" strokeWidth="2" opacity="0.7" />
          
          {/* Верхний атом */}
          <circle cx="110" cy="160" r="6" fill="url(#moleculeGradient)" opacity="0.9" />
          
          {/* Правый атом */}
          <circle cx="133" cy="213" r="6" fill="url(#moleculeGradient)" opacity="0.9" />
          
          {/* Левый атом */}
          <circle cx="87" cy="213" r="6" fill="url(#moleculeGradient)" opacity="0.9" />
          
          {/* Центральный атом (ядро) */}
          <circle cx="110" cy="195" r="10" fill="url(#moleculeGradient)" />
          <circle cx="110" cy="195" r="14" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.4" />
        </g>
      </svg>
      {[
        { label: "Top", cls: "left-[-6px] top-[26%]", d: "0s" },
        { label: "Heart", cls: "right-[-14px] top-[48%]", d: "1.2s" },
        { label: "Base", cls: "left-[2px] bottom-[10%]", d: "2.4s" },
      ].map((c) => (
        <span
          key={c.label}
          className={`hh-float absolute rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur ${c.cls}`}
          style={{ animationDelay: c.d }}
        >
          {c.label}
        </span>
      ))}
      <style>{`
        @keyframes hh-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes hh-wave { from { transform: translateX(0) } to { transform: translateX(-55px) } }
        @keyframes molecule-pulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.85; transform: scale(1.05) } }
        .hh-float { animation: hh-float 7s ease-in-out infinite; }
        .hh-wave { animation: hh-wave 5s linear infinite; }
        .molecule-pulse { animation: molecule-pulse 3s ease-in-out infinite; transform-origin: 110px 195px; }
        @media (prefers-reduced-motion: reduce) { .hh-float, .hh-wave, .molecule-pulse { animation: none; } }
      `}</style>
    </div>
  );
}

export default function Hero() {
  const goToMint = () => document.getElementById("mint-form")?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 animate-fade-up">
      <div className="text-center lg:text-left">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
          Built on Arc
        </p>
        <h1 className="font-display text-balance bg-gradient-to-r from-amber-200 via-orange-300 to-rose-400 bg-clip-text pb-3 text-5xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-6xl lg:text-7xl">
          Digital Perfume House
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
          Craft unique AI-generated fragrances. Every formula is an NFT certificate of ownership.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <button
            onClick={goToMint}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition-all hover:from-amber-400 hover:to-orange-500 hover:shadow-orange-500/30"
          >
            Create your scent
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </button>
          <Link
            href="/marketplace"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
          >
            Explore the marketplace
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50 lg:justify-start">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />USDC is gas</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />Sub-second finality</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />AI descriptions</li>
        </ul>
      </div>

      <div className="hidden lg:block">
        <HeroBottle />
      </div>
    </section>
  );
}
